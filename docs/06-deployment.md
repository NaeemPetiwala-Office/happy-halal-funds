# Deployment

## Today

- The app is published with Lovable's Publish button to `https://happy-halal-funds.lovable.app`. Front-end changes go live only after you click "Update". Database changes apply immediately.
- The build is `vite build` (`package.json`), configured by `@lovable.dev/vite-tanstack-config` (`vite.config.ts`). It produces a server-rendered TanStack Start app built with Nitro for a Cloudflare Workers-style runtime. The server entry is `src/server.ts`.
- **Output:** `dist/`. Client assets are in `dist/client/`, including the service worker `sw.js` from `vite-plugin-pwa`. The server bundle sits alongside them.
- **PWA:** `public/manifest.webmanifest` and icons. The service worker is registered only by `src/lib/pwa-register.ts`, and never in dev, preview hosts or iframes.

## Static hosting (e.g. Firebase Hosting)

What would be needed:

1. **A client-only build.** The app currently expects a server for SSR. Signed-in pages (`_authenticated`) already have `ssr: false`, but `/`, `/auth` and the HTML shell are server-rendered. You would need TanStack Start's SPA/prerender mode, which produces an `index.html`.
2. **An SPA rewrite.** In `firebase.json`, add `"rewrites": [{ "source": "**", "destination": "/index.html" }]`.
3. **Build-time env vars.** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PROJECT_ID` are baked in when you build.
4. **Auth URLs.** Add the new domain to Site URL and Redirect URLs (`https://<domain>/**`) in the auth settings.
5. **Service worker.** Make sure `sw.js` is served with `Cache-Control: no-cache`.

## Backups and data export

- **Per user, in the app:** Settings → Data exports transactions and goals as CSV (`src/lib/csv.ts`). Other tables (accounts, recurring items, Zakat, interest, planners) have **no in-app export**.
- **Whole database:** for a Supabase project you own, use `supabase db dump` (schema and data) or the dashboard's backups.

## Unverified

- The exact SPA-mode config for this TanStack Start version has not been tried, and no static build has been produced.
- How to take a full data export from the Lovable Cloud instance has not been checked here.
