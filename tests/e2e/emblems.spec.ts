import { expect, test } from '@playwright/test';

const newEmblems = [
  ['andorra-coat-of-arms', 'Андорра'],
  ['antigua-and-barbuda-coat-of-arms', 'Антигуа и Барбуда'],
  ['armenia-state-coat-of-arms', 'Армения'],
  ['bahamas-coat-of-arms', 'Багамские Острова'],
  ['bangladesh-national-emblem', 'Бангладеш'],
  ['barbados-coat-of-arms', 'Барбадос'],
  ['china-national-emblem', 'Китай'],
  ['democratic-republic-of-the-congo-national-emblem', 'Демократическая Республика Конго'],
  ['croatia-coat-of-arms', 'Хорватия'],
  ['cuba-coat-of-arms', 'Куба'],
  ['cyprus-national-emblem', 'Кипр'],
  ['czechia-greater-coat-of-arms', 'Чехия'],
  ['denmark-national-coat-of-arms', 'Дания'],
  ['estonia-greater-coat-of-arms', 'Эстония'],
  ['finland-coat-of-arms', 'Финляндия'],
  ['greece-national-emblem', 'Греция'],
  ['ireland-coat-of-arms', 'Ирландия'],
  ['italy-national-emblem', 'Италия'],
  ['latvia-greater-coat-of-arms', 'Латвия'],
  ['lithuania-coat-of-arms', 'Литва'],
  ['slovakia-coat-of-arms', 'Словакия'],
  ['slovenia-coat-of-arms', 'Словения'],
] as const;

test('new emblem cards have working local illustrations and source credits', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/learn/emblems');
  await expect(page.getByText('46 объектов')).toBeVisible();
  for (const [id, title] of newEmblems) {
    await page.goto(`/item/${id}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Источники и права' })).toBeVisible();
    const image = page.locator('.detail-media img').first();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  }
});

test('new national emblem reveals its explanation after the answer', async ({ page }) => {
  await page.goto('/item/bangladesh-national-emblem');
  await page.getByRole('link', { name: 'Проверить себя' }).click();
  await page.getByRole('button', { name: 'Бангладеш' }).click();
  await expect(page.getByText('Верно', { exact: true })).toBeVisible();
  await expect(page.getByText(/три соединённых листа джута/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Следующий вопрос' })).toBeVisible();
});
