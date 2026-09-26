import type { Entry } from '../../data/schema';
import { borderRepository, type BorderQuestionSpec } from '../../data/borders';
import { capitalRepository, type CapitalQuestionSpec } from '../../data/capitals';

export type QuizMode = Entry['kind'] | 'border' | 'capital' | 'mixed' | 'mistakes';
export interface BorderQuizEntry {
  id: string;
  kind: 'border';
  nameRu: string;
  summaryRu: string;
  explanationRu: string;
  mediaId: string;
  countryId: string;
}
export interface CapitalQuizEntry {
  id: string;
  cardId: string;
  kind: 'capital';
  nameRu: string;
  summaryRu: string;
  explanationRu: string;
  mediaId?: string;
  countryId: string;
}
export interface Question {
  entry: Entry | BorderQuizEntry | CapitalQuizEntry;
  options: string[];
  correctOption: string;
  prompt: string;
  showMedia?: boolean;
}

const shuffle = <T,>(items: T[], random: () => number) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export function answerLabel(entry: Entry) { return entry.nameRu; }

export function buildQuestion(entry: Entry, all: Entry[], random: () => number = Math.random): Question {
  const pool = all.filter(x => x.kind === entry.kind && x.id !== entry.id && !x.quizHints?.excludeFromQuiz);
  const tags = new Set(entry.quizHints?.similarityTags ?? []);
  const scored = pool.map(item => ({ item, score: (item.quizHints?.similarityTags ?? []).filter(x => tags.has(x)).length + (item.kind !== 'landmark' && entry.kind !== 'landmark' && item.countryId === entry.countryId ? -10 : 0), tie: random() }));
  scored.sort((a, b) => b.score - a.score || a.tie - b.tie);
  const labels = [...new Set(scored.map(x => answerLabel(x.item)))].filter(x => x !== answerLabel(entry)).slice(0, 3);
  if (labels.length < 3) throw new Error(`Недостаточно вариантов ответа для ${entry.kind}`);
  const prompt = entry.kind === 'flag' ? 'Какой стране принадлежит этот флаг?' : entry.kind === 'emblem' ? 'Какой стране принадлежит этот символ?' : 'Что изображено на фотографии?';
  return { entry, options: shuffle([answerLabel(entry), ...labels], random), correctOption: answerLabel(entry), prompt };
}

export function buildBorderQuestion(spec: BorderQuestionSpec, random: () => number = Math.random): Question {
  const fact = borderRepository.fact(spec.countryId)!;
  const name = borderRepository.countryName(spec.countryId);
  const country = borderRepository.countryName;
  let prompt: string;
  let options: string[];
  let correctOption: string;
  if (spec.type === 'single') {
    prompt = `С какой единственной страной ${name} имеет сухопутную границу?`;
    options = spec.optionCountryIds!.map(country);
    correctOption = country(fact.neighborIds[0]);
  } else if (spec.type === 'identify') {
    prompt = spec.promptRu!;
    options = spec.optionCountryIds!.map(country);
    correctOption = name;
  } else if (spec.type === 'pair') {
    prompt = `С какими двумя странами граничит ${name}?`;
    options = spec.optionPairs!.map(pair => pair.map(country).join(' и '));
    correctOption = fact.neighborIds.map(country).join(' и ');
  } else if (spec.type === 'not-neighbor') {
    prompt = `Какая из этих стран НЕ граничит с государством ${name}?`;
    options = spec.optionCountryIds!.map(country);
    correctOption = country(spec.optionCountryIds!.find(id => !fact.neighborIds.includes(id))!);
  } else {
    prompt = `Сколько государств имеют сухопутную границу с государством ${name}?`;
    options = spec.countOptions!.map(String);
    correctOption = String(fact.neighborIds.length);
  }
  if (!options.includes(correctOption)) throw new Error(`Не найден ответ в ${spec.id}`);
  return {
    entry: { id: spec.id, kind: 'border', nameRu: name, summaryRu: fact.summaryRu, explanationRu: fact.summaryRu, mediaId: fact.mapId, countryId: fact.countryId },
    prompt: spec.promptRu ?? prompt, options: shuffle(options, random), correctOption,
  };
}

export function buildCapitalQuestion(spec: CapitalQuestionSpec, random: () => number = Math.random): Question {
  const card = capitalRepository.byId(spec.cardId)!;
  const entries = capitalRepository.all();
  const cityAnswer = spec.type === 'country-to-city';
  const correctOption = cityAnswer ? card.cityNameRu : capitalRepository.countryName(card.countryId);
  const options = [...new Set(entries.filter(item => item.id !== card.id && (!cityAnswer || card.role !== 'capital' || item.role === 'capital'))
    .map(item => ({ item, sameRegion: item.regionRu === card.regionRu, tie: random() }))
    .sort((a, b) => Number(b.sameRegion) - Number(a.sameRegion) || a.tie - b.tie)
    .map(({ item }) => cityAnswer ? item.cityNameRu : capitalRepository.countryName(item.countryId)))]
    .filter(label => label !== correctOption).slice(0, 3);
  if (options.length < 3) throw new Error(`Недостаточно вариантов ответа для ${spec.id}`);
  const country = capitalRepository.countryName(card.countryId);
  const prompt = (spec.type === 'country-to-city' ? card.quiz.countryToCityPromptRu : card.quiz.cityToCountryPromptRu) ?? (spec.type === 'country-to-city'
    ? card.role === 'capital' ? `Какова столица страны «${country}»?`
      : card.role === 'claimed' ? `Какой город Палестина называет своей столицей?`
        : card.role === 'former_capital' ? `Какой город был прежней столицей страны «${country}»?`
          : `Какой город выполняет роль «${card.roleRu}» для страны «${country}»?`
    : card.role === 'capital' ? `Столицей какой страны является город «${card.cityNameRu}»?`
      : card.role === 'former_capital' ? `Прежней столицей какой страны был город «${card.cityNameRu}»?`
        : `С какой страной связан город «${card.cityNameRu}» в роли «${card.roleRu}»?`);
  return {
    entry: { id: spec.id, cardId: card.id, kind: 'capital', nameRu: card.cityNameRu,
      summaryRu: card.summaryRu, explanationRu: card.explanationRu, mediaId: card.mediaId, countryId: card.countryId },
    prompt, options: shuffle([correctOption, ...options], random), correctOption,
    showMedia: false,
  };
}

export function createSession(all: Entry[], mode: QuizMode, count: number, reviewIds: string[] = [], random: () => number = Math.random): Question[] {
  if (mode === 'capital') {
    const eligible = capitalRepository.allQuestions();
    if (!eligible.length) return [];
    const questions: Question[] = [];
    let cycle: CapitalQuestionSpec[] = [];
    while (questions.length < count) {
      if (!cycle.length) cycle = shuffle(eligible, random);
      questions.push(buildCapitalQuestion(cycle.pop()!, random));
    }
    return questions;
  }
  if (mode === 'border') {
    const eligible = borderRepository.allQuestions();
    if (!eligible.length) return [];
    const questions: Question[] = [];
    let cycle: BorderQuestionSpec[] = [];
    while (questions.length < count) {
      if (!cycle.length) cycle = shuffle(eligible, random);
      questions.push(buildBorderQuestion(cycle.pop()!, random));
    }
    return questions;
  }
  if (mode === 'mistakes') {
    const entries = all.filter(x => reviewIds.includes(x.id) && !x.quizHints?.excludeFromQuiz);
    const borders = borderRepository.allQuestions().filter(x => reviewIds.includes(x.id));
    const capitals = capitalRepository.allQuestions().filter(x => reviewIds.includes(x.id));
    const eligible = shuffle([...entries, ...borders, ...capitals], random);
    if (!eligible.length) return [];
    return Array.from({ length: count }, (_, index) => {
      const item = eligible[index % eligible.length];
      return 'cardId' in item ? buildCapitalQuestion(item, random) : 'type' in item ? buildBorderQuestion(item, random) : buildQuestion(item, all, random);
    });
  }
  const eligible = all.filter(x => !x.quizHints?.excludeFromQuiz && (mode === 'mixed' || x.kind === mode));
  if (!eligible.length) return [];
  const questions: Question[] = [];
  if (mode === 'mixed') {
    const kinds = (['flag', 'emblem', 'landmark', 'border', 'capital'] as const).filter(kind => kind === 'border' ? borderRepository.allQuestions().length > 0 : kind === 'capital' ? capitalRepository.allQuestions().length > 0 : eligible.some(item => item.kind === kind));
    const pools = Object.fromEntries(kinds.map(kind => [kind, kind === 'border' ? borderRepository.allQuestions() : kind === 'capital' ? capitalRepository.allQuestions() : eligible.filter(item => item.kind === kind)])) as Record<typeof kinds[number], (Entry | BorderQuestionSpec | CapitalQuestionSpec)[]>;
    const cycles: Partial<Record<typeof kinds[number], (Entry | BorderQuestionSpec | CapitalQuestionSpec)[]>> = {};
    let round: (typeof kinds[number])[] = [];
    while (questions.length < count) {
      if (!round.length) round = shuffle(kinds, random);
      const kind = round.pop()!;
      if (!cycles[kind]?.length) cycles[kind] = shuffle(pools[kind], random);
      const item = cycles[kind]!.pop()!;
      questions.push('cardId' in item ? buildCapitalQuestion(item, random) : 'type' in item ? buildBorderQuestion(item, random) : buildQuestion(item, all, random));
    }
    return questions;
  }
  let cycle: Entry[] = [];
  while (questions.length < count) {
    if (!cycle.length) cycle = shuffle(eligible, random);
    questions.push(buildQuestion(cycle.pop()!, all, random));
  }
  return questions;
}
