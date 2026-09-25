# GeoTrainer — Prototype Design Document

> Topic extension (2026-09-25): `08_BORDERS.md` specifies the reviewed Borders pilot. It uses a separate structured adjacency repository, local SVG maps, `/learn/borders`, `/border/:countryId`, and the existing quiz/progress storage. The four primary navigation destinations remain the same.

## 1. Purpose

This document defines the functional and technical design for GeoTrainer v0.1.

The prototype is a client-side PWA with structured local content and local progress persistence. No backend is required.

The Learn screen also links to local draft catalogs for foods and architecture. These use structured records in `content/travel-cards.json`, local photos with the same aspect ratio as nature photos, media credits in `content/travel-media.json`, and a required “Почему интересно” field. Some ingredient or regional photos are explicitly labeled as illustrative. The catalogs remain outside quiz topics pending individual factual source review.

## 2. Technology stack

Recommended stack:

- React;
- TypeScript;
- Vite;
- React Router;
- CSS Modules, plain CSS, or a small utility layer;
- IndexedDB for user progress;
- Web App Manifest;
- service worker generated through a standard Vite PWA integration / Workbox-based setup;
- Vitest for unit tests;
- Playwright for desktop/mobile end-to-end tests.

Avoid introducing a backend, database server, container infrastructure, or authentication in v0.1.

## 3. Application architecture

```text
Browser / installed PWA
│
├── React UI
│   ├── Learn
│   ├── Quiz
│   ├── Mistakes
│   └── Progress
│
├── Content repository
│   ├── countries/*.json
│   ├── landmarks/*.json
│   └── media metadata
│
├── Quiz engine
│
├── Local progress repository
│   └── IndexedDB
│
└── PWA layer
    ├── manifest
    └── service worker/cache
```

## 4. Proposed repository structure

```text
/
├── AGENTS.md
├── README.md
├── package.json
├── vite.config.ts
├── public/
│   ├── icons/
│   └── media/
│       ├── flags/
│       ├── emblems/
│       └── landmarks/
├── content/
│   ├── countries/
│   ├── landmarks/
│   └── sources/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── learn/
│   │   ├── quiz/
│   │   ├── mistakes/
│   │   └── progress/
│   ├── data/
│   ├── storage/
│   ├── pwa/
│   ├── types/
│   └── styles/
└── tests/
    ├── unit/
    └── e2e/
```

## 5. Main navigation

The prototype has four primary destinations:

1. **Learn**
2. **Quiz**
3. **Mistakes**
4. **Progress**

### Desktop

Use a left sidebar when sufficient width is available.

### Mobile

Use a bottom navigation bar with four destinations.

The labels and route structure should remain identical between layouts.

## 6. Routes

Suggested routes:

```text
/
/learn
/learn/flags
/learn/emblems
/learn/nature
/country/:countryId
/country/:countryId/flag/:flagId
/country/:countryId/emblem/:emblemId
/landmark/:landmarkId
/quiz
/quiz/flags
/quiz/emblems
/quiz/nature
/quiz/mixed
/mistakes
/progress
/about/sources
```

Route names may change, but content IDs must remain stable and URL-safe.

## 7. Learn screen

### 7.1 Learn landing page

Display three large categories:

- Flags;
- Coats of Arms;
- Nature.

Each category card shows:

- title;
- short description;
- number of currently available entries.

### 7.2 Flags catalog

Required controls:

- search by country;
- filter by symbol type;
- clear filters.

Initial filter values can include:

- bird;
- animal;
- plant;
- coat of arms / emblem;
- sun;
- moon;
- stars;
- weapon/tool;
- architecture;
- inscription;
- other.

Each result card should display:

- flag image;
- country name;
- short list of key symbols.

### 7.3 Emblems catalog

Each card:

- image;
- country;
- official symbol name if useful;
- type: coat of arms / emblem / seal.

### 7.4 Nature catalog

Filters:

- type;
- country/region;
- notable category where useful.

Each card:

- image;
- object name;
- country/location;
- object type.

## 8. Content detail screen

All detail screens share a common visual hierarchy:

1. hero image;
2. title;
3. short identification summary;
4. key facts;
5. explanation;
6. history/context;
7. sources and image attribution;
8. “Test yourself” action.

### Mobile

Single-column layout.

### Desktop

Prefer a two-column layout when appropriate:

- media on the left;
- content on the right.

The layout must collapse cleanly to one column without hiding information.

## 9. Flag detail design

Required sections:

- country;
- official flag variant name;
- large image;
- variant type;
- “What is depicted”;
- symbol list;
- concise explanation of documented meaning;
- short history/adoption context;
- related emblem link when relevant;
- sources;
- media rights/attribution.

Support zoom/full-screen inspection of complex symbols.

## 10. Emblem detail design

Required sections:

- country;
- official name;
- symbol type;
- large image;
- elements;
- animals/birds/plants where present;
- meaning;
- short history;
- adoption date/period;
- sources;
- media rights/attribution.

Do not label a national emblem or seal as a coat of arms in the structured data if it is not one.

## 11. Landmark detail design

Required sections:

- object name;
- image;
- country/countries;
- region;
- geographic type;
- coordinates when available;
- key measurement(s);
- why notable;
- concise natural/geographic explanation;
- record claim notes where applicable;
- sources;
- media rights/attribution.

For disputed superlatives, display the actual metric and caveat rather than a bare “largest/deepest/highest” claim.

## 12. Quiz design

### 12.1 Modes

v0.1:

- Flags;
- Emblems;
- Nature;
- Mixed.

### 12.2 Question types

#### Flags

Prompt: “Which country does this flag belong to?”

Input:

- image;
- four country choices.

Answer explanation:

- correct country;
- key symbols;
- one concise memory aid or distinguishing fact derived from the content entry.

#### Emblems

Prompt: “Whose coat of arms/emblem is this?”

Input:

- image;
- four country choices.

Answer explanation:

- country;
- official type/name;
- major elements;
- meaning;
- short historical note.

#### Nature

Possible prompts:

- “What is this place?”
- “Where is this located?”

The prototype may use only one prompt type initially if that simplifies implementation.

Answer explanation:

- name;
- location;
- type;
- concise notable fact.

### 12.3 Quiz behavior

State flow:

```text
question
→ user answer
→ locked answer state
→ result + explanation
→ next question
```

Do not immediately replace the question after an answer. The explanation is a required learning step.

### 12.4 Distractor selection

Prefer plausible distractors.

Examples:

- flags with similar layouts or colors;
- countries from the same broad region;
- emblems with visually similar categories;
- landmarks of the same type.

The first prototype can use deterministic metadata-based rules instead of sophisticated similarity scoring.

## 13. Mistakes screen

Display items that have at least one incorrect answer.

Sort initially by a simple priority formula such as:

```text
mistakeScore = wrongAnswers * 2 - correctAnswers
```

Exact formula is not a product requirement; it should be easy to replace later.

Each row/card shows:

- object thumbnail;
- object name/country after identification is appropriate;
- wrong count;
- correct count;
- last attempted date;
- “Review” action.

Provide a “Review mistakes” quiz session.

## 14. Progress screen

Show at minimum:

- questions answered;
- correct percentage;
- progress by Flags / Emblems / Nature;
- number of items needing review;
- recent activity if trivial to implement.

Avoid gamification systems in v0.1 unless they are nearly free to add.

## 15. Local persistence

Use IndexedDB behind a small repository abstraction.

Suggested record:

```ts
interface ProgressRecord {
  contentId: string;
  contentType: 'flag' | 'emblem' | 'landmark';
  shownCount: number;
  correctCount: number;
  wrongCount: number;
  currentStreak: number;
  lastResult: 'correct' | 'wrong';
  lastAttemptAt: string;
}
```

Do not couple UI components directly to IndexedDB APIs.

Provide a storage module/repository so cloud sync can replace or extend it later.

## 16. PWA behavior

Required:

- valid web app manifest;
- app icons;
- standalone-capable display mode;
- service worker;
- HTTPS in deployed environments;
- app shell cached;
- content JSON and images cached after use where practical.

Do not preload the full future media collection.

### Offline expectation for v0.1

When offline, a user should be able to:

- launch an already installed/visited app;
- access the shell;
- reopen previously cached content;
- use locally available quiz content;
- retain progress.

If requested content is unavailable offline, show a clear state rather than a broken image or blank screen.

## 17. Responsive design requirements

Target widths to test:

- 360 px;
- 390 px;
- 430 px;
- tablet width;
- 1280 px;
- 1440+ px.

Requirements:

- no horizontal scrolling in normal layouts;
- tap targets appropriate for touch;
- readable text without pinch zoom;
- images preserve aspect ratio;
- navigation remains reachable with one hand on mobile;
- desktop layout uses available width without becoming excessively stretched.

## 18. Accessibility requirements

Prototype baseline:

- keyboard-accessible navigation;
- visible focus states;
- semantic buttons and links;
- useful alt text for learning images;
- sufficient text/background contrast;
- do not communicate correctness only through color;
- respect reduced-motion preference for nonessential transitions.

## 19. Error and empty states

Required states:

- no search results;
- image unavailable;
- content unavailable offline;
- no mistakes yet;
- no progress yet;
- malformed content entry caught in development.

The app should fail visibly and informatively rather than silently.

## 20. Testing strategy

### Unit tests

Cover:

- quiz question generation;
- distractor selection;
- progress aggregation;
- mistake selection;
- content validation helpers.

### End-to-end tests

At minimum:

1. Open Learn → Flags → content detail.
2. Complete one correct quiz answer.
3. Complete one incorrect quiz answer.
4. Confirm mistake appears in Mistakes.
5. Reload and verify progress persists.
6. Verify mobile navigation.
7. Verify desktop navigation.
8. Verify offline shell behavior.

Use Playwright desktop and mobile viewport/device profiles.

## 21. Prototype acceptance criteria

GeoTrainer v0.1 is complete when:

- the app runs locally with one documented command;
- production build succeeds;
- it can be deployed as static files;
- all four primary sections work;
- at least 5 sample entries render correctly before bulk content import;
- quiz questions are generated from content data;
- progress persists locally;
- mistakes can be reviewed;
- app is responsive at defined widths;
- PWA install metadata is valid;
- offline shell works;
- source/rights metadata is visible or reachable for every image;
- automated tests cover critical user flows.
