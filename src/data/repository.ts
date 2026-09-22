import rawLibrary from '../../content/library.json';
import rawMedia from '../../content/media.json';
import { librarySchema, mediaSchema, validateReferences, type Entry, type Media, type Source } from './schema';

const library = librarySchema.parse(rawLibrary);
const assets = mediaSchema.parse(rawMedia);
validateReferences(library, assets);

export const contentRepository = {
  all: () => library.entries.filter(x => x.status === 'published'),
  byKind: (kind: Entry['kind']) => library.entries.filter(x => x.kind === kind && x.status === 'published'),
  byId: (id: string) => library.entries.find(x => x.id === id && x.status === 'published'),
  country: (id: string) => library.countries.find(x => x.id === id),
  media: (id: string): Media | undefined => assets.find(x => x.id === id),
  sources: (ids: string[]): Source[] => ids.map(id => library.sources.find(x => x.id === id)).filter((x): x is Source => Boolean(x)),
};
