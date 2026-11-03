import { geographyRepository, type GeographyQuestionSpec } from '../../data/geography';
import type { Media } from '../../data/schema';

export function buildGeographyQuestion(spec: GeographyQuestionSpec, random: () => number = Math.random) {
  const card = geographyRepository.byId(spec.cardId)!;
  const peers = geographyRepository.byKind('outline').filter(item => item.id !== card.id);
  const shuffle = <T,>(items: T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const tags = new Set(card.similarityTags);
  const score = (peer: typeof card) => peer.similarityTags.filter(tag => tags.has(tag)).length;
  const distractors = shuffle(peers).sort((a,b) => score(b)-score(a)).slice(0,3);
  const options = shuffle([card.nameRu,...distractors.map(peer => peer.nameRu)]);
  if (new Set(options).size !== 4) throw new Error(`Недостаточно вариантов: ${spec.id}`);
  const optionMedia: Record<string, Media> = {};
  const optionLabels: Record<string, string> = {};
  if (spec.type === 'select-outline') options.forEach((option,index) => {
    optionLabels[option] = `Контур ${['А','Б','В','Г'][index]}`;
    optionMedia[option] = geographyRepository.media([card,...distractors].find(peer => peer.nameRu === option)!,false);
  });
  const showMedia = spec.type === 'identify';
  return {
    entry: { id: spec.id, cardId: card.id, kind: card.kind, nameRu: card.nameRu,
      summaryRu: card.summaryRu, explanationRu: card.explanationRu, mediaId: card.id },
    options, correctOption: card.nameRu,
    prompt: showMedia ? 'Какая страна изображена по контуру?' : `Какой контур принадлежит стране «${card.nameRu}»?`,
    showMedia, questionMedia: showMedia ? geographyRepository.media(card,false) : undefined,
    explanationMedia: geographyRepository.media(card),
    optionMedia: spec.type === 'select-outline' ? optionMedia : undefined, optionLabels,
    detailPath: `/geography/${card.id}`,
  };
}
export type GeographyQuizEntry = ReturnType<typeof buildGeographyQuestion>['entry'];
