import { z } from 'zod';
import raw from '../../content/capitals.json';
import { contentRepository } from './repository';
import { mediaSchema, type Media } from './schema';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const sourceSchema = z.object({
  id, title: z.string().min(1), publisher: z.string().min(1), url: z.string().url(), checkedAt: date,
});
const entrySchema = z.object({
  id, countryId: id, cityNameRu: z.string().min(1), cityNameEn: z.string().min(1),
  regionRu: z.string().min(1),
  role: z.enum(['capital', 'administrative', 'legislative', 'judicial', 'constitutional', 'claimed', 'administrative_center', 'commercial_center', 'seat_of_government', 'former_capital']),
  roleRu: z.string().min(1), photoCaptionRu: z.string().min(1).optional(),
  summaryRu: z.string().min(1), explanationRu: z.string().min(1),
  mediaId: id.optional(), sourceIds: z.array(id).min(1), verifiedAt: date,
  status: z.enum(['draft', 'reviewed', 'published']),
  quiz: z.object({
    countryToCity: z.boolean(), cityToCountry: z.boolean(),
    countryToCityPromptRu: z.string().min(1).optional(),
    cityToCountryPromptRu: z.string().min(1).optional(),
  }),
});
const schema = z.object({ sources: z.array(sourceSchema), media: mediaSchema, entries: z.array(entrySchema) });

const parsed = schema.parse(raw);
const sources = new Map(parsed.sources.map(source => [source.id, source]));
const media = new Map(parsed.media.map(asset => [asset.id, asset]));
const entries = new Map(parsed.entries.map(entry => [entry.id, entry]));
if (sources.size !== parsed.sources.length || media.size !== parsed.media.length || entries.size !== parsed.entries.length) {
  throw new Error('Повторяющиеся ID в разделе столиц');
}
for (const entry of parsed.entries) {
  if (!contentRepository.country(entry.countryId)) throw new Error(`Не найдена страна для ${entry.id}`);
  if (entry.mediaId && !media.has(entry.mediaId)) throw new Error(`Не найдено фото для ${entry.id}`);
  if (entry.sourceIds.some(sourceId => !sources.has(sourceId))) throw new Error(`Не найден источник для ${entry.id}`);
  if (entry.status === 'published') {
    const asset = entry.mediaId && media.get(entry.mediaId);
    if (asset && (!asset.author?.trim() || !asset.rightsUrl || !asset.attributionText?.trim())) throw new Error(`Не проверены права и атрибуция для ${entry.id}`);
    if (!entry.quiz.countryToCity && !entry.quiz.cityToCountry) throw new Error(`Нет вопроса для ${entry.id}`);
  }
}

export type CapitalEntry = z.infer<typeof entrySchema>;
export type CapitalSource = z.infer<typeof sourceSchema>;
export type CapitalQuestionType = 'country-to-city' | 'city-to-country';
export interface CapitalQuestionSpec { id: string; cardId: string; type: CapitalQuestionType; }

const published = parsed.entries.filter(entry => entry.status === 'published');
const specs: CapitalQuestionSpec[] = published.flatMap(entry => [
  ...(entry.quiz.countryToCity ? [{ id: `${entry.id}-country`, cardId: entry.id, type: 'country-to-city' as const }] : []),
  ...(entry.quiz.cityToCountry ? [{ id: `${entry.id}-city`, cardId: entry.id, type: 'city-to-country' as const }] : []),
]);

export const capitalRepository = {
  all: () => published,
  byId: (entryId: string) => published.find(entry => entry.id === entryId),
  media: (mediaId?: string): Media | undefined => mediaId ? media.get(mediaId) : undefined,
  sources: (sourceIds: string[]): CapitalSource[] => sourceIds.map(sourceId => sources.get(sourceId)).filter((source): source is CapitalSource => Boolean(source)),
  allQuestions: () => specs,
  question: (questionId: string) => specs.find(spec => spec.id === questionId),
  countryName: (countryId: string) => contentRepository.country(countryId)?.nameRu ?? '',
};
