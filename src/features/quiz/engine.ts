import type { Entry } from '../../data/schema';

export type QuizMode = Entry['kind'] | 'mixed' | 'mistakes';
export interface Question {
  entry: Entry;
  options: string[];
  correctOption: string;
  prompt: string;
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

export function createSession(all: Entry[], mode: QuizMode, count: number, reviewIds: string[] = [], random: () => number = Math.random): Question[] {
  const eligible = all.filter(x => !x.quizHints?.excludeFromQuiz && (mode === 'mixed' || (mode === 'mistakes' ? reviewIds.includes(x.id) : x.kind === mode)));
  if (!eligible.length) return [];
  const questions: Question[] = [];
  if (mode === 'mixed') {
    const kinds = (['flag', 'emblem', 'landmark'] as const).filter(kind => eligible.some(item => item.kind === kind));
    const pools = Object.fromEntries(kinds.map(kind => [kind, eligible.filter(item => item.kind === kind)])) as Record<Entry['kind'], Entry[]>;
    const cycles: Partial<Record<Entry['kind'], Entry[]>> = {};
    let round: Entry['kind'][] = [];
    while (questions.length < count) {
      if (!round.length) round = shuffle(kinds, random);
      const kind = round.pop()!;
      if (!cycles[kind]?.length) cycles[kind] = shuffle(pools[kind], random);
      questions.push(buildQuestion(cycles[kind]!.pop()!, all, random));
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
