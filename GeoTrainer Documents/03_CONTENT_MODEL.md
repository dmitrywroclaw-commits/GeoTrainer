# GeoTrainer — Content Model and Editorial Schema

> Topic extension (2026-09-25): published land-border facts and question specifications live in `content/borders.json`, with source and map provenance; see `08_BORDERS.md`. The adjacency record is the source of truth for quiz answers and learning text. Disputed land-border cases are excluded.

## 1. Purpose

This document defines how educational content is stored so that the same records can power encyclopedia pages, quiz questions, answer explanations, filters, and source attribution.

Content should be data, not hard-coded React markup.

## 2. General rules

Every publishable entity must have:

- stable ID;
- Russian display name;
- content type;
- concise summary;
- at least one authoritative factual source;
- media reference when an image is required;
- editorial status;
- last verification date.

Recommended statuses:

```text
draft
sources_checked
media_checked
reviewed
published
```

## Exploratory food and architecture cards

`content/travel-cards.json` stores the two local editorial lists as draft records. Every record has a stable ID, kind (`food` or `architecture`), name, location, description, `whyInterestingRu`, source document name, `status: draft`, and a local `image` path. Food records also retain the source note; architecture records retain the structure type. `content/travel-media.json` stores each image's source page, original URL, author, license, rights link, attribution text, and whether the photo is an exact or illustrative match. The UI shows the photo and attribution, including a note for illustrative matches. These records are separate from the published encyclopedia schema and image quiz until authoritative individual factual sources are complete.

Food `nameRu` begins with a readable Russian name. The international name from the editorial list follows in parentheses when it differs, so either form remains searchable. The stable ID continues to derive from the original list name.

## 3. Shared source model

```ts
interface SourceReference {
  id: string;
  title: string;
  publisher: string;
  url: string;
  sourceType:
    | 'government'
    | 'law'
    | 'heraldic_authority'
    | 'scientific_agency'
    | 'unesco'
    | 'national_park'
    | 'other_authoritative';
  accessedAt: string; // ISO date
  notes?: string;
}
```

## 4. Media model

```ts
interface MediaAsset {
  id: string;
  kind: 'flag' | 'emblem' | 'photo' | 'map';
  localPath: string;
  sourcePageUrl: string;
  originalAssetUrl?: string;
  publisher: string;
  author?: string;
  license?: string;
  rightsUrl?: string;
  attributionText?: string;
  checkedAt: string;
  width?: number;
  height?: number;
  mimeType?: string;
}
```

A media asset must not reach `published` status until rights have been checked.

For a Creative Commons license that requires attribution, `author`, `rightsUrl`, and a non-empty `attributionText` are mandatory before publication.

## 5. Country model

```ts
interface Country {
  id: string;
  nameRu: string;
  officialNameRu?: string;
  m49: string;
  iso2: string;
  iso3: string;
  region: string;
  flagIds: string[];
  emblemIds: string[];
  sourceIds: string[];
  status: EditorialStatus;
  verifiedAt: string;
}
```

## 6. Flag model

```ts
type FlagVariantType = 'national' | 'state';

type SymbolCategory =
  | 'coat_of_arms'
  | 'emblem'
  | 'bird'
  | 'animal'
  | 'plant'
  | 'flower'
  | 'tree'
  | 'leaf'
  | 'sun'
  | 'moon'
  | 'star'
  | 'constellation'
  | 'weapon'
  | 'tool'
  | 'architecture'
  | 'crown'
  | 'inscription'
  | 'religious'
  | 'historical'
  | 'other';

interface FlagSymbol {
  id: string;
  nameRu: string;
  category: SymbolCategory;
  meaningRu?: string;
  meaningStatus: 'official' | 'well_sourced' | 'interpretation' | 'unknown';
  sourceIds: string[];
}

interface FlagEntry {
  id: string;
  countryId: string;
  nameRu: string;
  variantType: FlagVariantType;
  isPrimaryStudyVariant: boolean;
  mediaId: string;
  symbols: FlagSymbol[];
  summaryRu: string;
  historyRu?: string;
  adoptedAt?: string;
  sourceIds: string[];
  status: EditorialStatus;
  verifiedAt: string;
}
```

### Inclusion rule

Publish exactly one national or state flag per country. Choose the more detailed official design; choose the national flag when equally detailed. Simple geometric designs are eligible and may have an empty `symbols` array.

The flag catalog filters read visual categories from `symbols`. Record categories visible on the selected flag, including elements inside a coat of arms when an authoritative description supports them. A visual category does not by itself assert an official meaning; use `meaningStatus: 'unknown'` until a source supports an explanation. The detail page uses `summaryRu` for **Описание флага** and `explanationRu` plus available `historyRu` for **Значение и история**. The latter gives sourced symbolism and relevant history without repeating the visual description. An adoption date is optional; do not invent one. Distinguish documented official meanings from common interpretations.

## 7. Emblem model

```ts
type NationalSymbolType =
  | 'coat_of_arms'
  | 'national_emblem'
  | 'state_emblem'
  | 'state_seal';

interface EmblemElement {
  id: string;
  nameRu: string;
  category:
    | 'bird'
    | 'animal'
    | 'plant'
    | 'flower'
    | 'tree'
    | 'weapon'
    | 'tool'
    | 'architecture'
    | 'crown'
    | 'shield'
    | 'supporter'
    | 'motto'
    | 'other';
  meaningRu?: string;
  meaningStatus: 'official' | 'well_sourced' | 'interpretation' | 'unknown';
  sourceIds: string[];
}

interface EmblemEntry {
  id: string;
  countryId: string;
  officialNameRu: string;
  symbolType: NationalSymbolType;
  mediaId: string;
  summaryRu: string;
  elements: EmblemElement[];
  historyRu: string;
  adoptedAt?: string;
  predecessorNotesRu?: string;
  sourceIds: string[];
  status: EditorialStatus;
  verifiedAt: string;
}
```

## 8. Landmark model

```ts
type LandmarkType =
  | 'mountain'
  | 'volcano'
  | 'canyon'
  | 'gorge'
  | 'desert'
  | 'depression'
  | 'waterfall'
  | 'lake'
  | 'river'
  | 'cave'
  | 'glacier'
  | 'island'
  | 'geological_formation'
  | 'natural_wonder'
  | 'other';

interface Measurement {
  labelRu: string;
  value: number;
  unit: string;
  methodologyRu?: string;
  sourceIds: string[];
}

interface RecordClaim {
  claimRu: string;
  status: 'well_established' | 'definition_dependent' | 'disputed';
  explanationRu?: string;
  sourceIds: string[];
}

interface LandmarkEntry {
  id: string;
  nameRu: string;
  alternativeNamesRu?: string[];
  type: LandmarkType;
  countryIds: string[];
  regionRu?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  heroMediaId: string;
  galleryMediaIds?: string[];
  summaryRu: string;
  whyNotableRu: string;
  explanationRu: string;
  measurements?: Measurement[];
  recordClaims?: RecordClaim[];
  sourceIds: string[];
  status: EditorialStatus;
  verifiedAt: string;
}
```

Published landmark cards use `regionRu` to show a clear location on the detail page. The first sentence of `summaryRu` names the object and says what kind of place it is. Explain unfamiliar geographical words when they first appear; for example, a delta is where a river branches into channels, and an estuary is where river water meets the sea. `explanationRu` adds how the place works or formed, while `whyNotableRu` says why it is worth learning about. Keep these fields distinct and write for a child encountering the place for the first time. Every new factual claim still needs support from the entry's sources.

## 9. Quiz metadata

Quiz questions should normally be generated, not stored as fully independent records.

Optional metadata may be stored to improve distractors:

```ts
interface QuizHints {
  similarityTags?: string[];
  difficulty?: 1 | 2 | 3 | 4 | 5;
  excludeFromQuiz?: boolean;
}
```

Examples of `similarityTags`:

```text
horizontal_tricolor
red_white_blue
bird_symbol
lion_supporters
mountain_landmark
large_desert
```

## 10. Example country file

Illustrative only:

```json
{
  "id": "example-country",
  "nameRu": "Пример",
  "iso2": "EX",
  "flagIds": ["example-country-state-flag"],
  "emblemIds": ["example-country-emblem"],
  "sourceIds": ["source-example-government"],
  "status": "draft",
  "verifiedAt": "2026-09-22"
}
```

## 11. Content validation

Add schema validation during development/build.

At minimum validate:

- IDs are unique;
- referenced IDs exist;
- published entries have required source IDs;
- published visual entries have a media asset;
- media rights fields are present;
- dates use a consistent format;
- no quiz-eligible entry is missing display text;
- each published country has exactly one national or state flag; simple flags may have an empty symbol list.

Prefer a runtime/build schema tool such as Zod or JSON Schema, but keep content format implementation-independent.

## 12. Editorial workflow

```text
Select candidate
→ research authoritative sources
→ draft factual entry
→ verify symbolism claims
→ locate image
→ verify media rights
→ add media and metadata
→ editorial review
→ mark published
```

## 13. Content batch for prototype

Before bulk collection, create five golden records:

- 2 flags;
- 2 national symbols;
- 1 landmark.

Use them to finalize UI and schema.

Only then expand to approximately 15–20 entries per category.

The first batch should intentionally cover diverse symbol categories so filters and layouts are genuinely tested.

The 15–20 range is the prototype milestone. Full production continues in reviewed batches until every `eligible` record in the base country registry, the separately classified extended entity registry, and the natural-landmark registry has a published card. The system must therefore support an open-ended catalog without changing stable IDs or duplicating factual records in UI code.
