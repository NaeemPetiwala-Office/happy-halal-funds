# UI Inventory

## User-Facing Routes & Screens

### Public Routes
- **Landing (/)**: `src/routes/index.tsx` - Initial entry point.
- **Authentication (/auth)**: `src/routes/auth.tsx` - Sign in / Sign up.

### Authenticated Routes (App Shell)
These routes are wrapped in `AppShell` and require an authenticated session and completed onboarding.

- **Dashboard (/dashboard)**: `src/routes/_authenticated/_app/dashboard.tsx` - Overview of income, spending, savings, and alerts.
- **Add (/add)**: `src/routes/_authenticated/_app/add.tsx` - Quick transaction entry.
- **Log (/log)**: `src/routes/_authenticated/_app/log.tsx` - Searchable transaction history.
- **Budget (/budget)**: `src/routes/_authenticated/_app/budget.tsx` - Monthly budget planning by category.
- **More (/more)**: `src/routes/_authenticated/_app/more.tsx` - Links to secondary features (Mobile).
- **Tracker (/tracker)**: `src/routes/_authenticated/_app/tracker.tsx` - Detailed budget tracking.
- **Income (/income)**: `src/routes/_authenticated/_app/income.tsx` - Income source management.
- **Goals (/goals)**: `src/routes/_authenticated/_app/goals.tsx` - Savings goal management.
- **Accounts (/accounts)**: `src/routes/_authenticated/_app/accounts.tsx` - Account/Balance management.
- **Recurring (/recurring)**: `src/routes/_authenticated/_app/recurring.tsx` - Subscription and recurring payment management.
- **Zakat (/zakat)**: `src/routes/_authenticated/_app/zakat.tsx` - Zakat calculation and tracking.
- **Interest (/interest)**: `src/routes/_authenticated/_app/interest.tsx` - Riba/Interest tracking for disposal.
- **Health (/health)**: `src/routes/_authenticated/_app/health.tsx` - Financial health checklist.
- **Settings (/settings)**: `src/routes/_authenticated/_app/settings.tsx` - Profile and app configuration.
- **Special Religious Events**:
    - **Ramadan (/ramadan)**: `src/routes/_authenticated/_app/ramadan.tsx`
    - **Hajj (/hajj)**: `src/routes/_authenticated/_app/hajj.tsx`
    - **Qurbani (/qurbani)**: `src/routes/_authenticated/_app/qurbani.tsx`

### Other Routes
- **Onboarding (/onboarding)**: `src/routes/_authenticated/onboarding.tsx` - Initial user setup.

## Shared Navigation Structure

Defined in `src/components/AppShell.tsx`:

- **Primary Navigation**: Dashboard, Add, Log, Budget, More (Icons-based bottom bar on mobile, top of sidebar on desktop).
- **Secondary Navigation**: Tracker, Income, Goals, Accounts, Recurring, Zakat, Interest, Health, Settings (Sidebar list on desktop, "More" menu on mobile).

## Main Components

- **AppShell (`src/components/AppShell.tsx`)**: Root layout providing navigation and `QuickAddProvider`.
- **PageHeader (`src/components/PageHeader.tsx`)**: Standard page title section with optional "eyebrow" text and action buttons.
- **DataCard (`src/components/DataCard.tsx`)**: Consistent display for financial metrics.
- **TransactionForm (`src/components/TransactionForm.tsx`)**: Unified form for creating/editing transactions.
- **MonthSwitcher/Picker (`src/components/MonthSwitcher.tsx`)**: Time-period navigation controls.
- **SetupChecklist (`src/components/SetupChecklist.tsx`)**: Interactive guide for new users on the dashboard.
- **SampleDataCard (`src/components/SampleDataCard.tsx`)**: Banner for users using demo data.
- **OfflineBanner (`src/components/OfflineBanner.tsx`)**: PWA status indicator.

## Empty, Loading & Error States

- **Loading States**: 
    - `PageSkeleton` (`src/components/EmptyState.tsx`): Card-shaped skeleton loaders used during data fetching.
- **Empty States**:
    - `EmptyState` (`src/components/EmptyState.tsx`): Standardized component with icon, title, text, and optional CTA button.
    - Inline "No results" messages in lists (e.g., Log and Budget pages).
- **Error States**:
    - `ErrorComponent` (`src/routes/__root.tsx`): Global boundary for runtime errors with "Try again" and "Go home" actions.
    - `lovable-error-reporting.ts`: Error capture and logging utility.
- **Not Found**:
    - `NotFoundComponent` (`src/routes/__root.tsx`): Custom 404 page.
