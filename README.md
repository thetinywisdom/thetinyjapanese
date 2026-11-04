# The Tiny Japanese Practice Tool

A static Japanese practice site: kanji readings, stroke writing, a remember quiz, verb and adjective conjugations, and a picture diary. Progress stays in the browser’s localStorage. There is no account and no server.

The live site is [https://thetinywisdom.github.io/thetinyjapanese/](https://thetinywisdom.github.io/thetinyjapanese/).

## Run locally

Node.js 22 and npm.

```sh
npm ci
npm run dev
```

The dev server uses `VITE_BASE_PATH=/` from `.env.development`, so open http://localhost:8080/.

```sh
npm test
npm run lint
npm run build
npm run preview
```

`npm run preview` serves the production build. With the production base path, the site is at http://localhost:4173/thetinyjapanese/.

## Deploy to GitHub Pages

Pushes to `main` run `.github/workflows/pages.yml`. The workflow installs with `npm ci`, lints, tests, builds, and uploads `dist/` to GitHub Pages. In the repository settings, Pages must use **GitHub Actions** as the source.

Pull requests run the same checks in `.github/workflows/ci.yml` and do not deploy.

The build writes an `index.html` for each known route (`/kanji`, `/diary`, and the rest) so those URLs return HTTP 200. A diary entry id and any unknown path still use `404.html`, which is the same app shell, so the page can render after the 404 response.

## Change `VITE_BASE_PATH`

This is the public path the built files live under.

| Host | `VITE_BASE_PATH` |
|---|---|
| GitHub Pages project site | `/thetinyjapanese/` |
| Custom domain at the domain root | `/` |

The production value is in `.env.production`. A `VITE_BASE_PATH` environment variable set in CI overrides that file. Keep the leading and trailing slash.

Canonical URLs and the sitemap use `https://thetinywisdom.github.io` plus that base path. If you move the site to another host, change `SITE_ORIGIN` in `src/lib/route-meta.ts` as well.

## Data files

The practice lists live in `src/data/*.json`. The app loads them when you open a practice, progress, or diary-entry page, not with the home page. Rebuild them (needs a local `scripts/JMdict.xml`, which is not in git) with:

```sh
npx tsx scripts/build-words.ts
npx tsx scripts/build-kanji-radicals.ts
npx tsx scripts/build-examples.ts
npx tsx scripts/build-kanji-strokes.ts
```

Install lockfile is npm (`package-lock.json`). `npm ci` is the install used in CI.
