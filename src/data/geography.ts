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
export const geographySchema = z.object({
  sources: z.array(z.object({ id, title: text, publisher: text, url: z.string().url(), accessedAt: date })),
  mapSource: mediaSchema.element.omit({ id: true, kind: true, localPath: true }),
  marineSource: mediaSchema.element.omit({ id: true, kind: true, localPath: true }),
  outlines: z.array(outline),
});
export type Outline = z.infer<typeof outline>;
export type GeographyEntry = Outline;
export type GeographyKind = GeographyEntry['kind'];
export type GeographyQuestionType = 'identify' | 'select-outline';
export interface GeographyQuestionSpec { id: string; cardId: string; type: GeographyQuestionType }

export function validateGeography(data: z.infer<typeof geographySchema>) {
  const cards = data.outlines;
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
    }
  }
}
const data = geographySchema.parse(raw);
validateGeography(data);
const entries: GeographyEntry[] = data.outlines;
const questions: GeographyQuestionSpec[] = entries.flatMap(card => (['identify', 'select-outline'] as const)
  .map(type => ({ id: `${card.id}-${type}`, cardId: card.id, type })));


export const geographyRepository = {
  all: (): GeographyEntry[] => entries,
  byKind: (kind: GeographyKind) => entries.filter(card => card.kind === kind),
  byId: (id: string) => entries.find(card => card.id === id),
  questions: (kind?: GeographyKind) => questions.filter(spec => !kind || entries.find(card => card.id === spec.cardId)?.kind === kind),
  question: (id: string) => questions.find(spec => spec.id === id),
  sources: (ids: string[]) => data.sources.filter(source => ids.includes(source.id)),
  marineSource: data.marineSource,
  media: (card: GeographyEntry, revealed = true): Media => ({
    ...data.mapSource, id: `${card.id}-${revealed ? 'answer' : 'question'}`, kind: 'map',
    localPath: `/media/geography/${card.id}-${revealed ? 'answer' : 'question'}.svg`,
  }),
};
