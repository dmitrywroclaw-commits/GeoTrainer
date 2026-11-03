# GeoTrainer

GeoTrainer is a Russian-language, client-side PWA for learning country flags, state symbols, and natural landmarks through illustrated reference cards and recognition quizzes.

## Run locally

Requirements: Node.js 22+, npm 10+, Python 3 with Pillow only if regenerating icons.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. No backend or account is needed.

## Check and build

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The production site is in `dist/`. Deploy those static files with an HTTPS host and SPA fallback to `index.html`. The build script generates `offline.html` and `sw.js`; visited media is cached separately. The Playwright suite uses locally installed Microsoft Edge and checks desktop and mobile flows.

## Deploy on Vercel

Import the GitHub repository into the intended Vercel team. Keep the project root at `./` and the Framework Preset at Vite. `vercel.json` sets the build command to `npm run build`, serves `dist/`, and rewrites application routes to `index.html` so direct links and refreshes work. The custom build command is required because it also generates the service worker and offline page. No environment variables, backend, or database are needed for this prototype.

After the first deployment, check a direct visit to `/learn`, a quiz and progress reload, and the installed PWA's offline shell. The user's learning progress stays in the browser's IndexedDB, so it does not sync between devices or browser profiles.

## Current content

«Страны на карте» covers all 195 base-registry countries with 390 locally generated SVG views and 390 quiz questions. The catalog includes regional filters, incremental loading, geographic insets, sourced explanations, local progress and offline access to visited maps. Preparation sources and regeneration commands are documented in `GeoTrainer Documents/11_ALL_COUNTRY_OUTLINES.md`.

The current reviewed set includes 195 flags, 24 coats of arms or emblems, and 47 natural landmarks. The 79 eligible natural-landmark candidates are still being published in reviewed batches. Full content production continues until every eligible record in the country, extended entity, and natural-landmark registries has a published card.

Content lives in `content/library.json`; image metadata lives in `content/media.json`. Images are saved under `public/media/`. `src/data/schema.ts` validates content and references when the app loads. Facts and rights links are shown on each detail page.

Local answer history is stored in IndexedDB through `src/storage/progress.ts`. Questions are generated from the content records. No content or user progress is sent to a server.

## Project documents

Product, content, technical, and UI guidance is in `GeoTrainer Documents/`. The current PWA uses a small generated service worker instead of a Vite PWA plugin so the offline shell can include its own JS and CSS. This is an implementation choice for v0.1; the external behavior follows the offline requirements in the documents.

The exotic-food catalog is disabled in the published app, including its former catalog URL and individual cards. The separate traditional-dishes catalog remains available.
