# GeoTrainer — Concept

## 1. Product summary

**GeoTrainer** is a responsive Progressive Web App (PWA) for preparing for geography quizzes through a combination of a compact illustrated encyclopedia and interactive training.

The product focuses on three content domains:

1. One national or state flag per country, including simple color designs.
2. National coats of arms, state emblems, and seals.
3. Major natural and geographical landmarks.

The core principle is **learn once, reuse everywhere**: every fact is stored as structured content and reused in encyclopedia pages, quiz questions, answer explanations, review sessions, and progress tracking.

## 2. Primary user goal

A user should be able to:

- quickly study a visual object;
- understand what is depicted and why it matters;
- test recognition immediately;
- review mistakes later;
- use the same application comfortably on desktop and mobile;
- continue using already loaded content with limited or no network access.

## 3. Target audience

Primary audience:

- people preparing for pub quizzes and geography quizzes;
- geography enthusiasts;
- users who learn better through visual recognition and concise explanations.

Secondary audience:

- students;
- casual learners;
- travelers interested in national symbols and physical geography.

## 4. Product principles

### 4.1 Encyclopedia first

The encyclopedia is the source of truth. Quiz questions are generated from structured encyclopedia entries rather than maintained as independent duplicated content.

### 4.2 Visual learning

Every study card should contain a relevant illustration when licensing permits it.

Images must have recorded provenance and usage rights.

### 4.3 Explanation after every answer

The app should not stop at “correct / incorrect.” Every answered question should reveal a concise learning explanation.

### 4.4 Recognition before trivia

The first version should prioritize identification and understanding:

- whose flag is this;
- whose coat of arms/emblem is this;
- what is this natural landmark and where is it located.

Advanced trivia can be added later.

### 4.5 Mobile and desktop parity

The same content and functionality should work on desktop and mobile. Layout may differ, but the information architecture should remain consistent.

### 4.6 Offline-friendly, not offline-first at any cost

The shell and previously used content should work offline. The initial prototype does not need to preload the entire media library.

## 5. Content scope

### 5.1 Flags

Include one official national or state flag per country. When both exist, select the one with more visual detail; if equal, select the national flag. Simple stripes are eligible.

Relevant elements include, but are not limited to:

- coats of arms;
- national emblems;
- birds;
- animals;
- plants, trees, flowers, leaves;
- stars or constellations;
- sun or moon;
- weapons or tools;
- architecture;
- crowns;
- inscriptions;
- religious or historical symbols.

The published catalog uses one selected national or state flag per country. Research may record other variants as excluded from this catalog.

### 5.2 Coats of arms and state emblems

The UI may use the simple section name **Coats of Arms**, but the data model must distinguish:

- coat of arms;
- national emblem;
- state emblem;
- state seal.

Each entry should explain:

- country;
- official name of the symbol;
- major visual elements;
- animals, birds, flowers, and plants if present;
- documented meaning of those elements;
- short history;
- adoption date or period where known;
- source references.

### 5.3 Natural and geographical landmarks

Initial categories:

- mountains and volcanoes;
- canyons and gorges;
- deserts;
- depressions and below-sea-level areas;
- waterfalls;
- lakes;
- rivers;
- caves;
- glaciers;
- islands;
- geological formations;
- widely recognized natural wonders.

Each entry should answer:

- what is it;
- where is it;
- country or countries;
- region;
- type;
- why it is notable;
- useful measurements, with methodology where needed;
- short explanation of the natural phenomenon.

## 6. Source and editorial policy

### 6.1 Facts

Prefer primary and authoritative sources:

- government websites;
- official legal documents;
- national heraldic institutions;
- ministries;
- national parks;
- geological and cartographic agencies;
- UNESCO;
- recognized scientific agencies.

Do not present an interpretation as official symbolism unless an authoritative source supports it.

When sources disagree, store and communicate the uncertainty instead of silently choosing a dramatic claim.

### 6.2 Images

An image may be included only when the project stores:

- source page;
- original asset URL where available;
- publisher or institution;
- author where available;
- license or rights statement;
- attribution text if required;
- date checked.

“Published by an official organization” must not be treated as equivalent to “free to reuse.”

When licensing permits redistribution, images should be stored with the project or in project-controlled object storage rather than hot-linked.

### 6.3 Editorial style

Text should be:

- concise;
- factual;
- useful for memorization;
- free of unnecessary encyclopedic detail;
- explicit about uncertainty;
- written in Russian in the first prototype.

## 7. Core user journeys

### Journey A — Study a flag

1. Open **Learn**.
2. Choose **Flags**.
3. Filter by symbol type or search country.
4. Open a card.
5. Inspect the flag and symbols.
6. Read short meaning/history.
7. Start a related quiz question.

### Journey B — Train

1. Open **Quiz**.
2. Choose Flags, Coats of Arms, Nature, or Mixed.
3. Answer one multiple-choice question.
4. See correctness and explanation.
5. Continue.
6. Results are stored locally.

### Journey C — Review mistakes

1. Open **Mistakes**.
2. See frequently missed items.
3. Start a review session.
4. Progress updates after each answer.

### Journey D — Install as an app

1. Open the web app in a compatible browser.
2. Install/add to home screen.
3. Launch in standalone mode.
4. Previously visited content remains available where cached.

## 8. MVP scope

The first usable prototype should contain approximately:

- 15–20 flag entries;
- 15–20 coat-of-arms/emblem entries;
- 15–20 natural-landmark entries.

This is a prototype quality milestone, not the final catalog limit.

The prototype must support:

- responsive desktop/mobile UI;
- installable PWA behavior;
- Learn section;
- Quiz section;
- Mistakes section;
- Progress section;
- local progress persistence;
- structured content files;
- source metadata;
- offline application shell;
- caching of previously used content.

### Full catalog scope

The full product should publish every eligible record from the completed content registries:

- one selected national or state flag and the national symbols for each of the 195 UN member and observer states;
- qualifying records from a separately classified extended registry of partially recognized states, dependencies, and territories with distinct official symbols;
- all eligible concrete natural landmarks found through the complete authoritative catalog and thematic passes defined in `06_CONTENT_PRODUCTION_PLAN.md`.

The final number of cards is determined by the audited registries and has no predefined cap. Political status must be explicit and neutral. Every record still requires verified facts, media rights, editorial review, and a working learning explanation before publication.

## 9. Explicit non-goals for prototype

Do not build yet:

- user accounts;
- cloud sync;
- backend API;
- server database;
- public CMS;
- social features;
- leaderboards;
- payments;
- Telegram integration;
- complex spaced-repetition scheduling;
- full interactive world map;
- AI-generated factual content at runtime.

## 10. Success criteria for prototype

The prototype is successful if:

- a user can understand the product without instructions;
- the same workflows are comfortable on a phone and desktop;
- content cards are more useful than a simple answer key;
- quiz explanations reinforce the study content;
- mistakes persist after reload;
- the app can be installed as a PWA on supported platforms;
- previously opened content remains usable after temporary loss of network;
- adding a new content item does not require editing quiz code.
