# GeoTrainer — Development Plan

> Topic extension (2026-09-25): `08_BORDERS.md` describes the reviewed Borders topic, map generation, source review and dispute exclusion. Further questions from the 95-question pool remain a separate editorial batch; no bulk import is authorized by their presence in the Markdown list.

## 1. Goal

Build a static-hosted PWA prototype that proves the product concept before adding backend infrastructure or large-scale content.

The local food and architecture catalogs are exploratory draft content imported from the two editorial Markdown lists. Their local photos, attribution, and “Почему интересно” fields can be reviewed in Learn; image-based quiz questions wait for authoritative individual factual sources.

## 2. Development phases

### Phase 0 — Repository bootstrap

Deliverables:

- React + TypeScript + Vite project;
- linting/formatting;
- unit test runner;
- Playwright setup;
- basic folder structure;
- `AGENTS.md` and project documentation.

Exit criteria:

- development server runs;
- test command runs;
- production build succeeds.

### Phase 1 — Application shell and responsive navigation

Deliverables:

- root layout;
- desktop sidebar;
- mobile bottom navigation;
- routes for Learn, Quiz, Mistakes, Progress;
- basic not-found page.

Exit criteria:

- navigation works at 360 px and 1440 px;
- no horizontal layout overflow.

### Phase 2 — Content types and validation

Deliverables:

- TypeScript content types;
- schema validation;
- source/media types;
- five golden content records;
- content loader/repository.

Exit criteria:

- invalid content fails loudly in development/build;
- five sample records load through the same interface planned for production content.

### Phase 3 — Learn experience

Deliverables:

- Learn landing page;
- Flags catalog;
- Emblems catalog;
- Nature catalog;
- search/filter controls;
- detail pages;
- source/attribution display;
- image zoom or inspection interaction.

Exit criteria:

- all golden records can be found and opened on desktop and mobile.

### Phase 4 — Quiz engine

Deliverables:

- quiz mode selection;
- question generation from content;
- multiple-choice rendering;
- distractor selection;
- answer lock;
- explanation panel;
- next question behavior.

Exit criteria:

- a complete quiz session is possible without hard-coded question records.

### Phase 5 — Local progress and mistakes

Deliverables:

- IndexedDB repository;
- answer recording;
- progress aggregation;
- Mistakes screen;
- review-mistakes session;
- Progress screen.

Exit criteria:

- progress survives reload and browser restart;
- incorrect answers appear in review.

### Phase 6 — PWA

Deliverables:

- manifest;
- icons;
- service worker;
- app shell caching;
- runtime caching for accessed content/media;
- offline unavailable state.

Exit criteria:

- installability requirements pass where supported;
- previously used shell/content works offline.

### Phase 7 — Cross-device/browser QA

Test targets:

- Chrome desktop;
- Edge desktop;
- Firefox desktop as normal web app;
- Chrome Android;
- Safari iPhone/iPad when hardware is available;
- Safari macOS when available.

Viewport coverage:

- 360;
- 390;
- 430;
- tablet;
- 1280;
- 1440+.

Test:

- keyboard;
- mouse;
- touch;
- portrait/landscape;
- offline;
- slow network;
- reload persistence.

### Phase 8 — Prototype content batch

Deliverables:

- 15–20 flag entries;
- 15–20 emblem entries;
- 15–20 landmark entries;
- verified media provenance;
- verified source metadata.

Exit criteria:

- all published content validates;
- every published image has rights metadata;
- quiz remains usable with the larger data set.

### Phase 9 — Complete catalog production

Deliverables:

- one selected national or state flag per country and every eligible national symbol from the complete base and extended registries;
- every eligible concrete natural landmark from the completed source and thematic passes;
- coverage reports linking every registry decision to a published card or a documented exclusion;
- scalable catalog navigation, search, quiz selection, media loading, and PWA caching for an open-ended number of records.

Exit criteria:

- all registry rows have final decisions and the deferred queue is empty;
- every eligible row is published and every published card maps back to a registry row;
- facts, media provenance, attribution, responsive layouts, quizzes, progress, and offline behavior remain validated at full catalog size.

## 3. Milestone definition

### M0 — Skeleton

App builds and navigates.

### M1 — Learnable

Five golden content records render well.

### M2 — Trainable

Quiz works from structured content.

### M3 — Persistent

Mistakes and progress persist locally.

### M4 — Installable

PWA behavior and offline shell work.

### M5 — Prototype Complete

50–60 reviewed content entries and passing critical E2E flows.

### M6 — Full Catalog Complete

All eligible records from the versioned country, entity, and natural-landmark registries are published. The total is discovered through the audit and is not capped in advance.

## 4. Suggested implementation order for Codex

Codex should work in small vertical slices.

Preferred order:

1. bootstrap repository;
2. build navigation shell;
3. define schemas and 5 sample records;
4. implement one complete Flag detail path;
5. generalize catalog/detail components;
6. implement quiz for Flags;
7. generalize quiz to Emblems and Nature;
8. add persistence;
9. add Mistakes and Progress;
10. add PWA/offline behavior;
11. expand automated tests;
12. bulk content only after UI/schema stabilization.

Avoid implementing every empty page before one end-to-end content path works.

## 5. Definition of done for each feature

A feature is done when:

- behavior is implemented;
- TypeScript passes;
- relevant unit tests pass;
- critical UI behavior has an E2E test where appropriate;
- mobile and desktop layouts are checked;
- empty/error state exists where needed;
- no new content is hard-coded into components;
- documentation is updated if architecture or schema changes.

## 6. Static deployment

The production artifact must be deployable to static hosting.

Acceptable target architecture:

```text
Git repository
→ CI/build
→ static hosting/CDN
→ HTTPS domain
```

No server-side runtime should be required for v0.1.

## 7. Later architecture triggers

Add backend infrastructure only when one of these becomes a requirement:

- account login;
- progress sync across devices;
- remote CMS;
- collaborative editing;
- global analytics requiring server-side collection;
- user-generated content;
- personalized cloud data.

Until then, keep the prototype client-only.
