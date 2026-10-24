# 絵日記 — Picture Diary

A new practice-adjacent feature where you draw a picture and write a Japanese diary entry below it, laid out like a real Japanese 絵日記 page.

## What you get

- A new page at `/diary` with a list of your entries (newest first) and a "New entry" button.
- An entry page laid out like the reference image:
  - Header line with the date (year / month / day / weekday) in Japanese, editable.
  - A 4:3 drawing canvas with a thin rounded border.
  - Below it, a ruled writing area for the diary text.
- Writing direction toggle: 横書き (horizontal, left-to-right, ruled lines) or 縦書き (vertical, right-to-left columns, like the image). Text is a normal editable field in both modes.
- Drawing tools: crayon-style pen with a few thicknesses, a small color palette (black, blue, pink, yellow, teal, brown), eraser, undo, clear.
- Download button: exports the whole page (drawing + text + date header) as a PNG.
- Entries are saved on this device (browser storage). No sign-in.

## Technical notes

New files:
- `src/pages/Diary.tsx` — entry list (grid of thumbnails: drawing preview + date + first line).
- `src/pages/DiaryEntry.tsx` — the editor page, route `/diary/:id`.
- `src/features/diary/storage.ts` — localStorage CRUD (`lovable.diary.entries`), entry shape:
  `{ id, dateISO, drawing: string /* PNG data URL */, text, direction: "horizontal" | "vertical", updatedAt }`.
- `src/components/diary/DiaryCanvas.tsx` — pointer-event canvas, 4:3, dpr-aware, stroke history array for undo, colors from design tokens plus fixed crayon hues; reuses the drawing patterns already in `WritingCanvas.tsx`.
- `src/components/diary/DiaryToolbar.tsx` — color/size/eraser/undo/clear controls.
- `src/components/diary/DiaryPaper.tsx` — the paper sheet: date header, canvas slot, ruled text area with horizontal/vertical modes (`writing-mode: vertical-rl` for 縦書き).

Modified:
- `src/App.tsx` — add `/diary` and `/diary/:id` routes.
- `src/components/SiteHeader.tsx` — add "絵日記 Diary" nav link (desktop + mobile menu).
- `src/components/PracticeChoices.tsx` — add a 絵日記 card (grid becomes 5 cards / 2 columns).
- `src/index.css` — paper texture / rule-line tokens for light and dark mode.

Export uses `html-to-image` (small dependency) to snapshot the paper element; drawing stays a canvas so it exports cleanly. Drawings are stored as PNG data URLs, capped at 1024px wide to keep storage small; the list warns if browser storage is full.

## Out of scope

- Cloud sync, sharing, or multi-device access.
- Grammar checking, AI feedback, or correction of the Japanese text.
- Furigana input helpers or handwriting recognition.
