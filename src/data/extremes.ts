import { z } from 'zod';
import raw from '../../content/extremes.json';

export const editorialSourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().trim().min(1),
  publisher: z.string().trim().min(1), url: z.string().url(), accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const text = z.string().trim().min(1);
export const extremeSchema = z.object({
  id: editorialSourceSchema.shape.id, kind: z.enum(['river', 'mountain', 'lake']), nameRu: text, regionRu: text,
  distinctionRu: text, metric: z.object({ valueRu: text, labelRu: text }), explanationRu: text,
  caveatRu: text, tags: z.array(z.enum(['length', 'height', 'depth', 'area', 'discharge', 'unusual', 'unique'])).min(1),
  sourceIds: z.array(editorialSourceSchema.shape.id).min(1), status: z.literal('published'),
  verifiedAt: editorialSourceSchema.shape.accessedAt,
});
export const extremesSchema = z.object({ sources: z.array(editorialSourceSchema), cards: z.array(extremeSchema) });
export type Extreme = z.infer<typeof extremeSchema>;
export type ExtremeKind = Extreme['kind'];
export type EditorialSource = z.infer<typeof editorialSourceSchema>;

export function validateEditorialReferences(data: { sources: EditorialSource[]; cards: { id: string; sourceIds: string[] }[] }) {
  const ids = [...data.sources.map(item => item.id), ...data.cards.map(item => item.id)];
  if (new Set(ids).size !== ids.length) throw new Error('Повторяющиеся ID в каталоге');
  const sources = new Set(data.sources.map(item => item.id));
  for (const card of data.cards) {
    if (new Set(card.sourceIds).size !== card.sourceIds.length || card.sourceIds.some(id => !sources.has(id))) throw new Error(`Неверные источники: ${card.id}`);
  }
}
const data = extremesSchema.parse(raw);
validateEditorialReferences(data);

export const extremesRepository = {
  all: () => data.cards,
  byKind: (kind: ExtremeKind) => data.cards.filter(card => card.kind === kind),
  byId: (id: string) => data.cards.find(card => card.id === id),
  question: (id: string) => data.cards.find(card => `record-${card.id}` === id),
  sources: (ids: string[]) => data.sources.filter(source => ids.includes(source.id)),
};

export const extremeTopics = {
  river: { title: 'Реки', path: 'rivers', description: '20 знаменитых рек: длина, полноводность и уникальные ландшафты.' },
  mountain: { title: 'Горы', path: 'mountains', description: '20 знаменитых вершин: высотные рекорды и разные способы их измерить.' },
  lake: { title: 'Озёра', path: 'lakes', description: '20 знаменитых озёр: глубина, площадь и необычные свойства.' },
} as const;
export const recordsTopic = {
  title: 'Рекорды и уникальность', path: 'records',
  description: 'Знаменитые озёра, реки и горы: рекорды мира и регионов, необычные свойства и уникальные ландшафты.',
} as const;
export const extremeKindFilters: { value: ExtremeKind; label: string }[] = [
  { value: 'lake', label: extremeTopics.lake.title },
  { value: 'river', label: extremeTopics.river.title },
  { value: 'mountain', label: extremeTopics.mountain.title },
];
export function isExtremeKind(value: string | null): value is ExtremeKind {
  return value !== null && Object.hasOwn(extremeTopics, value);
}
export function recordCatalogPath(kind?: ExtremeKind) {
  return `/learn/${recordsTopic.path}${kind ? `?kind=${kind}` : ''}`;
}
export const extremeTags = {
  length: 'Длинные', height: 'Высотные рекорды', depth: 'Глубокие', area: 'Большие по площади',
  discharge: 'Полноводные', unusual: 'Необычные', unique: 'Уникальные',
} as const;
