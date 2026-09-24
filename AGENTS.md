# AGENTS.md — GeoTrainer

## Project

GeoTrainer is a responsive PWA for studying geography quiz material: symbolic country flags, national coats of arms/emblems, and major natural/geographical landmarks.

Read these files before making substantial changes:

1. `01_CONCEPT.md`
2. `02_PROTOTYPE_DESIGN.md`
3. `03_CONTENT_MODEL.md`
4. `04_DEVELOPMENT_PLAN.md`

If implementation and documentation conflict, do not silently invent a new architecture. Prefer the simplest implementation consistent with the documents and update the docs when an intentional decision changes them.

## Product constraints

- Prototype is client-side only.
- No backend API.
- No server database.
- No user authentication.
- No cloud sync.
- Must be deployable as static files.
- Must work well on desktop and mobile.
- Must be installable as a PWA on supported platforms.
- Progress is stored locally.
- Content is structured data, not hard-coded into React components.
- Quiz questions are generated from content records.
- Explanations after answers are required behavior, not optional decoration.

## Recommended stack

- React
- TypeScript
- Vite
- React Router
- IndexedDB behind a repository abstraction
- Web App Manifest
- service worker / standard Vite PWA integration
- Vitest
- Playwright

Do not add large frameworks or infrastructure without a clear requirement.

## Coding rules

- Use strict TypeScript.
- Prefer small, testable modules.
- Keep domain logic out of presentation components.
- Keep storage access behind an interface/repository.
- Keep content loading behind a repository/module.
- Use stable content IDs.
- Never use array index as a persistent identity.
- Do not duplicate factual content in UI code.
- Do not duplicate full quiz answers separately from encyclopedia records when they can be derived.
- Avoid premature abstraction, but do not couple features to prototype-only sample data.

## Content rules

- Do not fabricate geography facts.
- Do not fabricate symbolism meanings.
- Treat “official meaning” and “interpretation” as different states.
- Every published content entry must have authoritative source metadata.
- Every published image must have source and rights metadata.
- Prefer an existing, suitable SVG for flags and coats of arms/emblems; record its file page, creator, license and required attribution, and verify the depicted version against an authoritative source.
- “Official website” does not automatically mean an image can be redistributed.
- Distinguish coat of arms, national emblem, state emblem, and state seal in structured data.
- Publish one flag per country: the national or state flag with the more detailed design; choose the national flag if equally detailed. Simple designs are eligible.
- For geographical superlatives, preserve measurement methodology and disputes where relevant.

## UI rules

Primary navigation:

- Learn
- Quiz
- Mistakes
- Progress

Responsive behavior:

- mobile: bottom navigation;
- desktop: sidebar navigation;
- same features and content in both layouts.

Minimum viewport tests:

- 360 px
- 390 px
- 430 px
- 1280 px
- 1440+ px

Accessibility baseline:

- semantic controls;
- keyboard navigation;
- visible focus;
- useful alt text;
- correctness not represented by color alone;
- sufficient contrast;
- reduced-motion preference respected where applicable.

## Quiz rules

Question flow:

```text
question
→ answer
→ lock input
→ show correct/incorrect state
→ show learning explanation
→ explicit next action
```

Do not skip the explanation automatically.

Prefer plausible distractors based on metadata/similarity tags.

## Persistence rules

Store local learning state through a dedicated storage abstraction.

At minimum track:

- shown count;
- correct count;
- wrong count;
- current streak;
- last result;
- last attempt timestamp.

The UI must not call IndexedDB directly.

## PWA rules

- Provide a valid manifest.
- Provide icons.
- Cache the application shell.
- Cache accessed content/media sensibly.
- Do not attempt to preload the entire future media library.
- Provide an explicit offline-unavailable state for uncached content.

## Testing rules

Before considering a task complete:

1. run type checking;
2. run relevant unit tests;
3. run production build;
4. run relevant Playwright flow for user-facing changes when available.

Critical E2E flows:

- Learn → catalog → detail;
- correct quiz answer;
- incorrect quiz answer;
- mistake appears in Mistakes;
- progress persists after reload;
- mobile navigation;
- desktop navigation;
- offline shell.

## Change discipline

- Make small coherent changes.
- Do not redesign unrelated areas while implementing a focused task.
- Do not introduce backend services in v0.1.
- Do not bulk-import content until the five golden sample records validate the schema and UI.
- When changing content schema, update sample content, validation, types, tests, and documentation together.

## Definition of done

A change is done only when it:

- works;
- builds;
- is tested at the appropriate level;
- remains responsive;
- preserves data/source rules;
- does not violate v0.1 architecture constraints.
