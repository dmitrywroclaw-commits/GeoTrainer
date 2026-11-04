import { expect, test } from '@playwright/test';
import geography from '../../content/geography.json' with { type: 'json' };

test('every waterway SVG renders with a geographic locator', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('/learn/waterways');
  const images = geography.waterways.map(card => `<figure><img alt="${card.nameRu}" src="/media/geography/${card.id}-diagram.svg"><figcaption>${card.nameRu}</figcaption></figure>`).join('');
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.setContent(`<html lang="ru"><style>body{margin:20px;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:335px;gap:12px;font:18px Arial;background:#fafafa}figure{margin:0;height:335px;border:1px solid #ccd5d2;border-radius:8px;overflow:hidden;background:white}img{display:block;width:100%;height:285px;object-fit:contain}figcaption{height:48px;padding:12px}</style>${images}</html>`);
  await expect(page.locator('img')).toHaveCount(22);
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: 'artifacts/records-qa/waterway-map-review.png', fullPage: true });
});

test('20 objects per catalog, criterion filters, sources and card navigation', async ({ page }) => {
  for (const [path, name] of [['rivers','Нил'],['mountains','Эверест (Джомолунгма)'],['lakes','Каспийское море']]) {
    await page.goto(`/learn/${path}`);
    await expect(page.locator('.record-card')).toHaveCount(20);
    await page.getByRole('link', { name: new RegExp(name.replace(/[()]/g, '\\$&')) }).first().click();
    await expect(page.getByRole('heading', { name: 'Как понимать рекорд' })).toBeVisible();
    await expect(page.locator('.source-block a').first()).toHaveAttribute('href', /^https:/);
    const url = page.url();
    await page.getByRole('button', { name: 'Дальше', exact: true }).click();
    await expect(page).not.toHaveURL(url);
  }
  await page.goto('/learn/lakes');
  await page.getByRole('button', { name: 'Глубокие', exact: true }).click();
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Байкал');
  // Search also includes learning explanations: Tanganyika compares its depth to Baikal.
  await expect(page.locator('.record-card')).toHaveCount(2);
  await expect(page.locator('.record-card').filter({ hasText: 'Байкал' })).toHaveCount(1);
});

for (const [mode, id, name] of [['river','nile','Нил'],['mountain','everest','Эверест (Джомолунгма)'],['lake','baikal','Байкал']]) {
  test(`${mode}: incorrect answer, explanation, review and persisted progress`, async ({ page }) => {
    await page.goto(`/quiz/session?mode=${mode}&count=1&focus=record-${id}`);
    await page.locator('.answer-button').filter({ hasNotText: name }).first().click();
    await expect(page.getByText(/Неверно/)).toBeVisible();
    await expect(page.locator('.answer-button:enabled')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Карточка и источники →' })).toHaveAttribute('href', `/record/${id}`);
    await page.goto('/mistakes');
    await page.reload();
    await expect(page.locator('.mistake-row').filter({ hasText: name })).toBeVisible();
    await page.getByRole('link', { name: 'Повторить ошибки' }).click();
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByText('Верно', { exact: true })).toBeVisible();
    await page.goto('/progress');
    await page.reload();
    await expect(page.locator('.domain-row').filter({ hasText: { river: 'Реки', mountain: 'Горы', lake: 'Озёра' }[mode]! })).toContainText('1 из 2 верно');
  });
}

test('experimental names distinguish terms, aliases, translated names and smell', async ({ page }) => {
  await page.goto('/learn/names');
  await expect(page.locator('.record-card')).toHaveCount(101);
  await page.getByRole('button', { name: 'Запахи', exact: true }).click();
  await expect(page.locator('.record-card')).toHaveCount(3);
  await page.getByRole('link', { name: /Ароматная река/ }).click();
  await expect(page.getByRole('heading', { name: 'Не перепутайте' })).toBeVisible();
  await page.goto('/learn/names');
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Голубая река');
  await page.getByRole('link', { name: /Голубая река/ }).click();
  await expect(page.locator('.record-detail')).toContainText('Историческое наименование');
  await expect(page.getByText('Янцзы', { exact: true })).toBeVisible();
});

test('new strait maps show actual coastlines and readable water/land relationships', async ({ page }) => {
  await page.goto('/learn/waterways');
  await expect(page.locator('.geography-card')).toHaveCount(20);
  await page.getByRole('link', { name: /Берингов пролив/ }).click();
  const map = page.locator('.detail-media img').first();
  await expect.poll(() => map.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  await expect(map).toHaveAttribute('alt', /очертания берегов/);
  await page.getByRole('button', { name: 'Связи', exact: true }).click();
  await expect(page.locator('.water-connections')).toContainText('Берингово море');
  await expect(page.locator('.water-banks')).toContainText('Северная Америка');
  await page.getByRole('button', { name: 'На карте', exact: true }).click();
  await expect(map).toBeVisible();
});

test('new record text and visited strait maps work offline', async ({ page, context }) => {
  await page.goto('/geography/gibraltar');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect.poll(() => page.evaluate(async () => Boolean(await caches.match('/media/geography/gibraltar-diagram.svg')))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect.poll(() => page.locator('.detail-media img').first().evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  await page.goto('/record/baikal');
  await expect(page.getByRole('heading', { name: 'Байкал', exact: true })).toBeVisible();
  await expect(page.getByText('1 642 м', { exact: true })).toBeVisible();
  await page.goto('/name/equator');
  await expect(page.getByRole('heading', { name: 'Экватор', exact: true })).toBeVisible();
});

test('new catalogs and diagrams fit every required width', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  test.setTimeout(90_000);
  for (const width of [360,390,430,1280,1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/learn/rivers','/learn/names','/record/ob-irtysh','/name/roaring-forties','/geography/gibraltar','/geography/bosphorus']) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${route} at ${width}`).toBeLessThanOrEqual(1);
      await expect(page.locator(width < 1024 ? '.mobile-bottom-nav' : '.desktop-sidebar')).toBeVisible();
      if (route === '/geography/gibraltar') {
        await page.screenshot({ path: `artifacts/records-qa/gibraltar-${width}.png`, fullPage: true });
        await page.getByRole('button', { name: 'Связи', exact: true }).click();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      }
      if (width === 390 && ['/learn/names','/learn/rivers','/record/ob-irtysh','/geography/bosphorus'].includes(route)) await page.screenshot({ path: `artifacts/records-qa/${route.split('/').pop()}-${width}.png`, fullPage: route !== '/learn/names' });
    }
  }
});
