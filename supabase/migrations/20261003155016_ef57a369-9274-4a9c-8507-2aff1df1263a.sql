-- ============ Enums ============
create type public.category_type as enum ('Fixed','Variable','Giving','Savings');
create type public.leftover_mode as enum ('same','drop','move');
create type public.goal_priority as enum ('High','Medium','Low');
create type public.recurring_frequency as enum ('Monthly','Quarterly','Half-yearly','Yearly','One-time');
create type public.zakat_basis as enum ('Silver','Gold');
create type public.zakat_line_kind as enum ('asset','liability');

-- ============ Helpers ============
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Per-user row cap. TG_ARGV[0] = max rows.
create or replace function public.enforce_row_limit()
returns trigger language plpgsql set search_path = public as $$
declare n int;
begin
  execute format('select count(*) from %I.%I where user_id = $1', tg_table_schema, tg_table_name)
    into n using new.user_id;
  if n >= tg_argv[0]::int then
    raise exception 'Limit reached: you can have at most % rows in %', tg_argv[0], tg_table_name;
  end if;
  return new;
end; $$;

-- ============ profiles ============
create table public.profiles (
  user_id uuid primary key default auth.uid(),
  name text check (name is null or char_length(name) <= 60),
  currency text not null default 'USD' check (char_length(currency) between 1 and 8),
  plan_start date not null default date_trunc('month', current_date)::date,
  selected_month date not null default date_trunc('month', current_date)::date,
  locale text not null default 'en',
  modules jsonb not null default '{"ramadan":false,"qurbani":false,"hajj":false}'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Own profile" on public.profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.normalize_profile_months()
returns trigger language plpgsql set search_path = public as $$
begin
  new.plan_start = date_trunc('month', new.plan_start)::date;
  new.selected_month = date_trunc('month', new.selected_month)::date;
  return new;
end; $$;
create trigger profiles_normalize before insert or update on public.profiles
  for each row execute function public.normalize_profile_months();
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ goals ============
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  target numeric(14,2) check (target is null or target >= 0),
  opening_saved numeric(14,2) not null default 0,
  auto_count boolean not null default false,
  priority public.goal_priority not null default 'Medium',
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

-- ============ categories ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(btrim(name)) between 1 and 40 and name not in ('Same category','Drop it')),
  type public.category_type not null,
  planned numeric(14,2) not null default 0 check (planned >= 0),
  leftover_mode public.leftover_mode not null default 'same',
  leftover_category_id uuid,
  goal_id uuid,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id),
  check (leftover_category_id is null or leftover_category_id <> id),
  foreign key (leftover_category_id, user_id) references public.categories (id, user_id) on delete set null (leftover_category_id),
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete set null (goal_id)
);

-- ============ accounts ============
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(btrim(name)) between 1 and 30),
  opening_balance numeric(14,2) not null default 0,
  minimum_balance numeric(14,2) not null default 0 check (minimum_balance >= 0),
  actual_balance numeric(14,2),
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

-- ============ transfers ============
create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  date date not null,
  from_account_id uuid,
  to_account_id uuid,
  amount numeric(14,2) not null check (amount > 0),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  check (from_account_id is null or to_account_id is null or from_account_id <> to_account_id),
  foreign key (from_account_id, user_id) references public.accounts (id, user_id) on delete set null (from_account_id),
  foreign key (to_account_id, user_id) references public.accounts (id, user_id) on delete set null (to_account_id)
);

-- ============ income ============
create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  monthly_amount numeric(14,2) not null default 0 check (monthly_amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  date date not null,
  source_id uuid,
  amount numeric(14,2) not null,
  account_id uuid,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  foreign key (source_id, user_id) references public.income_sources (id, user_id) on delete set null (source_id),
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete set null (account_id)
);

-- ============ transactions ============
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  date date not null,
  category_id uuid,
  amount numeric(14,2) not null,
  account_id uuid,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete set null (category_id),
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete set null (account_id)
);
create index transactions_user_date_idx on public.transactions (user_id, date);
create index income_entries_user_date_idx on public.income_entries (user_id, date);

-- ============ recurring ============
create table public.recurring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  category_id uuid,
  amount numeric(14,2) not null check (amount >= 0),
  frequency public.recurring_frequency not null default 'Monthly',
  first_due_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete set null (category_id)
);

-- ============ zakat ============
create table public.zakat_settings (
  user_id uuid primary key default auth.uid(),
  basis public.zakat_basis not null default 'Silver',
  gold_grams numeric(10,3) not null default 87.48 check (gold_grams > 0),
  silver_grams numeric(10,3) not null default 612.36 check (silver_grams > 0),
  gold_price numeric(14,4) check (gold_price is null or gold_price >= 0),
  silver_price numeric(14,4) check (silver_price is null or silver_price >= 0),
  rate numeric(6,4) not null default 0.025 check (rate >= 0 and rate <= 1),
  anniversary_date date,
  zakat_category_id uuid,
  updated_at timestamptz not null default now(),
  foreign key (zakat_category_id, user_id) references public.categories (id, user_id) on delete set null (zakat_category_id)
);
create trigger zakat_settings_updated before update on public.zakat_settings
  for each row execute function public.set_updated_at();

create table public.zakat_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind public.zakat_line_kind not null,
  label text not null check (char_length(btrim(label)) between 1 and 60),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now()
);

-- ============ interest ============
create table public.interest_received (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  date date not null,
  account_id uuid,
  amount numeric(14,2) not null check (amount > 0),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete set null (account_id)
);

create table public.interest_given (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  date date not null,
  recipient text check (recipient is null or char_length(recipient) <= 80),
  amount numeric(14,2) not null check (amount > 0),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);

-- ============ module plans ============
create table public.module_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  module text not null check (module in ('ramadan','qurbani','hajj')),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, module)
);
create trigger module_plans_updated before update on public.module_plans
  for each row execute function public.set_updated_at();

-- ============ Grants + RLS (user_id = auth.uid()) on every table ============
do $$
declare t text;
begin
  foreach t in array array['goals','categories','accounts','transfers','income_sources','income_entries',
    'transactions','recurring_items','zakat_settings','zakat_lines','interest_received','interest_given','module_plans']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ============ Capacity limits ============
create trigger categories_limit before insert on public.categories for each row execute function public.enforce_row_limit(50);
create trigger income_sources_limit before insert on public.income_sources for each row execute function public.enforce_row_limit(5);
create trigger income_entries_limit before insert on public.income_entries for each row execute function public.enforce_row_limit(300);
create trigger transactions_limit before insert on public.transactions for each row execute function public.enforce_row_limit(1500);
create trigger goals_limit before insert on public.goals for each row execute function public.enforce_row_limit(10);
create trigger accounts_limit before insert on public.accounts for each row execute function public.enforce_row_limit(10);
create trigger recurring_items_limit before insert on public.recurring_items for each row execute function public.enforce_row_limit(50);