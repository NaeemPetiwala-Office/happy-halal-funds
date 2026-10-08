# Phase 1 requirements map (Step 3 baseline)

Status of every Phase 1 "M" requirement in the code at the start of Step 3. **Done** = found in code and covered by tests or clearly present. **Partial / Missing** = a gap I confirmed by reading the code. **Check** = not yet verified; I verify it in the work package named in the last column. Read from code only: nothing here was tested in a browser.

Work packages (WP): **1** engine fixes, **2** build, hosting, privacy and CI, **3** auth, **4** database rules and settings, **5** backup (JSON export and import), **6** Health Check and alerts, **7** screens and accessibility.

| Req | Status | Finding | WP |
|---|---|---|---|
| AUTH-01 | Partial | Minimum password is 6 on the screen (server is 10); no strength guidance. Breached-password check unavailable on Free. | 3 |
| AUTH-02 | Done | Protected route group; signed-out users go to sign-in. | - |
| AUTH-03 | Missing | No password reset or change screens. | 3 |
| AUTH-04 | Done | Confirm email is on (Step 2). Re-verify with a real sign-up. | 3 |
| AUTH-07 | Missing | No account deletion. Needs a server-side function in your Supabase project. | 3 |
| AUTH-08 | Check | Provider rate limits apply; temporary lockout not confirmed. | 3 |
| SET-01 | Check | Onboarding has name, currency, plan start; 6-character currency limit not verified (database allows 8). | 4 |
| SET-02 | Check | Currency formatter is shared; verify every screen and export. | 7 |
| SET-03 | Missing | Plan start update does not block when entries fall outside the window. | 4 |
| SET-08 | Missing | "Reset my data" exists only in the developer tools (dev environment). | 4 |
| BUD-01 | Done | 5-source cap in screen and database trigger. | - |
| BUD-02 | Partial | 50-category cap done; name uniqueness is case-sensitive; goal link not verified. | 4 |
| BUD-03 | Partial | Reserved names rejected; duplicates are case-sensitive only. | 4 |
| BUD-04 | Partial | Unallocated / Over-allocated shown; the "fully allocated" message not confirmed. | 7 |
| BUD-05 | Done | Leftover rule selector with Same category, Drop it, or a category. | - |
| BUD-06 | Done | Categories referenced by identifier. | - |
| BUD-07 | Missing | Deleting a category is allowed and uncategorises its transactions; spec requires a block with reassignment. | 4 |
| BUD-09 | Partial | Inline messages exist; not all values are validated the same way. | 7 |
| TXN-01 | Done | Add, edit and delete in the log and quick add. | - |
| TXN-02 | Partial | Single label "Refund / withdrawal"; spec wants withdrawal for Savings, refund for others. | 7 |
| TXN-03 | Partial | Window check only in CSV import; no "future" marker found. | 7 |
| TXN-04 | Partial | Quick Add and "Save and add another" exist; remembering last category and account and the 3-tap rule not verified. | 7 |
| TXN-09 | Done | CSV export of transactions. | - |
| TXN-10 | Done | Income screen with 300 cap (trigger). | - |
| TXN-11 | Done | Transfers on the Accounts screen. Identical/unknown-account rejection to verify. | 7 |
| ENG-01 | Done | Pure engine; clock-free guard test. | - |
| ENG-02 | **Fixed in patch 3a** | Engine lacked the "Ahead of plan" status (BRL-10, AC-07, E1). The old E1 test asserted "Over budget", which contradicts Appendix A. | 1 |
| ENG-03 | Pending | Shared test vectors file for iOS to be produced with the Appendix A tests. | Step 5 |
| ENG-04 | Check | No test for emoji or Arabic names. | 1 |
| TRK-01 | Partial | 24-month picker exists; no finished / current / projection banner. | 7 |
| TRK-02 | Done | All ten columns present. | - |
| TRK-03 | **Fixed in patch 3a** | "Ahead of plan" status and light-blue badge added. Text labels already used. | 1 |
| TRK-04 | Check | By-type table; confirm "% of income" matches Appendix A (planned share). | 7 |
| DSH-01 | Done | Master month selector. | - |
| DSH-02 | Done | Five cards. | - |
| DSH-03 | Done | Goal progress bars. | - |
| DSH-04 | Partial | Alerts for health, over budget (now excluding Ahead of plan), near limit, recurring due, interest, unallocated; Zakat anniversary days not confirmed. | 6 |
| DSH-07 | Check | Not measured at maximum volume. | Step 5 |
| GOL-01 | Partial | Goal name allows 60 characters; spec 40. | 4 |
| GOL-02 | Done | Engine implements BRL-12. | - |
| GOL-03 | Missing | The required Auto-count sentence is not shown. | 7 |
| GOL-04 | Partial | Dashboard warns on negative goal total; form wording not specific. | 7 |
| GOL-06 | Check | No-target behaviour in engine; prompt in the screen not confirmed. | 7 |
| ACC-01 | Partial | Account name limit in database (30) ok; 10-account cap trigger exists. Optional actual balance to verify. | 7 |
| ACC-02 / ACC-03 / ACC-05 | Done | Balances, transfers and totals in engine and screen. | - |
| HLT-01 | Partial | 19 of 29 checks; #27 (future-dated rows) missing; wording is Excel-free but incomplete. | 6 |
| HLT-02 | Done | Status on Dashboard and checklist. | - |
| DAT-01 | Partial | CSV only; no full JSON export. | 5 |
| DAT-02 (pulled into Phase 1) | Missing | Only transaction CSV import exists; no full JSON restore. | 5 |
| NFR-SEC-02 | Partial | Two-user script passes (Step 2); not yet automated on every release. | 2 |
| NFR-SEC-03 | Partial | `.env` untracked in Step 2; no secret scanning in a pipeline yet. | 2 |
| NFR-SEC-05 | Missing | No CSP or security headers; no dependency scan in a pipeline. | 2 |
| NFR-SEC-06 | Partial | Session in browser storage; strict CSP pending. | 2 |
| NFR-SEC-09 | Done | Set in Step 2 (lockout item is AUTH-08). | - |
| NFR-PRIV-01 | Partial | Google Fonts and Lovable hooks present. | 2 |
| NFR-PRIV-05 | Todo | Document the storage region (Mumbai) in the docs. | Step 6 |
| NFR-PERF-03 | Missing | No optimistic update for saved transactions. | 7 |
| NFR-REL-04 | Partial | Friendly error helper exists; not used everywhere. | 7 |
| NFR-ACC-01/02/03 | Check | No accessibility audit yet; text labels exist for statuses. | Step 5 |
| NFR-MNT-01 | Missing | No coverage thresholds, no CI. | 2 |
| NFR-DEP-01 | Missing | Server build for Cloudflare, not static single-page output. | 2 |
