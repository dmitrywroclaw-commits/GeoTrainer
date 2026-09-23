# GeoTrainer — Content Model and Editorial Schema

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
type FlagVariantType =
  | 'national'
  | 'state'
  | 'civil'
  | 'state_ensign'
  | 'civil_ensign'
  | 'other_official';

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

A flag is eligible for the initial learning catalog when its selected official variant contains at least one meaningful graphic element beyond simple geometric color fields.

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
- no published flag uses an empty symbol list in the initial curated catalog.

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
