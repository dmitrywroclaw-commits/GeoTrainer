import { z } from 'zod';
import { mediaSchema } from './schema';
import raw from '../../content/urban-places.json';
import rawMedia from '../../content/urban-media.json';

const cardSchema = z.object({
  id: z.string().regex(/^urban-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  rank: z.number().int().min(1).max(199),
  name: z.string().min(1),
  nameRu: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1).nullable(),
  placeTypeRu: z.string().min(1),
  whyFamousRu: z.string().min(1),
  visualClueRu: z.string().min(1),
  sourceDocument: z.literal('geotrainer_top_199_urban_places.md'),
  status: z.literal('draft'),
});

const cards = z.array(cardSchema).length(199).parse(raw);
const media = mediaSchema.length(199).parse(rawMedia);
if (new Set(cards.map(card => card.id)).size !== cards.length) throw new Error('Повторяющиеся ID городских мест');
if (new Set(cards.map(card => card.rank)).size !== cards.length) throw new Error('Повторяющиеся номера городских мест');
if (new Set(media.map(item => item.id)).size !== media.length) throw new Error('Повторяющиеся ID фотографий городских мест');
const mediaById = new Map(media.map(item => [item.id, item]));
for (const card of cards) {
  const photo = mediaById.get(`${card.id}-photo`);
  if (!photo || photo.kind !== 'photo' || !photo.author || !photo.rightsUrl || !photo.attributionText) {
    throw new Error(`Нет фотографии или прав для ${card.id}`);
  }
}

export type UrbanPlace = z.infer<typeof cardSchema>;

export function urbanPlaceTitle(card: UrbanPlace): string {
  return `${card.nameRu} (${card.name})`;
}

export const urbanPlaces = {
  all: () => cards,
  byId: (id: string) => cards.find(card => card.id === id),
  media: (id: string) => mediaById.get(`${id}-photo`),
};
