import { geographyRepository, type GeographyQuestionSpec } from '../../data/geography';
import type { Media } from '../../data/schema';

export function buildGeographyQuestion(spec: GeographyQuestionSpec, random: () => number = Math.random) {
  const card = geographyRepository.byId(spec.cardId)!;
  const peers = geographyRepository.byKind(card.kind).filter(item => item.id !== card.id);
  const shuffle = <T,>(items: T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  let prompt: string;
  let correctOption: string = card.nameRu;
  let distractors: string[] = peers.map(peer => peer.nameRu);
  let showMedia = false;
  const optionMedia: Record<string, Media> = {};
  const optionLabels: Record<string, string> = {};
  if (card.kind === 'outline') {
    prompt = spec.type === 'select-outline' ? `Какой контур принадлежит стране «${card.nameRu}»?` : 'Какая страна изображена по контуру?';
    showMedia = spec.type === 'identify';
    const tags = new Set(card.similarityTags);
    distractors = shuffle(peers).sort((a, b) => {
      const score = (peer: typeof a) => peer.kind === 'outline' ? peer.similarityTags.filter(tag => tags.has(tag)).length : 0;
      return score(b) - score(a);
    }).map(peer => peer.nameRu);
  } else {
    const pair = (items: string[]) => items.join(' и ');
    prompt = `Какой водный путь непосредственно соединяет ${pair(card.connectsRu)}?`;
    // Different passages can connect the same waters (e.g. Drake and Magellan).
    // Never offer another valid answer to an identification question.
    distractors = peers.filter(peer => peer.kind !== 'waterway' || !peer.connectsRu.every(water => card.connectsRu.includes(water))).map(peer => peer.nameRu);
    if (spec.type === 'connects') {
      prompt = `Какие водоёмы соединяет ${card.nameRu}?`;
      correctOption = pair(card.connectsRu);
      distractors = peers.flatMap(peer => peer.kind === 'waterway' ? [pair(peer.connectsRu)] : []);
    } else if (spec.type === 'banks') {
      prompt = `Какие участки суши разделяет пролив «${card.nameRu}»?`;
      correctOption = pair(card.banksRu);
      const banks = [...new Set(geographyRepository.byKind('waterway').flatMap(peer => peer.kind === 'waterway' ? peer.banksRu : []))];
      distractors = banks.flatMap((bank, index) => banks.slice(index + 1)
        .filter(other => ![bank, other].every(value => card.banksRu.includes(value)))
        .map(other => pair([bank, other])))
        .concat(banks.map(bank => `Оба берега: ${bank}`));
    } else if (spec.type === 'route') {
      const route = card.routeRu;
      prompt = `Выберите путь через «${card.nameRu}»: ${route[0]} → ${route[route.length - 1]}.`;
      correctOption = route.join(' → ');
      distractors = peers.map(peer => route.map((step, index) => step === card.nameRu && index > 0 ? peer.nameRu : step).join(' → '));
      // The Bosphorus and Dardanelles share a route; vary an actual passage, not a sea.
    }
  }
  const unique = [...new Set(distractors)].filter(value => value !== correctOption);
  const options = shuffle([correctOption, ...(card.kind === 'outline' ? unique : shuffle(unique)).slice(0, 3)]);
  if (options.length !== 4) throw new Error(`Недостаточно вариантов: ${spec.id}`);
  if (spec.type === 'select-outline') options.forEach((option, index) => {
    optionLabels[option] = `Контур ${['А', 'Б', 'В', 'Г'][index]}`;
    optionMedia[option] = geographyRepository.media([card, ...peers].find(peer => peer.nameRu === option)!, false);
  });
  return {
    entry: { id: spec.id, cardId: card.id, kind: card.kind, nameRu: card.nameRu,
      summaryRu: card.summaryRu, explanationRu: card.explanationRu, mediaId: card.id },
    options, correctOption, prompt, showMedia,
    questionMedia: showMedia ? geographyRepository.media(card, false) : undefined,
    explanationMedia: geographyRepository.media(card),
    optionMedia: spec.type === 'select-outline' ? optionMedia : undefined,
    optionLabels,
    detailPath: `/geography/${card.id}`,
  };
}
export type GeographyQuizEntry = ReturnType<typeof buildGeographyQuestion>['entry'];
