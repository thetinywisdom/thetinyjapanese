# Optional account with email link login and cross-device sync

Today everything (practice progress, streaks, cleared kanji, filter choices, diary entries) is saved on the device only. That stays exactly as it is — the whole app keeps working with no account.

On top of that, people can sign in with just an email address: they type it, get a link in their inbox, click it, and they are signed in. From then on their data is stored in their account and follows them to any device.

## What the user sees

- A **Sign in** button in the top navigation. Opens a small page/dialog: enter email, press "Send link", see "Check your inbox".
- Clicking the link in the email returns them to the app already signed in.
- Once signed in, the button becomes their email with a menu: "Synced just now" status and "Sign out".
- On first sign-in, whatever is already on that device is **merged** with the account: highest practice counts and streaks win, all diary entries from both sides are kept (same entry kept in its most recently edited version).
- Signing out leaves the local copy on the device untouched, so practice continues offline.
- Everything is written locally first and pushed to the account in the background, so nothing feels slower and it still works with a bad connection.

## What gets synced

- Practice stats per item for all four modes (conjugations, kanji read, remember, write)
- Session history, day streak, cleared kanji and per-kanji streaks
- Saved filter selections and level scheme preference
- Diary entries: date, text, direction, writing direction, placed pictures and text, pen strokes, drawing image

## Technical outline

Auth
- Lovable Cloud auth, email OTP / magic link only (no password). Redirect back to `${window.location.origin}/auth/callback`; a small `AuthCallback` page waits for the session then routes home.
- No profile fields are needed, so no profiles table.
- Custom-branded auth email is optional and not part of this change; default emails are used.

Database (migrations, RLS on, policies scoped to `auth.uid()`, GRANTs to `authenticated` + `service_role` only)
- `user_state` — one row per user: `user_id uuid primary key`, `data jsonb` (progress maps, sessions, streak, cleared kanji, kanji streaks, filters, scheme), `updated_at`.
- `diary_entries` — `id text`, `user_id uuid`, plus `date_iso`, `text`, `direction`, `items jsonb`, `strokes jsonb`, `drawing text`, `drawing_base text`, `updated_at bigint`; primary key `(user_id, id)`.
- Diary drawings/photos are data URLs and can be large; entries are upserted individually so one big entry does not block the rest. If an entry exceeds a safe row size the sync skips its raster image and reports it in the sync status rather than failing silently.

Client
- New `src/features/sync/` module: `SyncProvider` (session state via `onAuthStateChange`, sync status), `snapshot.ts` (read/write the full local state through the existing `progress.ts` / `persisted-filters.ts` / `diary/storage.ts` APIs), `merge.ts` (pure merge functions, unit tested with vitest).
- Merge rules: item stats take the max of `seen`/`correct` and latest `lastSeen`; streak takes max `best`, latest `lastDay`; sessions concatenated and de-duplicated by `date`+`kind`; cleared kanji unioned; kanji streaks take max; filters prefer the more recently written side; diary entries keyed by `id`, newest `updatedAt` wins, non-matching ids kept from both.
- Push is debounced (~2s) after any local change and on page hide; pull happens on sign-in and on app load when signed in.
- Existing pages and contexts are untouched apart from the header adding the sign-in control.

Tests
- Vitest coverage for the merge functions (both-empty, local-only, remote-only, conflicting counts, diary conflict by timestamp).
