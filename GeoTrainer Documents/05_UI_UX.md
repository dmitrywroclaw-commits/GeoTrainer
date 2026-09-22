# GeoTrainer — UI/UX Design Specification

## 1. Purpose

This document defines the visual system, responsive layout, interaction patterns, and screen-level UX rules for the GeoTrainer v0.1 PWA.

It is intended to be implementation guidance for Codex and a reference for manual review.

GeoTrainer is a visual learning product. The interface must support three actions with minimal friction:

1. **find** an object quickly;
2. **inspect and understand** it;
3. **test recognition** immediately.

The content itself — flags, coats of arms, emblems, and landmark photography — is visually rich. The UI should therefore be restrained and should not compete with the material.

The first prototype is written in Russian. Code identifiers and internal component names may remain in English.

---

## 2. Design direction

### 2.1 Character

The product should feel:

- calm;
- clear;
- visual;
- factual;
- modern but not fashionable for its own sake;
- suitable for adults and serious hobbyists;
- comfortable for repeated study sessions.

A useful design reference is the combination of:

- encyclopedia-like information hierarchy;
- modern educational-app interaction clarity;
- travel-guide treatment of imagery.

Do **not** imitate the appearance of a specific product.

### 2.2 Avoid

Do not use:

- decorative gradients as a primary visual language;
- glassmorphism;
- neon effects;
- 3D decoration;
- excessive shadows;
- large animated backgrounds;
- confetti or celebratory effects after each answer;
- child-oriented gamification;
- color-heavy navigation;
- large dashboard surfaces filled with metrics;
- hidden navigation for primary destinations;
- tiny images inside text-heavy cards.

### 2.3 Core visual principle

> Color should primarily come from the content, not from the interface.

Flags, heraldry, and photography should be the strongest visual elements on each screen.

---

## 3. Information architecture

Primary navigation has four destinations:

1. **Изучать**
2. **Квиз**
3. **Ошибки**
4. **Прогресс**

Secondary destinations are contextual:

- Flags;
- Coats of Arms / Emblems;
- Nature;
- Country detail;
- Object detail;
- Sources;
- Settings/about if later required.

Primary destinations must remain identical between desktop and mobile. Only their placement changes.

---

## 4. Responsive strategy

GeoTrainer is designed for two primary contexts:

- a wide desktop/laptop screen used for browsing, comparison, and reading;
- a vertical phone screen used for quick study and quiz sessions.

Tablet support should emerge naturally between these layouts.

### 4.1 Breakpoints

Use content-driven CSS rather than device detection.

Recommended layout breakpoints:

```text
0–599 px       compact mobile
600–767 px     large mobile / small tablet
768–1023 px    tablet
1024–1439 px   desktop
1440+ px       wide desktop
```

These values are implementation defaults, not rigid product requirements. Components may adapt earlier if their content requires it.

### 4.2 Required test widths

At minimum manually and automatically test:

```text
360 × 800
390 × 844
430 × 932
768 × 1024
1280 × 800
1440 × 900
1920 × 1080
```

Also test phone portrait with browser UI visible and installed-PWA mode.

---

## 5. Global layout system

### 5.1 Desktop application shell

For widths `>= 1024 px`, use a persistent left sidebar.

Recommended geometry:

```text
Viewport
┌───────────────┬───────────────────────────────────────────────┐
│               │                                               │
│ Sidebar       │ Main content                                  │
│ 224–248 px    │                                               │
│               │ max content width approximately 1180–1240 px │
│               │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

Rules:

- sidebar is fixed or sticky within viewport height;
- main content must not stretch text to the full width of a 1920 px display;
- center the primary content area inside the remaining space;
- allow visual catalogs to use more width than prose pages;
- prose blocks should normally stay within `640–760 px` line width;
- keep at least `32 px` horizontal content padding on ordinary desktop screens;
- wide screens may increase outer whitespace instead of increasing text width.

### 5.2 Mobile application shell

For widths `< 768 px`, use:

- compact top app bar;
- scrollable content area;
- fixed bottom navigation for primary destinations;
- safe-area padding for devices with a home indicator.

Recommended geometry:

```text
┌────────────────────────────┐
│ Top bar                    │ 48–56 px
├────────────────────────────┤
│                            │
│ Scrollable content         │
│                            │
│                            │
├────────────────────────────┤
│ Bottom navigation          │ 60–68 px + safe area
└────────────────────────────┘
```

Mobile horizontal content padding:

- `16 px` at 360–430 px widths;
- may increase to `20–24 px` on larger phones/tablets.

Do not use a hamburger menu for the four primary destinations.

### 5.3 Tablet

At `768–1023 px`:

- keep bottom navigation unless the sidebar can be introduced without compressing content;
- catalogs may use 3–4 columns;
- detail pages may become two-column only when both columns remain comfortable;
- never force desktop layout onto a portrait tablet.

---

## 6. Spacing and sizing system

Use a small, consistent spacing scale.

Recommended tokens:

```text
4 px    micro spacing
8 px    tight spacing
12 px   compact control gap
16 px   default mobile spacing
24 px   section/internal card spacing
32 px   major desktop spacing
48 px   section separation
64 px   large page separation
```

Recommended corner radii:

```text
controls       8–10 px
cards          12–16 px
large media    16 px
chips          fully rounded or 999 px
```

Avoid excessive rounding that makes the interface look toy-like.

### Touch targets

Interactive targets should be at least approximately `44 × 44 px`.

Quiz answers on mobile should be at least `52 px` high when possible.

---

## 7. Typography

Use a neutral sans-serif UI font. Prefer system font stack or a highly legible web font if included intentionally.

Recommended hierarchy:

```text
Page title                 28–32 px / 700
Large detail title         28–36 px / 700
Section heading            20–24 px / 650–700
Card title                 16–18 px / 600
Body                       16–18 px / 400
Metadata                   14–15 px / 400–500
Small source/utility text  12–14 px / 400
```

Mobile body copy must not drop below `16 px` for primary reading text.

Use comfortable line height:

```text
headings   1.15–1.3
body       1.45–1.65
```

Avoid centered long-form text. Center alignment is acceptable for short quiz prompts and empty states.

---

## 8. Color system

Use a light neutral theme for v0.1.

Suggested semantic structure:

```text
Canvas background     warm/cool off-white
Surface               white
Primary text          near-black
Secondary text        neutral gray
Border                light neutral gray
Primary accent        restrained dark blue or blue-green
Success               green
Error                 red
Warning               amber
Focus                  high-contrast accent ring
```

Exact colors should be implemented as design tokens rather than scattered literal values.

Requirements:

- meet WCAG AA contrast for normal text;
- correct/incorrect states must not rely on color alone;
- images should not receive colored overlays unless functionally required;
- do not tint flag or heraldic artwork.

Dark mode is outside v0.1 scope.

---

## 9. Navigation

### 9.1 Desktop sidebar

Recommended structure:

```text
GeoTrainer

Изучать
Квиз
Ошибки
Прогресс

──────────
О проекте / Источники     optional secondary area
```

Rules:

- logo/name at top;
- primary navigation visible without scrolling at normal desktop height;
- active destination visually obvious through background/indicator + text weight;
- icons may support labels but never replace labels;
- sidebar should not contain unrelated statistics.

### 9.2 Mobile bottom navigation

Recommended layout:

```text
┌────────┬────────┬────────┬──────────┐
│ Изучать│  Квиз  │ Ошибки │ Прогресс │
└────────┴────────┴────────┴──────────┘
```

Use icon + short label.

Rules:

- always visible on ordinary browsing screens;
- active state must be unmistakable;
- labels must not wrap;
- respect `env(safe-area-inset-bottom)`;
- no notification badge unless it communicates meaningful content, e.g. number of mistakes available for review.

### 9.3 Quiz focus mode

During an active quiz question, hide the standard sidebar/bottom navigation.

Replace it with a compact quiz header:

```text
← Выйти                    4 / 10
```

Reason: recognition questions should use the largest possible image and reduce accidental navigation.

Leaving a quiz should require a lightweight confirmation only if progress in the current session would be lost.

---

## 10. Top bars and page headers

### Mobile

Use a compact top bar for contextual navigation:

```text
← Флаги                  [search/action]
```

Do not repeat a large app logo on every screen.

### Desktop

The sidebar already identifies the application. Page content should start with:

```text
Флаги
Изучайте символы на официальных флагах стран
```

A breadcrumb is optional and only useful for deeper detail pages.

Example:

```text
Изучать / Флаги / Мексика
```

Do not use breadcrumbs on mobile unless they fit naturally; a back button is more useful there.

---

## 11. Home / Learn landing page

The main purpose is to choose a learning domain quickly.

### Desktop

Use three large category cards in one row where possible:

```text
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Flags visual     │ │ Emblem visual    │ │ Nature visual    │
│                  │ │                  │ │                  │
│ Флаги            │ │ Гербы            │ │ Природа          │
│ short descriptor │ │ short descriptor │ │ short descriptor │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

Below them, show at most two secondary blocks:

- **Продолжить изучение** if local history exists;
- **Повторить ошибки** if mistakes exist.

Do not turn this page into an analytics dashboard.

### Mobile

Use vertically stacked large category cards or a compact visual list.

Recommended order:

```text
Изучать

[ Флаги ]
[ Гербы ]
[ Природа ]

Продолжить
...

Ошибки для повторения
...
```

Each category must be reachable with one tap and have a large visual target.

---

## 12. Search and filters

Search is important because GeoTrainer should support queries such as:

- `орёл`;
- `лев`;
- `солнце`;
- `кактус`;
- `Мексика`;
- `ущелье`.

### 12.1 Desktop catalog toolbar

Use one horizontal toolbar when space allows:

```text
[ Поиск по стране, символу или объекту...        ] [Фильтры]

[Все] [Птицы] [Животные] [Растения] [Герб] [Солнце] ...
```

Search should be visually dominant over filters.

If chips do not fit in one row, wrap to a second row rather than compress labels excessively.

### 12.2 Mobile catalog toolbar

Use:

1. full-width search field;
2. horizontally scrollable filter chips below it.

```text
[ Поиск...                         ]

← scroll →
[Все] [Птицы] [Животные] [Растения] [Герб] ...
```

Do not make users open a modal merely to select one common symbol category.

More advanced filters may live in a sheet later.

### 12.3 Sticky behavior

On long catalogs, the search/filter zone may become sticky below the top bar, but only if it does not consume too much vertical space.

On a 360 px wide phone, aim to keep sticky UI below approximately 120 px total height excluding browser chrome.

---

## 13. Catalog cards

Different content types need different card proportions.

### 13.1 Flag cards

Flags are recognizable in small dimensions, so use a dense visual grid.

Mobile:

- 2 columns at 360+ px;
- `12 px` gap;
- image area uses natural flag aspect ratio inside a neutral frame;
- country name below;
- at most one short metadata line.

Example:

```text
┌───────────────┐  ┌───────────────┐
│               │  │               │
│     FLAG      │  │     FLAG      │
│               │  │               │
│ Мексика       │  │ Бутан         │
│ Орёл · кактус │  │ Дракон        │
└───────────────┘  └───────────────┘
```

Desktop:

- 4 columns around 1024–1279 px depending on usable width;
- 5 columns around 1280–1599 px when comfortable;
- up to 6 on very wide catalog surfaces if cards remain at least about 180 px wide.

Do not increase beyond a useful scan density.

### 13.2 Coat of arms / emblem cards

Use similar grid behavior, but artwork should sit on a neutral surface with more internal whitespace.

Do not crop heraldic art. Use `object-fit: contain`.

### 13.3 Landmark cards

Photography needs more context.

Mobile:

- prefer 1 column;
- wide image around 16:10 or 4:3;
- title + country/region directly below;
- one concise metadata line.

Desktop:

- 3 columns by default;
- 4 only when sufficient width exists.

Do not force landmark photos into the same dense grid as flags.

---

## 14. Detail page — flags and emblems

This is one of the most important layouts in the product.

### 14.1 Mobile portrait

Use a strict vertical sequence:

```text
← Флаги

Мексика
Государственный флаг

┌──────────────────────────┐
│                          │
│       LARGE FLAG         │
│                          │
└──────────────────────────┘
[ Открыть крупнее ]

Что изображено
• Орёл
• Змея
• Кактус

Что означают символы
...

История
...

Источник и права
...

[ Проверить себя ]
```

Rules:

- media appears before long explanation;
- do not place two text columns on phone;
- avoid accordions for core information;
- source/rights details may be compact but must remain reachable;
- the primary CTA appears after the user has had an opportunity to study the material.

### 14.2 Desktop

Use a two-column hero/detail grid.

Recommended proportions:

```text
12-column content grid

Media        5 columns
Text         7 columns
```

Example:

```text
┌───────────────────────────┬─────────────────────────────────┐
│                           │ Мексика                         │
│                           │ Государственный флаг            │
│       LARGE FLAG          │                                 │
│                           │ Что изображено                  │
│                           │ • Орёл                          │
│                           │ • Змея                          │
│                           │ • Кактус                        │
│                           │                                 │
│ [Открыть крупнее]         │ Что означает                   │
│                           │ ...                             │
└───────────────────────────┴─────────────────────────────────┘

История
[ readable text column ]

Источник и права
...

[ Проверить себя ]
```

The media column may be `position: sticky` below the page header when the text is long. Do not use sticky behavior if it creates awkward overlap at shorter viewport heights.

### 14.3 Media viewer

Flag and emblem details often require close inspection.

Click/tap on the image should open a focused viewer with:

- larger image;
- zoom/pinch support where feasible;
- close button;
- original aspect ratio;
- no decorative background effects.

The viewer must not crop the image.

---

## 15. Detail page — natural landmarks

Photography should receive more visual prominence than on flag/emblem pages.

### Mobile

Preferred order:

```text
← Природа

[ LARGE PHOTO ]

Гранд-Каньон
США · Аризона

Кратко
...

Тип
Каньон

Ключевые размеры
...

Почему известен
...

Как образовался
...

Источник фото
Источник фактов

[ Проверить себя ]
```

### Desktop

Two acceptable patterns:

**Pattern A — wide visual hero**

Use when the image is central to recognition:

```text
[                 wide photo                  ]

Title + location

Facts column       Explanation column
```

**Pattern B — split layout**

Use when facts are more important than scenic presentation:

```text
Photo 7 cols       Key facts 5 cols

Long explanation below
```

Choose one consistent default in implementation. For v0.1, prefer **Pattern B** because it aligns with flag/emblem detail behavior and reduces layout complexity.

---

## 16. Quiz setup screen

The quiz landing screen should answer only three questions:

1. what are we training;
2. how many questions;
3. start.

### Desktop

Use a centered card or compact settings panel, not a full dashboard.

```text
Квиз

Что тренируем?
[ Флаги ] [ Гербы ] [ Природа ] [ Смешанный ]

Количество
[ 5 ] [ 10 ] [ 20 ]

[ Начать тренировку ]
```

### Mobile

Use stacked controls with full-width primary action near the bottom of content.

Avoid dropdowns when a short set of visible choices is possible.

---

## 17. Active quiz question

The active quiz screen must be visually quieter than the rest of the application.

### 17.1 Shared rules

- hide primary app navigation;
- show compact exit/back control;
- show progress, e.g. `4 / 10`;
- show one question only;
- make image the strongest element;
- answer buttons must remain visible without excessive scrolling when possible;
- after selection, lock the answers;
- do not auto-advance;
- show educational feedback;
- provide explicit **Следующий вопрос** action.

### 17.2 Mobile portrait

Target arrangement:

```text
← Выйти                    4 / 10

Какой стране принадлежит этот флаг?

┌──────────────────────────┐
│                          │
│          FLAG            │
│                          │
└──────────────────────────┘

[ Мексика                  ]
[ Эквадор                  ]
[ Колумбия                 ]
[ Боливия                  ]
```

Optimization rules:

- question text should normally fit in 1–3 lines;
- image should use available width but generally not exceed about `35–42vh` before answering;
- four answer buttons use one vertical column;
- keep `8–12 px` gaps between answers;
- avoid forcing the fourth answer below a large empty area;
- on very short screens, allow the content to scroll rather than shrinking text/touch targets.

### 17.3 Desktop

Use a centered quiz column, approximately `720–860 px` maximum width.

For short country-name answers, a `2 × 2` answer grid is preferred:

```text
                 Question

              [ large image ]

        [ Мексика ]    [ Эквадор ]
        [ Колумбия ]   [ Боливия ]
```

If answers become long, automatically switch to one column.

Do not place unrelated sidebars or progress analytics next to the question.

---

## 18. Quiz feedback after an answer

Feedback is a learning screen, not only a correctness indicator.

### Correct answer

Show:

- clear success indicator + text;
- correct country/object name;
- 2–5 key symbols/facts;
- one concise explanation;
- optional **Подробнее** link;
- explicit **Следующий вопрос** button.

### Incorrect answer

Show:

- neutral but clear error state;
- `Ваш ответ: ...`;
- `Правильный ответ: ...`;
- one useful distinction or memory cue;
- relevant image detail when useful;
- explicit next action.

Do not use shaming copy or overly celebratory copy.

### Mobile layout

Feedback should appear directly below the locked answer area and naturally continue the scroll.

The **Следующий вопрос** button may become sticky near the bottom of the viewport after feedback is revealed, as long as it does not cover content and safe-area padding is respected.

### Desktop layout

Feedback can appear in a full-width panel directly below answers. Keep it inside the same centered quiz column.

---

## 19. Mistakes screen

The goal is action, not analytics.

### Default state

Show:

```text
Ошибки
17 объектов для повторения

[ Повторить ошибки ]

Чаще всего ошибаетесь
...
```

Group by domain if useful:

- Flags;
- Coats of Arms;
- Nature.

Each mistake item may show:

- thumbnail;
- name;
- number of wrong answers;
- last attempt;
- compact action to open the encyclopedia entry.

### Desktop

Use a list/table-like card layout, not a dense spreadsheet.

### Mobile

Use one-column rows with thumbnail left, text right.

Avoid putting four different statistics on every row.

---

## 20. Progress screen

Progress should remain simple in v0.1.

Primary summary:

```text
Флаги      73%
Гербы      41%
Природа    64%
```

Secondary information:

- items studied;
- current review count;
- recent activity if useful.

Do not create complex graphs until there is enough data to justify them.

### Desktop

Use 3 summary cards in one row followed by a concise section below.

### Mobile

Stack or use a compact 3-row summary. Prefer readability over decorative circular meters.

---

## 21. Sources and attribution UX

Sources must be available without dominating the learning flow.

### Content pages

At the bottom of each detail page show a compact section:

```text
Источники
Факты: [institution / document]
Изображение: [publisher / author]
Лицензия / права: ...
Проверено: ...
```

For multiple references, the section may be collapsible, but the existence of sources must be visible without opening it.

Do not display raw long URLs in the primary reading flow.

---

## 22. Empty, loading, error, and offline states

Every major screen needs intentional non-happy-path states.

### Empty search

```text
Ничего не найдено
Попробуйте другое название или уберите часть фильтров.
[ Сбросить фильтры ]
```

### No mistakes

```text
Ошибок для повторения пока нет.
[ Начать квиз ]
```

### Offline, cached content available

Allow normal use and show only a subtle offline indicator if needed.

### Offline, uncached media unavailable

Show:

- reserved image area;
- clear text that the image is not cached;
- no broken-image icon;
- retry action when connection returns.

### Loading

Use layout-preserving skeletons for catalogs/details if loading is asynchronous.

Avoid full-screen spinners for ordinary content navigation.

---

## 23. Interaction and animation

Motion should communicate state, not decorate.

Allowed examples:

- short page/control transitions;
- filter chip state transition;
- answer-state transition;
- bottom-sheet/modal entrance;
- media viewer zoom.

Recommended duration range:

```text
120–220 ms for most UI transitions
```

Respect `prefers-reduced-motion`.

Do not animate flags, emblems, or photos as decorative floating elements.

---

## 24. Accessibility requirements

Minimum baseline:

- semantic buttons and links;
- keyboard navigation on desktop;
- visible focus rings;
- logical tab order;
- labels for search and controls;
- meaningful alt text for educational images;
- decorative icons hidden from assistive technology;
- success/error not conveyed by color alone;
- text contrast at WCAG AA level;
- zoom up to 200% without loss of core functionality;
- touch targets approximately 44 px minimum;
- dialogs trap focus correctly;
- Escape closes dialogs on desktop;
- no important information only on hover.

Educational-image alt text needs special care: on a quiz screen, alt text must **not reveal the answer**. The quiz image may use neutral alt text such as `Изображение флага для вопроса`. On the encyclopedia detail screen, descriptive alt text is appropriate.

---

## 25. Desktop optimization principles

Desktop space should be used for **parallel information**, not simply enlarged mobile content.

Use wide screens for:

- image + explanation side by side;
- larger catalog grids;
- persistent navigation;
- comparison-friendly visual scanning;
- keeping key facts visible beside media.

Do not use wide screens for:

- 1200 px-wide paragraphs;
- oversized headings;
- unnecessary right-side widgets;
- empty decorative panels.

Recommended maximum widths:

```text
App content shell      ~1240 px excluding sidebar
Readable prose         640–760 px
Quiz content           720–860 px
Detail split grid      1000–1180 px
Catalog grid           1100–1240 px
```

---

## 26. Vertical-mobile optimization principles

A phone is primarily a **single-task vertical learning surface**.

Priority order:

```text
identity / question
→ image
→ essential facts or answers
→ explanation
→ action
```

Rules:

- one main column;
- no side-by-side prose blocks;
- full-width controls where appropriate;
- short headings;
- bottom navigation only outside active quiz;
- horizontal scrolling allowed for filter chips, not for core content;
- media should remain large enough to inspect;
- avoid large top headers that push content below the fold;
- use sticky actions sparingly;
- account for browser bars and safe areas;
- do not require hover;
- do not shrink controls just to fit everything above the fold.

### First-screen target for a detail page

On a typical 390 × 844 phone, the first viewport should ideally reveal:

- back/context navigation;
- object title;
- most or all of the primary image;
- beginning of the first information section.

### First-screen target for a quiz

The first viewport should ideally reveal:

- quiz progress;
- complete question;
- complete image;
- at least the first 2–3 answer choices.

Scrolling to the final choice is acceptable on unusually short screens, but should not be the default at 390 × 844.

---

## 27. Component inventory for v0.1

Build a small reusable component system rather than page-specific styles.

Minimum components:

```text
AppShell
DesktopSidebar
MobileBottomNav
MobileTopBar
PageHeader
SearchField
FilterChip
FilterChipRow
CategoryCard
FlagCard
EmblemCard
LandmarkCard
MediaFrame
MediaViewer
DetailSection
FactList
SourceBlock
PrimaryButton
SecondaryButton
QuizHeader
QuizPrompt
QuizAnswerButton
QuizFeedback
ProgressSummary
MistakeRow
EmptyState
OfflineMediaPlaceholder
```

Components should support variants through props rather than copied markup.

---

## 28. Design tokens

Create central tokens from the beginning.

Suggested groups:

```text
colors
spacing
radii
font sizes
font weights
line heights
shadows
content widths
navigation sizes
z-index layers
transition durations
breakpoints
```

Do not hard-code unrelated values independently across pages.

Keep shadows subtle. Most separation should come from spacing, borders, and surfaces.

---

## 29. Suggested page wireframes

### 29.1 Desktop catalog

```text
┌──────────────┬───────────────────────────────────────────────────────────┐
│ GeoTrainer   │ Флаги                                                     │
│              │ Изучайте символы на официальных флагах стран            │
│ Изучать      │                                                           │
│ Квиз         │ [ Поиск............................................ ]     │
│ Ошибки       │ [Все] [Птицы] [Животные] [Растения] [Герб] ...          │
│ Прогресс     │                                                           │
│              │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│              │ │ FLAG   │ │ FLAG   │ │ FLAG   │ │ FLAG   │              │
│              │ │Mexico  │ │Bhutan  │ │...     │ │...     │              │
│              │ └────────┘ └────────┘ └────────┘ └────────┘              │
│              │                                                           │
│              │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│              │ │ ...    │ │ ...    │ │ ...    │ │ ...    │              │
│              │ └────────┘ └────────┘ └────────┘ └────────┘              │
└──────────────┴───────────────────────────────────────────────────────────┘
```

### 29.2 Mobile catalog

```text
┌────────────────────────────┐
│ Флаги                      │
├────────────────────────────┤
│ [ Поиск...               ] │
│ [Все] [Птицы] [Животные]→ │
│                            │
│ ┌──────────┐ ┌──────────┐ │
│ │  FLAG    │ │  FLAG    │ │
│ │ Мексика  │ │ Бутан    │ │
│ └──────────┘ └──────────┘ │
│                            │
│ ┌──────────┐ ┌──────────┐ │
│ │  FLAG    │ │  FLAG    │ │
│ │ ...      │ │ ...      │ │
│ └──────────┘ └──────────┘ │
│                            │
├────────────────────────────┤
│ Учить  Квиз  Ошибки  Прогр│
└────────────────────────────┘
```

### 29.3 Desktop detail

```text
┌──────────────┬───────────────────────────────────────────────────────────┐
│ navigation   │ Изучать / Флаги / Мексика                               │
│              │                                                           │
│              │ ┌─────────────────────┬─────────────────────────────────┐ │
│              │ │                     │ Мексика                         │ │
│              │ │       FLAG          │ Государственный флаг            │ │
│              │ │                     │                                 │ │
│              │ │                     │ Что изображено                  │ │
│              │ │                     │ • ...                           │ │
│              │ │                     │ • ...                           │ │
│              │ └─────────────────────┴─────────────────────────────────┘ │
│              │                                                           │
│              │ История                                                   │
│              │ readable text                                             │
│              │                                                           │
│              │ Источники                                                 │
│              │                                                           │
│              │ [ Проверить себя ]                                        │
└──────────────┴───────────────────────────────────────────────────────────┘
```

### 29.4 Mobile detail

```text
┌────────────────────────────┐
│ ← Флаги                    │
├────────────────────────────┤
│ Мексика                    │
│ Государственный флаг       │
│                            │
│ ┌────────────────────────┐ │
│ │                        │ │
│ │          FLAG          │ │
│ │                        │ │
│ └────────────────────────┘ │
│                            │
│ Что изображено             │
│ • ...                      │
│ • ...                      │
│                            │
│ Что означает               │
│ ...                        │
│                            │
│ История                    │
│ ...                        │
│                            │
│ Источники                  │
│ ...                        │
│                            │
│ [ Проверить себя         ] │
├────────────────────────────┤
│ Учить  Квиз  Ошибки  Прогр│
└────────────────────────────┘
```

### 29.5 Mobile active quiz

```text
┌────────────────────────────┐
│ ← Выйти              4 / 10│
├────────────────────────────┤
│                            │
│ Какой стране принадлежит   │
│ этот флаг?                 │
│                            │
│ ┌────────────────────────┐ │
│ │                        │ │
│ │          FLAG          │ │
│ │                        │ │
│ └────────────────────────┘ │
│                            │
│ [ Мексика                ] │
│ [ Эквадор                ] │
│ [ Колумбия               ] │
│ [ Боливия                ] │
│                            │
└────────────────────────────┘
```

No bottom navigation during the active quiz.

---

## 30. Responsive behavior matrix

| Element | Mobile portrait | Tablet | Desktop |
|---|---|---|---|
| Primary navigation | Bottom bar | Bottom bar / adaptive | Left sidebar |
| Page context | Compact top bar | Top bar | Page header / breadcrumb |
| Flag catalog | 2 columns | 3–4 columns | 4–6 columns |
| Emblem catalog | 2 columns | 3–4 columns | 4–5 columns |
| Landmark catalog | 1 column | 2 columns | 3–4 columns |
| Flag/emblem detail | 1 column | 1–2 columns | 5/7 split |
| Landmark detail | 1 column | 1–2 columns | 7/5 split preferred |
| Quiz answers | 1 column | 1–2 columns | 2×2 for short answers |
| Quiz navigation | Focus header only | Focus header only | Focus header only |
| Filters | Horizontal chips | Wrap/scroll | Visible toolbar |
| Sources | Bottom section | Bottom section | Bottom section |

---

## 31. UX copy guidelines

Russian UI text should be short and direct.

Prefer:

- `Изучать`
- `Квиз`
- `Ошибки`
- `Прогресс`
- `Что изображено`
- `Что означает`
- `История`
- `Источники`
- `Проверить себя`
- `Следующий вопрос`
- `Повторить ошибки`

Avoid technical language in user-facing UI such as:

- `media asset`;
- `content entity`;
- `cache state`;
- `record`;
- `variant ID`.

Use those terms only internally.

---

## 32. Implementation priority

Codex should implement UI in this order:

1. design tokens and responsive app shell;
2. desktop sidebar + mobile bottom navigation;
3. typography and common controls;
4. Learn landing page;
5. Flags catalog;
6. reusable media/card components;
7. flag/emblem detail page;
8. landmark catalog/detail;
9. quiz setup;
10. active quiz focus layout;
11. answer feedback;
12. mistakes;
13. progress;
14. media viewer;
15. offline/error/empty states;
16. accessibility and responsive polish.

Do not attempt visual polish on every screen before the core responsive layouts are validated.

---

## 33. UI validation checklist

Before a UI task is considered complete, verify:

### Mobile

- usable at 360 px width;
- no unintended horizontal page scroll;
- bottom navigation does not cover content;
- safe-area padding works;
- primary controls are easy to tap;
- image is large enough to identify details;
- text remains at readable size;
- quiz answer buttons are not compressed;
- sticky elements do not consume excessive viewport height;
- landscape rotation does not break layout.

### Desktop

- sidebar does not compress the main content;
- content does not become excessively wide;
- catalog density remains scannable;
- detail pages use two-column layout effectively;
- text columns remain readable;
- keyboard focus order is logical;
- large images can be inspected without taking over the entire page.

### Both

- loading, empty, error, and offline states exist;
- sources are reachable;
- images retain aspect ratio;
- heraldic artwork is never cropped;
- quiz state does not reveal answers through alt text;
- correct/incorrect states use text/iconography as well as color;
- UI language is consistent;
- all primary actions have a clear visual hierarchy.

---

## 34. v0.1 design definition of done

The UI/UX prototype is ready when:

1. the same content is fully usable on a 360 px phone and a 1440 px desktop;
2. mobile uses bottom navigation and desktop uses a sidebar;
3. catalogs make efficient use of screen width without sacrificing scanability;
4. detail pages prioritize large visual media and concise explanations;
5. active quiz mode removes unrelated navigation and distractions;
6. the complete quiz flow works without automatic skipping of explanations;
7. flags and emblems can be enlarged without cropping;
8. sources and rights information are reachable from every content detail page;
9. all critical controls work with touch and keyboard where applicable;
10. layout remains stable with realistic Russian text lengths;
11. the interface remains restrained enough that flags, heraldry, and nature photography are the dominant visual content.
