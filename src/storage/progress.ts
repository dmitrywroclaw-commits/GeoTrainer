export type ContentType = 'flag' | 'emblem' | 'landmark' | 'border' | 'capital';
export interface ProgressRecord {
  contentId: string;
  contentType: ContentType;
  shownCount: number;
  correctCount: number;
  wrongCount: number;
  currentStreak: number;
  lastResult: 'correct' | 'wrong';
  lastAttemptAt: string;
}

export interface ProgressRepository {
  getAll(): Promise<ProgressRecord[]>;
  recordAnswer(contentId: string, contentType: ContentType, correct: boolean): Promise<ProgressRecord>;
}

const DB_NAME = 'geotrainer-progress';
const STORE = 'items';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'contentId' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const progressRepository: ProgressRepository = {
  async getAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as ProgressRecord[]);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  },
  async recordAnswer(contentId, contentType, correct) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const request = store.get(contentId);
      let record: ProgressRecord;
      request.onsuccess = () => {
        const previous = request.result as ProgressRecord | undefined;
        record = {
          contentId, contentType,
          shownCount: (previous?.shownCount ?? 0) + 1,
          correctCount: (previous?.correctCount ?? 0) + (correct ? 1 : 0),
          wrongCount: (previous?.wrongCount ?? 0) + (correct ? 0 : 1),
          currentStreak: correct ? (previous?.currentStreak ?? 0) + 1 : 0,
          lastResult: correct ? 'correct' : 'wrong',
          lastAttemptAt: new Date().toISOString(),
        };
        store.put(record);
      };
      tx.oncomplete = () => { db.close(); resolve(record!); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },
};

export function selectMistakes(records: ProgressRecord[]) {
  return records.filter(x => x.wrongCount > 0)
    .sort((a, b) => (b.wrongCount * 2 - b.correctCount) - (a.wrongCount * 2 - a.correctCount) || b.lastAttemptAt.localeCompare(a.lastAttemptAt));
}

export function aggregateProgress(records: ProgressRecord[]) {
  const total = records.reduce((sum, x) => sum + x.shownCount, 0);
  const correct = records.reduce((sum, x) => sum + x.correctCount, 0);
  return { total, correct, percentage: total ? Math.round(correct / total * 100) : 0, studied: records.length, needsReview: selectMistakes(records).length };
}
