# Lovable export — The Tiny Japanese Toolkit

Snapshot copied from Lovable project `2f2ec92e-6460-4071-a68b-9667030e9417` at commit `1125c1faf7c74f2a157c2e3661fe6140a9f2dd5b` on 2026-10-24 (JST) so the code survives cancelling the Lovable subscription.
This repo was NOT created via Lovable's GitHub sync; files were copied one by one through the Lovable API.

- Lovable editor: https://lovable.dev/projects/2f2ec92e-6460-4071-a68b-9667030e9417
- Published URL: https://thetinyjapanese.com
- Files in Lovable project: 401 (189 binary)

## Binary files not recoverable through the API
- none

## Excluded (large third-party / regenerable data)
- `bun.lockb`
- `scripts/JMdict.xml (~tens of MB; Lovable API read fails with error 1102 — re-download from EDRDG: http://ftp.edrdg.org/pub/Nihongo/JMdict.gz)`
- `scripts/cache/kanjivg.zip (public KanjiVG release — https://github.com/KanjiVG/kanjivg/releases)`
- `scripts/cache/kanjivg/kanji/*.svg (thousands of extracted KanjiVG SVGs; regenerate by unzipping kanjivg.zip — build output already baked into src/data/kanji-strokes.json)`

## Lovable-hosted assets (`*.asset.json`) — downloaded copies
The `*.asset.json` files point at Lovable's CDN (`/__l5e/assets-v1/...`), which only works on Lovable hosting.
The real files were downloaded next to each json (same name without `.asset.json`). After leaving Lovable, change imports to use those files directly.
- `src/assets/tiny-wisdom-logo-dark.png`

## Things that do NOT move with this code
- **Supabase (Lovable Cloud) database, auth users, storage, edge functions deployment and secrets** live in Lovable's Supabase project. Export data/schema before cancelling, or create your own Supabase project and run the migrations.
- **Secrets / env vars** (names only; values are not in this repo except the public publishable keys in `.env`): see list below.
- **Hosting**: `*.lovable.app` / custom domain hosting stops; redeploy (e.g. Vercel/Netlify/Cloudflare) and repoint DNS.
- `@lovable.dev/*` npm packages are public on npmjs and keep working; `bun.lock` may reference Lovable's private npm cache — delete it and reinstall if install fails.

## Project-specific notes

- **Stack:** Vite + React SPA (shadcn/ui, Tailwind), Supabase client, vitest. Kanji / verb / kana practice, diary, progress. Precomputed data in `src/data/*.json` (kanji-strokes, words) is included, so the app builds without the excluded raw dictionaries.
- **Data build scripts:** `scripts/*.ts` regenerate `src/data` from JMdict (EDRDG) + KanjiVG + Tatoeba examples (`scripts/cache/examples.utf` is included). JMdict.xml / kanjivg.zip / extracted KanjiVG SVGs were not copied (see Excluded) — re-download them only if you need to rebuild the data.
- **Auth & sync:** optional account with email magic-link login (`src/pages/Auth.tsx`, `AuthCallback.tsx`) and cross-device sync (`src/features/sync`, table `user_state`). Diary entries in `diary_entries`.
- **Database (2 migrations):** tables `user_state`, `diary_entries`, plus email infra `email_send_log`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails`; extensions pg_cron, pg_net, pgmq, supabase_vault. The email-queue cron job + vault secret `email_queue_service_role_key` are set up by Lovable outside the SQL (see comments in `20260912033603_email_infra.sql`) — recreate manually. Export user/diary data from Lovable Cloud before cancelling.
- **Storage:** bucket `diary-shares` (used by `diary-share` function for share images with 7-day signed links).
- **Edge functions (3):**
  - `auth-email-hook` — Lovable auth-email webhook using `@lovable.dev/email-js` + `@lovable.dev/webhooks-js` (verify_jwt=false). **Lovable-only — replace** with Supabase's built-in SMTP/auth emails (e.g. Resend) using the React email templates in `_shared/email-templates`.
  - `process-email-queue` — sends queued mail via `sendLovableEmail` (Lovable email API). **Lovable-only — replace.**
  - `diary-share` — uploads a share image to storage; no Lovable dependency.
- **Secret names (values not copied):** SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY, LOVABLE_SEND_URL (optional); client `.env`: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID.
- **Other Lovable ties:** `og:image`/`twitter:image` in `index.html` point at Lovable's upload bucket (`storage.googleapis.com/gpt-engineer-file-uploads/...`) — copy that image into `public/` and update the tags; `previewAuthStorage.ts` (editor preview broker, harmless); dev-only `lovable-tagger`; localStorage keys prefixed `lovable.*` are just names — keep them so existing users keep their progress.
- **Domains:** published at https://thetinyjapanese.com (japanese.thetinywisdom.com redirects there). `src/features/recovery/legacyDomains.ts` + `public/legacy-bridge.html` migrate localStorage from old domains (incl. `thetinykanji.lovable.app`) — the lovable.app domain disappears after cancelling.
