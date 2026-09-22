import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { progressRepository, type ContentType, type ProgressRecord } from '../storage/progress';

interface ProgressState {
  records: ProgressRecord[];
  ready: boolean;
  error: string | null;
  recordAnswer: (id: string, kind: ContentType, correct: boolean) => Promise<void>;
}
const Context = createContext<ProgressState | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    progressRepository.getAll().then(setRecords).catch(() => setError('Не удалось загрузить локальный прогресс.')).finally(() => setReady(true));
  }, []);
  const recordAnswer = async (id: string, kind: ContentType, correct: boolean) => {
    try {
      const next = await progressRepository.recordAnswer(id, kind, correct);
      setRecords(previous => [...previous.filter(x => x.contentId !== id), next]);
    } catch {
      setError('Не удалось сохранить ответ на этом устройстве.');
    }
  };
  return <Context.Provider value={{ records, ready, error, recordAnswer }}>{children}</Context.Provider>;
}

export function useProgress() {
  const value = useContext(Context);
  if (!value) throw new Error('ProgressProvider отсутствует');
  return value;
}
