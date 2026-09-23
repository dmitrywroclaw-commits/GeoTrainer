import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const source = z.object({
  id, title: z.string().min(1), publisher: z.string().min(1), url: z.string().url(),
  sourceType: z.enum(['government', 'law', 'heraldic_authority', 'scientific_agency', 'unesco', 'national_park', 'other_authoritative']),
  accessedAt: date,
});
const media = z.object({
  id, kind: z.enum(['flag', 'emblem', 'photo', 'map']), localPath: z.string().startsWith('/media/'),
  sourcePageUrl: z.string().url(), originalAssetUrl: z.string().url().optional(),
  publisher: z.string().min(1), author: z.string().optional(), license: z.string().min(1),
  rightsUrl: z.string().optional(), attributionText: z.string().optional(), checkedAt: date,
});
const symbol = z.object({
  nameRu: z.string().min(1), category: z.string().min(1), meaningRu: z.string().optional(),
  meaningStatus: z.enum(['official', 'well_sourced', 'interpretation', 'unknown']), sourceIds: z.array(id).min(1),
});
const measurement = z.object({
  labelRu: z.string().min(1), value: z.number(), unit: z.string().min(1),
  methodologyRu: z.string().optional(), sourceIds: z.array(id).min(1),
});
const recordClaim = z.object({
  claimRu: z.string().min(1), status: z.enum(['well_established', 'definition_dependent', 'disputed']),
  explanationRu: z.string().optional(), sourceIds: z.array(id).min(1),
});
const base = z.object({
  id, nameRu: z.string().min(1), subtitleRu: z.string().min(1), mediaId: id,
  summaryRu: z.string().min(1), explanationRu: z.string().min(1), historyRu: z.string().optional(),
  facts: z.array(z.object({ labelRu: z.string().min(1), valueRu: z.string().min(1) })),
  sourceIds: z.array(id).min(1), quizHints: z.object({ similarityTags: z.array(z.string()).optional(), excludeFromQuiz: z.boolean().optional() }).optional(),
  status: z.enum(['draft', 'sources_checked', 'media_checked', 'reviewed', 'published']), verifiedAt: date,
});
const entry = z.discriminatedUnion('kind', [
  base.extend({ kind: z.literal('flag'), countryId: id, variantType: z.enum(['national', 'state', 'civil', 'state_ensign', 'civil_ensign', 'other_official']), isPrimaryStudyVariant: z.boolean(), symbols: z.array(symbol).min(1) }),
  base.extend({ kind: z.literal('emblem'), countryId: id, symbolType: z.enum(['coat_of_arms', 'national_emblem', 'state_emblem', 'state_seal']), symbols: z.array(symbol).min(1) }),
  base.extend({
    kind: z.literal('landmark'), countryIds: z.array(id).min(1),
    landmarkType: z.enum(['mountain', 'volcano', 'canyon', 'gorge', 'desert', 'depression', 'waterfall', 'lake', 'river', 'cave', 'glacier', 'island', 'geological_formation', 'natural_wonder', 'other']),
    regionRu: z.string().optional(),
    coordinates: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }).optional(),
    measurements: z.array(measurement).optional(), recordClaims: z.array(recordClaim).optional(),
    whyNotableRu: z.string().min(1),
  }),
]);

export const librarySchema = z.object({
  countries: z.array(z.object({
    id, nameRu: z.string().min(1), region: z.string().min(1),
    m49: z.string().regex(/^\d{3}$/), iso2: z.string().regex(/^[A-Z]{2}$/), iso3: z.string().regex(/^[A-Z]{3}$/),
  })),
  sources: z.array(source),
  entries: z.array(entry),
});
export const mediaSchema = z.array(media);
export type Entry = z.infer<typeof entry>;
export type Country = z.infer<typeof librarySchema>['countries'][number];
export type Source = z.infer<typeof source>;
export type Media = z.infer<typeof media>;

export function validateReferences(library: z.infer<typeof librarySchema>, assets: Media[]) {
  const allIds = [...library.countries.map(x => x.id), ...library.sources.map(x => x.id), ...library.entries.map(x => x.id), ...assets.map(x => x.id)];
  if (new Set(allIds).size !== allIds.length) throw new Error('Повторяющиеся ID в контенте');
  const countries = new Set(library.countries.map(x => x.id));
  const sources = new Set(library.sources.map(x => x.id));
  const mediaIds = new Set(assets.map(x => x.id));
  for (const item of library.entries) {
    const image = assets.find(x => x.id === item.mediaId);
    if (!image || !mediaIds.has(item.mediaId)) throw new Error(`Не найдено изображение для ${item.id}`);
    if (item.status === 'published' && image.license.startsWith('CC') && (!image.rightsUrl || !image.author)) throw new Error(`Недостаточно данных о правах для ${item.id}`);
    if (item.status === 'published' && /CC BY(?:-|\s)/.test(image.license) && !image.attributionText?.trim()) throw new Error(`Не указана обязательная атрибуция для ${item.id}`);
    if (item.sourceIds.some(x => !sources.has(x))) throw new Error(`Не найден источник для ${item.id}`);
    if (item.kind === 'landmark') {
      if (item.countryIds.some(x => !countries.has(x))) throw new Error(`Не найдена страна для ${item.id}`);
      for (const measured of item.measurements ?? []) {
        if (measured.sourceIds.some(x => !sources.has(x))) throw new Error(`Не найден источник измерения для ${item.id}`);
      }
      for (const claim of item.recordClaims ?? []) {
        if (claim.sourceIds.some(x => !sources.has(x))) throw new Error(`Не найден источник рекорда для ${item.id}`);
      }
    } else {
      if (!countries.has(item.countryId)) throw new Error(`Не найдена страна для ${item.id}`);
      for (const part of item.symbols) {
        if (part.sourceIds.some(x => !sources.has(x))) throw new Error(`Не найден источник символа для ${item.id}`);
      }
    }
  }
}
