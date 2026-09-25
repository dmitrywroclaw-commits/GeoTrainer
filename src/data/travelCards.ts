import { z } from 'zod';
import rawCards from '../../content/travel-cards.json';
import rawMedia from '../../content/travel-media.json';

const travelMediaSchema = z.object({
  cardId: z.string(), localPath: z.string().startsWith('/media/travel/'),
  sourcePageUrl: z.string().url(), originalAssetUrl: z.string().url(),
  publisher: z.string().min(1), originalTitle: z.string().min(1),
  author: z.string().min(1), license: z.string().min(1), rightsUrl: z.string().url(),
  attributionText: z.string().min(1), checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  matchKind: z.enum(['exact', 'illustrative']), matchNoteRu: z.string(),
});

const travelCardSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string().regex(/^food-[a-z0-9]+(?:-[a-z0-9]+)*$/), kind: z.literal('food'),
    nameRu: z.string().min(1), locationRu: z.string().min(1), descriptionRu: z.string().min(1),
    whyInterestingRu: z.string().min(1), noteRu: z.string().min(1),
    sourceDocument: z.literal('top_51_exotic_dishes_for_travelers.md'),
    status: z.literal('draft'), image: z.string().startsWith('/media/travel/'),
  }),
  z.object({
    id: z.string().regex(/^architecture-[a-z0-9]+(?:-[a-z0-9]+)*$/), kind: z.literal('architecture'),
    nameRu: z.string().min(1), locationRu: z.string().min(1), structureTypeRu: z.string().min(1),
    descriptionRu: z.string().min(1), whyInterestingRu: z.string().min(1),
    sourceDocument: z.literal('top_83_world_tourist_structures.md'),
    status: z.literal('draft'), image: z.string().startsWith('/media/travel/'),
  }),
]);

export type TravelCard = z.infer<typeof travelCardSchema>;
const cards = z.array(travelCardSchema).parse(rawCards);
const media = z.array(travelMediaSchema).parse(rawMedia);
if (new Set(cards.map(card => card.id)).size !== cards.length) throw new Error('Повторяющиеся ID карточек');
if (new Set(media.map(item => item.cardId)).size !== media.length) throw new Error('Повторяющиеся изображения карточек');
for (const card of cards) {
  const image = media.find(item => item.cardId === card.id);
  if (!image || image.localPath !== card.image) throw new Error(`Не найдено изображение для ${card.id}`);
}

export const travelCards = {
  byKind: (kind: TravelCard['kind']) => cards.filter(card => card.kind === kind),
  byId: (id: string) => cards.find(card => card.id === id),
  media: (cardId: string) => media.find(item => item.cardId === cardId),
};
