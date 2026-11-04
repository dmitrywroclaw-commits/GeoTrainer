import { z } from 'zod';
import raw from '../../content/geography-names.json';
import { editorialSourceSchema, validateEditorialReferences } from './extremes';

const text = z.string().trim().min(1);
export const geographyNamesSchema = z.object({
  sources: z.array(editorialSourceSchema),
  cards: z.array(z.object({
    id: editorialSourceSchema.shape.id, nameRu: text, targetRu: text, regionRu: text,
    tags: z.array(z.enum(['color', 'number', 'sound', 'smell', 'line', 'metaphor'])).min(1),
    nameType: z.enum(['term', 'toponym', 'translation', 'historical', 'conventional', 'epithet']),
    markRu: text, explanationRu: text, cautionRu: text,
    sourceIds: z.array(editorialSourceSchema.shape.id).min(1), status: z.literal('published'),
    verifiedAt: editorialSourceSchema.shape.accessedAt,
  })),
});
export type GeographyName = z.infer<typeof geographyNamesSchema>['cards'][number];
const data = geographyNamesSchema.parse(raw);
validateEditorialReferences(data);
export const geographyNamesRepository = {
  all: () => data.cards,
  byId: (id: string) => data.cards.find(card => card.id === id),
  sources: (ids: string[]) => data.sources.filter(source => ids.includes(source.id)),
};
export const nameTags = { color: 'Цвета', number: 'Числа', sound: 'Звуки', smell: 'Запахи', line: 'Линии и точки', metaphor: 'Образы' } as const;
export const nameTypes = {
  term: 'Географический термин', toponym: 'Устойчивый топоним', translation: 'Перевод названия',
  historical: 'Историческое наименование', conventional: 'Условное географическое название',
  epithet: 'Устойчивое образное имя',
} as const;
