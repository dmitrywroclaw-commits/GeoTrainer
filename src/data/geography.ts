import { z } from 'zod';
import raw from '../../content/geography.json';
import { contentRepository } from './repository';
import { mediaSchema, type Media } from './schema';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const text = z.string().trim().min(1);
const base = z.object({ id, nameRu: text, regionRu: text, summaryRu: text, explanationRu: text,
  sourceIds: z.array(id).min(1), status: z.literal('published'), verifiedAt: date });
const bounds = z.tuple([z.number(), z.number(), z.number(), z.number()]);
const outline = base.extend({ kind: z.literal('outline'), countryId: id, iso3: z.string().length(3), shapeRu: text, scopeRu: text,
  continentRu: text, similarityTags: z.array(text).min(1), borderNoteRu: text.optional(),
  map: z.object({ box: bounds, geometryBox: bounds.optional(), centralMeridian: z.number().min(-180).max(180), featureCodes: z.array(text).min(1),
    panels: z.array(z.object({ labelRu: text, box: bounds })).min(2).max(4).optional(),
    labels: z.array(z.object({ text, lon: z.number(), lat: z.number(), water: z.boolean(), panelIndex: z.number().int().nonnegative(), target: z.boolean().optional() })).min(1) }) });
const waterway = base.extend({ kind: z.literal('waterway'), waterwayType: z.enum(['strait', 'canal']),
  connectsRu: z.tuple([text, text]), banksRu: z.array(text).max(2), routeRu: z.array(text).min(3), distinctionRu: text,
  map: z.object({ box: bounds, trace: z.array(z.tuple([z.number(), z.number()])).min(2),
    labels: z.array(z.object({ text, lon: z.number(), lat: z.number(), water: z.boolean() })).min(4) }) });
export const geographySchema = z.object({
  sources: z.array(z.object({ id, title: text, publisher: text, url: z.string().url(), accessedAt: date })),
  mapSource: mediaSchema.element.omit({ id: true, kind: true, localPath: true }),
  marineSource: mediaSchema.element.omit({ id: true, kind: true, localPath: true }),
  outlines: z.array(outline), waterways: z.array(waterway),
});
export type Outline = z.infer<typeof outline>;
export type Waterway = z.infer<typeof waterway>;
export type GeographyEntry = Outline | Waterway;
export type GeographyKind = GeographyEntry['kind'];
export type GeographyQuestionType = 'identify' | 'select-outline' | 'connects' | 'banks' | 'route';
export interface GeographyQuestionSpec { id: string; cardId: string; type: GeographyQuestionType }

export function validateGeography(data: z.infer<typeof geographySchema>) {
  const cards = [...data.outlines, ...data.waterways];
  const ids = [...cards.map(card => card.id), ...data.sources.map(source => source.id)];
  if (new Set(ids).size !== ids.length) throw new Error('Повторяющиеся ID в географии');
  const sources = new Set(data.sources.map(source => source.id));
  for (const card of cards) {
    if (card.sourceIds.some(id => !sources.has(id))) throw new Error(`Нет источника: ${card.id}`);
    if (card.kind === 'outline') {
      const country = contentRepository.country(card.countryId);
      if (!country || country.iso3 !== card.iso3) throw new Error(`Нет страны или неверный ISO: ${card.id}`);
      for (const [w, s, e, n] of [card.map.box, ...(card.map.geometryBox ? [card.map.geometryBox] : []), ...(card.map.panels?.map(panel => panel.box) ?? [])]) {
        if (w >= e || s >= n || w < -540 || e > 540 || e-w >= 360 || s < -90 || n > 90) throw new Error(`Неверная область карты: ${card.id}`);
      }
      if (card.map.labels.some(label => label.panelIndex >= (card.map.panels?.length ?? 1))) throw new Error(`Неверная врезка подписи: ${card.id}`);
    } else {
      const [w, s, e, n] = card.map.box;
      if (w >= e || s >= n || w < -540 || e > 540 || e - w >= 360 || s < -90 || n > 90) throw new Error(`Неверная область карты: ${card.id}`);
      if (card.map.trace.some(([lon, lat]) => lon < w || lon > e || lat < s || lat > n) || card.map.labels.some(label => label.lon < w || label.lon > e || label.lat < s || label.lat > n)) throw new Error(`Неверный локатор: ${card.id}`);
      if (card.connectsRu[0] === card.connectsRu[1] || !card.routeRu.includes(card.nameRu)) throw new Error(`Неверные связи: ${card.id}`);
      const passage = card.routeRu.indexOf(card.nameRu);
      if (card.routeRu[passage - 1] !== card.connectsRu[0] || card.routeRu[passage + 1] !== card.connectsRu[1]) throw new Error(`Неверный маршрут: ${card.id}`);
      if (card.banksRu.length !== 0 && card.banksRu.length !== 2) throw new Error(`Неверные берега: ${card.id}`);
    }
  }
}
const data = geographySchema.parse(raw);
validateGeography(data);
const entries: GeographyEntry[] = [...data.outlines, ...data.waterways];
const questions: GeographyQuestionSpec[] = entries.flatMap(card => (card.kind === 'outline'
  ? ['identify', 'select-outline'] as const
  : card.banksRu.length ? ['identify', 'connects', 'banks', 'route'] as const : ['identify', 'connects', 'route'] as const
).map(type => ({ id: `${card.id}-${type}`, cardId: card.id, type })));

export const geographyRepository = {
  all: (): GeographyEntry[] => entries,
  byKind: (kind: GeographyKind) => entries.filter(card => card.kind === kind),
  byId: (id: string) => entries.find(card => card.id === id),
  questions: (kind?: GeographyKind) => questions.filter(spec => !kind || entries.find(card => card.id === spec.cardId)?.kind === kind),
  question: (id: string) => questions.find(spec => spec.id === id),
  sources: (ids: string[]) => data.sources.filter(source => ids.includes(source.id)),
  marineSource: data.marineSource,
  media: (card: GeographyEntry, revealed = true): Media => card.kind === 'outline' ? {
    ...data.mapSource, id: `${card.id}-${revealed ? 'answer' : 'question'}`, kind: 'map',
    localPath: `/media/geography/${card.id}-${revealed ? 'answer' : 'question'}.svg`,
  } : {
    id: `${card.id}-diagram`, kind: 'map', localPath: `/media/geography/${card.id}-diagram.svg`,
    sourcePageUrl: data.mapSource.sourcePageUrl, originalAssetUrl: data.mapSource.originalAssetUrl,
    publisher: 'GeoTrainer / Natural Earth', author: 'GeoTrainer; Natural Earth contributors', license: 'Public domain / CC0 1.0',
    rightsUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    attributionText: 'Береговая основа Natural Earth — public domain; подписи и учебный локатор GeoTrainer — CC0. Линия выделяет проход, не судовой ход. Север вверху, масштабы карт различаются.', checkedAt: card.verifiedAt,
  },
};
