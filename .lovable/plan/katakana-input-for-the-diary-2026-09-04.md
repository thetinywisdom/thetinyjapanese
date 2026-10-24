# Katakana input for the diary

Add a toggle so users can type katakana in the diary text areas, not just hiragana.

## What to build

1. **Kana-mode toggle**
   - Add a small button in the diary toolbar that switches between **あ (hiragana)** and **ア (katakana)**.
   - The button shows the currently active script and is clearly pressed/selected.

2. **Romaji → katakana conversion**
   - Reuse the existing `romajiToHiragana` helper, then pass the result through the existing `hiraganaToKatakana` helper when katakana mode is active.
   - Keep the live, on-keystroke behavior identical to the current hiragana flow.
   - Existing text in the textarea is not changed when the user toggles modes; only new typing uses the selected script.

3. **State management**
   - Store the active kana mode as a local state in `DiaryEntry` and pass it down to `DiaryPaper`.
   - Persist the last-used mode in `localStorage` under a diary-specific key so the next diary session starts in the same mode.

## Files to change

- `src/lib/romaji.ts` — export `hiraganaToKatakana` (already exists, may need re-export).
- `src/components/diary/DiaryToolbar.tsx` — add the あ/ア toggle button and `kanaMode`/`onKanaMode` props.
- `src/components/diary/DiaryPaper.tsx` — accept `kanaMode: "hiragana" | "katakana"` and convert to the matching script in `handleChange`.
- `src/pages/DiaryEntry.tsx` — hold `kanaMode` state, load/save it from `localStorage`, pass it to toolbar and paper.

## Out of scope

- No auto-conversion of existing text when toggling.
- No per-entry kana-mode persistence (global preference only).
