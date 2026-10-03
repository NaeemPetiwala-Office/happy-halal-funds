create table public.archived_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind text not null check (kind in ('transaction','income_entry','transfer')),
  data jsonb not null,
  archived_at timestamptz not null default now()
);
grant select, insert, update, delete on public.archived_entries to authenticated;
grant all on public.archived_entries to service_role;
alter table public.archived_entries enable row level security;
create policy "Own rows" on public.archived_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- goals: [{id, opening_saved}], accounts: [{id, opening_balance}]
create or replace function public.start_new_year(new_plan_start date, goals jsonb, accounts jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not signed in'; end if;

  update public.goals g set opening_saved = (x->>'opening_saved')::numeric
  from jsonb_array_elements(goals) x
  where g.id = (x->>'id')::uuid and g.user_id = uid;

  update public.accounts a set opening_balance = (x->>'opening_balance')::numeric, actual_balance = null
  from jsonb_array_elements(accounts) x
  where a.id = (x->>'id')::uuid and a.user_id = uid;

  insert into public.archived_entries (user_id, kind, data)
    select uid, 'transaction', to_jsonb(t) from public.transactions t where t.user_id = uid;
  insert into public.archived_entries (user_id, kind, data)
    select uid, 'income_entry', to_jsonb(i) from public.income_entries i where i.user_id = uid;
  insert into public.archived_entries (user_id, kind, data)
    select uid, 'transfer', to_jsonb(t) from public.transfers t where t.user_id = uid;

  delete from public.transactions where user_id = uid;
  delete from public.income_entries where user_id = uid;
  delete from public.transfers where user_id = uid;

  update public.profiles set plan_start = new_plan_start, selected_month = new_plan_start
  where user_id = uid;
end;
$$;
revoke execute on function public.start_new_year(date, jsonb, jsonb) from public, anon;
grant execute on function public.start_new_year(date, jsonb, jsonb) to authenticated;