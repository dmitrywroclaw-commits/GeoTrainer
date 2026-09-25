import { z } from 'zod';
import rawBorders from '../../content/borders.json';
import { contentRepository } from './repository';
import type { Media } from './schema';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const source = z.object({ id, title: z.string().min(1), publisher: z.string().min(1), url: z.string().url(), accessedAt: date });
const fact = z.object({
  countryId: id, neighborIds: z.array(id).min(1), enclaveWithinId: id.optional(),
  summaryRu: z.string().min(1), sourceIds: z.array(id).min(1), mapId: id,
  verifiedAt: date, status: z.literal('published'),
});
const question = z.object({
  id, sourceNumber: z.number().int().min(1).max(95), countryId: id,
  type: z.enum(['single', 'identify', 'pair', 'not-neighbor', 'count']),
  promptRu: z.string().min(1).optional(),
  optionCountryIds: z.array(id).length(4).optional(),
  optionPairs: z.array(z.array(id).length(2)).length(4).optional(),
  countOptions: z.array(z.number().int().nonnegative()).length(4).optional(),
});
const schema = z.object({
  mapSource: z.object({ title: z.string(), sourcePageUrl: z.string().url(), originalAssetUrl: z.string().url(), rightsUrl: z.string().url(), publisher: z.string(), author: z.string(), license: z.string(), attributionText: z.string(), checkedAt: date }),
  sources: z.array(source), facts: z.array(fact), questions: z.array(question),
});

const data = schema.parse(rawBorders);
const factByCountry = new Map(data.facts.map(item => [item.countryId, item]));
const sourceIds = new Set(data.sources.map(item => item.id));
if (factByCountry.size !== data.facts.length || new Set(data.questions.map(item => item.id)).size !== data.questions.length) throw new Error('Повторяющиеся ID в теме границ');
for (const item of data.facts) {
  if (!contentRepository.country(item.countryId) || item.neighborIds.some(x => !contentRepository.country(x)) || (item.enclaveWithinId && !item.neighborIds.includes(item.enclaveWithinId))) throw new Error(`Неверные страны в факте ${item.countryId}`);
  if (item.sourceIds.some(x => !sourceIds.has(x))) throw new Error(`Не найден источник для ${item.countryId}`);
  if (new Set(item.neighborIds).size !== item.neighborIds.length) throw new Error(`Повторяющийся сосед у ${item.countryId}`);
}
for (const item of data.questions) {
  const entry = factByCountry.get(item.countryId);
  if (!entry) throw new Error(`Нет факта для вопроса ${item.id}`);
  if (item.optionCountryIds?.some(x => !contentRepository.country(x)) || item.optionPairs?.flat().some(x => !contentRepository.country(x))) throw new Error(`Не найдена страна в вопросе ${item.id}`);
  if (item.type === 'count' && (!item.countOptions || new Set(item.countOptions).size !== 4 || !item.countOptions.includes(entry.neighborIds.length))) throw new Error(`Неверные числа в вопросе ${item.id}`);
  if (item.type === 'pair' && (!item.optionPairs || item.optionPairs.filter(pair => pair.every(x => entry.neighborIds.includes(x))).length !== 1)) throw new Error(`Неверные пары в вопросе ${item.id}`);
  if (['single', 'identify', 'not-neighbor'].includes(item.type) && (!item.optionCountryIds || new Set(item.optionCountryIds).size !== 4)) throw new Error(`Неверные варианты вопроса ${item.id}`);
  if (item.type === 'single' && (entry.neighborIds.length !== 1 || !item.optionCountryIds?.includes(entry.neighborIds[0]))) throw new Error(`Неверный единственный сосед в ${item.id}`);
  if (item.type === 'identify' && (!entry.enclaveWithinId || !item.optionCountryIds?.includes(entry.countryId))) throw new Error(`Неверный анклав в ${item.id}`);
  if (item.type === 'not-neighbor' && item.optionCountryIds?.filter(x => !entry.neighborIds.includes(x)).length !== 1) throw new Error(`Неоднозначный вопрос ${item.id}`);
}

export type BorderFact = z.infer<typeof fact>;
export type BorderQuestionSpec = z.infer<typeof question>;
export const borderRepository = {
  allFacts: (): BorderFact[] => data.facts,
  allQuestions: (): BorderQuestionSpec[] => data.questions,
  fact: (countryId: string) => factByCountry.get(countryId),
  question: (id: string) => data.questions.find(item => item.id === id),
  sources: (ids: string[]) => ids.map(id => data.sources.find(item => item.id === id)).filter((item): item is typeof data.sources[number] => Boolean(item)),
  countryName: (id: string) => contentRepository.country(id)?.nameRu ?? id,
  map: (mapId: string, revealed: boolean): Media => ({
    id: `border-map-${mapId}-${revealed ? 'answer' : 'question'}`, kind: 'map', localPath: `/media/maps/${mapId}-${revealed ? 'answer' : 'question'}.svg`,
    sourcePageUrl: data.mapSource.sourcePageUrl, originalAssetUrl: data.mapSource.originalAssetUrl,
    publisher: data.mapSource.publisher, author: data.mapSource.author, license: data.mapSource.license,
    rightsUrl: data.mapSource.rightsUrl, attributionText: data.mapSource.attributionText, checkedAt: data.mapSource.checkedAt,
  }),
};
