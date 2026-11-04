import { extremesRepository, type Extreme, type ExtremeKind } from '../../data/extremes';

export interface RecordQuizEntry {
  id: string; cardId: string; kind: ExtremeKind; nameRu: string; summaryRu: string; explanationRu: string; mediaId?: string;
}

export function buildRecordQuestion(card: Extreme, random: () => number = Math.random) {
  const distractors = extremesRepository.byKind(card.kind).filter(item => item.id !== card.id)
    .map(item => ({ item, similarity: item.tags.filter(tag => card.tags.includes(tag)).length, tie: random() }))
    .sort((a, b) => b.similarity - a.similarity || a.tie - b.tie).slice(0, 3).map(({ item }) => item.nameRu);
  const options = [card.nameRu, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const entry: RecordQuizEntry = {
    id: `record-${card.id}`, cardId: card.id, kind: card.kind, nameRu: card.nameRu, summaryRu: card.distinctionRu,
    explanationRu: `${card.nameRu} — ${card.distinctionRu.toLocaleLowerCase('ru')}. ${card.explanationRu} ${card.caveatRu}`,
  };
  return { entry, prompt: `${card.distinctionRu}. Где: ${card.regionRu}. ${card.metric.labelRu}: ${card.metric.valueRu}. Какой это объект?`,
    correctOption: card.nameRu, options, showMedia: false, detailPath: `/record/${card.id}` };
}
