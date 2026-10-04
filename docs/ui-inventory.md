# UI inventory

## Routes and screens

| Route | Screen | Main components | Empty, loading and error states |
|---|---|---|---|
| `/` | Welcome | Theme toggle, welcome actions | Static; global error/404 boundaries apply |
| `/auth` | Sign in / sign up | Auth form, theme toggle | Inline authentication errors; global error boundary |
| `/onboarding` | Three-step setup | Name input, currency selector, month picker | Save errors use a toast; completed profiles redirect to Dashboard |
| `/dashboard` | Dashboard | Month switcher, summary cards, alerts, setup checklist, goal progress, by-type and trend charts | Page skeleton; setup checklist is hidden when complete |
| `/add` | Add transaction | Page header, transaction form and numeric keypad | Form validation and toast errors |
| `/log` | Transaction log | Search, month/category filters, transaction editor | Page skeleton; shared empty state when no rows match |
| `/budget` | Budget | Income-source and category editors, totals | Page skeleton; inline validation and toast errors |
| `/more` | More | Secondary navigation tiles; enabled planner tiles | Optional-planner section is hidden when no modules are enabled |
| `/tracker` | Tracker | Month switcher, status badges, tracker table/cards | Page skeleton; shared empty state when there are no categories |
| `/income` | Income | Source and entry editors, month filter, totals | Page skeleton; shared empty states for missing sources/entries |
| `/goals` | Goals | Goal cards/table, progress, priority and auto-count controls | Page skeleton; shared empty state when no goals exist |
| `/accounts` | Accounts & transfers | Balance cards, account editor, transfer editor/list | Page skeleton; shared empty states when no accounts/transfers exist |
| `/recurring` | Recurring payments | Summary, payment cards/table and editor | Page skeleton; shared empty state when no recurring items exist |
| `/zakat` | Zakat | Basis/settings form, asset/liability lines, result cards, disclaimer | Page skeleton; zero/missing-input results and toast errors |
| `/interest` | Interest | Received/given-away editors and totals, disclaimer | Page skeleton; shared empty states for both lists |
| `/health` | Health check | Fix/Note/OK badges linked to affected screens | Page skeleton; OK results are shown when no action is required |
| `/settings` | Settings | Profile, appearance, language, CSV data, modules, new year, developer and danger-zone panels | Page skeleton; confirmation dialogs and toast errors |
| `/ramadan` | Ramadan planner | Shared planner form, event date, items and totals | “Switched off” state when its module is disabled; empty item list |
| `/qurbani` | Qurbani planner | Shared planner form, event date, items and totals | “Switched off” state when its module is disabled; empty item list |
| `/hajj` | Hajj & Umrah planner | Shared planner form, event date, items and totals | “Switched off” state when its module is disabled; empty item list |

All app screens use the root runtime-error and not-found screens. Data screens use the shared `PageSkeleton` and `EmptyState` patterns where listed. The offline banner appears globally when cached data is being shown without a connection. Quick Add is a global bottom sheet opened by the floating `+` button on authenticated app screens.

## Navigation

- Desktop: fixed left sidebar. Primary links are Dashboard, Add, Log, Budget and More; Manage links are Tracker, Income, Goals, Accounts, Recurring, Zakat, Interest, Health check and Settings.
- Mobile: floating bottom bar with the five primary links. More exposes the Manage links and any enabled optional planners.
- Authenticated app screens share `AppShell`; onboarding is authenticated but outside that shell.

## Design tokens

- Fonts: Sora for headings/brand text; Inter for body text; system fallbacks.
- Light colours: background `hsl(180 33% 98%)`, foreground `hsl(190 98% 16%)`, card white, primary teal `hsl(181 62% 38%)`, secondary mint `hsl(180 56% 89%)`, accent gold `hsl(42 62% 59%)`, destructive coral `hsl(8 65% 57%)`.
- Dark colours: deep-teal background `hsl(192 60% 8%)`, dark-teal card `hsl(191 52% 12%)`, white foreground, teal primary, gold accent.
- Gradients: teal header; warm peach, cool teal and slate supporting gradients.
- Radius: base `1.75rem`; controls are pill-shaped and cards commonly use the `3xl` radius.
- Shadows: `soft` is `0 12px 32px -12px rgba(1,67,80,.18)`; `lift` is `0 20px 44px -16px rgba(1,67,80,.28)`.