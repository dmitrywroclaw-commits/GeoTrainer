import type { Entry } from '../../data/schema';

type Flag = Extract<Entry, { kind: 'flag' }>;

export function flagMeaningHistory(entry: Flag) {
  return [entry.explanationRu.trim(), entry.historyRu?.trim()].filter(Boolean).join(' ');
}
