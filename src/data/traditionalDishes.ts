import { z } from 'zod';
import { mediaSchema } from './schema';
import rawDishes from '../../content/traditional-dishes.json';
import rawSources from '../../content/traditional-dish-sources.json';
import rawMedia from '../../content/traditional-dish-media.json';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dishSchema = z.object({
  id: z.string().regex(/^traditional-food-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  countryId: id,
  countryRu: z.string().min(1),
  nameRu: z.string().min(1),
  summaryRu: z.string().min(1),
  historyRu: z.string().min(1),
  ingredientsRu: z.string().min(1),
  traditionsRu: z.string().min(1),
  sourceIds: z.array(id).min(1),
  mediaId: id,
  status: z.literal('published'),
  verifiedAt: date,
});
const sourceSchema = z.object({
  id,
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  sourceType: z.enum(['government', 'law', 'unesco', 'other_authoritative']),
  accessedAt: date,
});

const dishes = z.array(dishSchema).length(8).parse(rawDishes);
const sources = z.array(sourceSchema).parse(rawSources);
const media = mediaSchema.length(8).parse(rawMedia);
const unique = (values: string[], label: string) => {
  if (new Set(values).size !== values.length) throw new Error(`Повторяющиеся ${label} традиционных блюд`);
};
unique(dishes.map(dish => dish.id), 'ID');
unique(dishes.map(dish => dish.countryId), 'страны');
unique(sources.map(source => source.id), 'источники');
unique(media.map(item => item.id), 'изображения');
const sourcesById = new Map(sources.map(source => [source.id, source]));
const mediaById = new Map(media.map(item => [item.id, item]));
for (const dish of dishes) {
  if (dish.sourceIds.some(sourceId => !sourcesById.has(sourceId))) throw new Error(`Нет источника для ${dish.id}`);
  const photo = mediaById.get(dish.mediaId);
  if (!photo || photo.kind !== 'photo' || !photo.author || !photo.rightsUrl || !photo.attributionText) {
    throw new Error(`Нет фотографии или данных о правах для ${dish.id}`);
  }
}

export type TraditionalDish = z.infer<typeof dishSchema>;

export const traditionalDishes = {
  all: () => dishes,
  byId: (dishId: string) => dishes.find(dish => dish.id === dishId),
  sources: (dish: TraditionalDish) => dish.sourceIds.map(sourceId => sourcesById.get(sourceId)!),
  media: (dish: TraditionalDish) => mediaById.get(dish.mediaId)!,
};
