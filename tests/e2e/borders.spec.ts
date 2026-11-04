import { expect, test } from '@playwright/test';

test('Borders is absent from Learn, Quiz, old routes and old progress', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByRole('link', { name: /Границы/ })).toHaveCount(0);
  await page.goto('/quiz');
  await expect(page.getByRole('button', { name: /Границы/ })).toHaveCount(0);
  await page.goto('/learn/borders');
  await expect(page.getByRole('heading', { name: 'Раздел не найден' })).toBeVisible();
  await page.goto('/border/switzerland');
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  await page.goto('/quiz/session?mode=border&focus=border-064');
  await expect(page.getByRole('heading', { name: 'Тема больше недоступна' })).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('geotrainer-progress', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('items', 'readwrite');
      tx.objectStore('items').put({ contentId: 'border-064', contentType: 'border', shownCount: 1, correctCount: 0, wrongCount: 1, currentStreak: 0, lastResult: 'wrong', lastAttemptAt: new Date().toISOString() });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.goto('/mistakes'); await page.reload();
  await expect(page.locator('.mistake-row')).toHaveCount(0);
  await page.goto('/progress');
  await expect(page.getByRole('heading', { name: 'Прогресса пока нет' })).toBeVisible();
  await page.goto('/learn');
  await expect(page.getByRole('link', { name: /Границы|Швейцария/ })).toHaveCount(0);
});
