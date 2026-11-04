import { expect, test } from '@playwright/test';

test('one record section offers all 60 cards and filters by lake, river and mountain', async ({ page }) => {
  await page.goto('/learn');
  const section = page.locator('.category-card').filter({ has: page.getByRole('heading', { name: 'Рекорды и уникальность', exact: true }) });
  await expect(section).toHaveCount(1);
  await expect(section).toContainText('60 объектов');
  for (const name of ['Реки', 'Озёра', 'Горы']) {
    await expect(page.locator('.category-card').filter({ has: page.getByRole('heading', { name, exact: true }) })).toHaveCount(0);
  }
  await section.click();
  await expect(page).toHaveURL(/\/learn\/records$/);
  await expect(page.locator('.record-card')).toHaveCount(60);
  await expect(page.getByRole('link', { name: 'Тренировать тему' })).toHaveAttribute('href', '/quiz/session?mode=records&count=5');
  const kinds = page.getByRole('group', { name: 'Тип объекта', exact: true });
  for (const [label, kind] of [['Озёра', 'lake'], ['Реки', 'river'], ['Горы', 'mountain']]) {
    await kinds.getByRole('button', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/learn/records\\?kind=${kind}$`));
    await expect(page.locator('.record-card')).toHaveCount(20);
    await expect(kinds.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('link', { name: 'Тренировать тему' })).toHaveAttribute('href', `/quiz/session?mode=${kind}&count=5`);
  }
  await kinds.getByRole('button', { name: 'Озёра', exact: true }).click();
  await page.getByRole('group', { name: 'Критерий отбора' }).getByRole('button', { name: 'Глубокие', exact: true }).click();
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Байкал');
  await expect(page.locator('.record-card')).toHaveCount(2);
  await page.locator('.record-card[href="/record/baikal?kind=lake"]').click();
  await expect(page.locator('.card-navigation')).toContainText('из 20');
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page).toHaveURL(/\/record\/tanganyika\?kind=lake$/);
  await page.getByRole('link', { name: 'Рекорды и уникальность', exact: true }).click();
  await expect(page).toHaveURL(/\/learn\/records\?kind=lake$/);
  await expect(page.locator('.record-card')).toHaveCount(20);
  await expect(kinds.getByRole('button', { name: 'Озёра', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await kinds.getByRole('button', { name: 'Все', exact: true }).click();
  await expect(page.locator('.record-card')).toHaveCount(60);
  await page.goBack();
  await expect(kinds.getByRole('button', { name: 'Озёра', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.record-card')).toHaveCount(20);
});

test('old catalog URLs open the matching filter; default navigation spans all three kinds', async ({ page }) => {
  for (const [path, kind] of [['lakes', 'lake'], ['rivers', 'river'], ['mountains', 'mountain']]) {
    await page.goto(`/learn/${path}`);
    await expect(page).toHaveURL(new RegExp(`/learn/records\\?kind=${kind}$`));
    await expect(page.getByRole('heading', { name: 'Рекорды и уникальность', exact: true })).toBeVisible();
    await expect(page.locator('.record-card')).toHaveCount(20);
  }
  await page.goto('/record/zambezi');
  await expect(page.locator('.card-navigation')).toContainText('из 60');
  await page.getByRole('button', { name: 'Дальше', exact: true }).click();
  await expect(page).toHaveURL(/\/record\/everest$/);
  await page.goto('/learn/records?kind=invalid');
  await expect(page.locator('.record-card')).toHaveCount(60);
});

test('quiz has one record topic, can select a kind and explains answers in the combined mode', async ({ page }) => {
  await page.goto('/quiz');
  await page.getByRole('button', { name: /Рекорды и уникальность/ }).click();
  const kinds = page.getByRole('group', { name: 'Тип объекта', exact: true });
  await expect(page.getByRole('link', { name: 'Начать тренировку' })).toHaveAttribute('href', '/quiz/session?mode=records&count=5');
  await kinds.getByRole('button', { name: 'Озёра', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Начать тренировку' })).toHaveAttribute('href', '/quiz/session?mode=lake&count=5');
  await page.goto('/quiz/session?mode=records&count=1&focus=record-baikal');
  await page.getByRole('button', { name: 'Байкал', exact: true }).click();
  await expect(page.getByText('Верно', { exact: true })).toBeVisible();
  await expect(page.locator('.answer-button:enabled')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Карточка и источники →' })).toHaveAttribute('href', '/record/baikal');
  await expect(page.getByRole('button', { name: 'Завершить', exact: true })).toBeVisible();
});

test('combined filters fit the required widths and work offline', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  test.setTimeout(60_000);
  for (const width of [360, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/learn/records');
    await page.getByRole('group', { name: 'Тип объекта', exact: true }).getByRole('button', { name: 'Озёра', exact: true }).click();
    await expect(page.locator('.record-card')).toHaveCount(20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator(width < 1024 ? '.mobile-bottom-nav' : '.desktop-sidebar')).toBeVisible();
    if (width === 390 || width === 1440) await page.screenshot({ path: `artifacts/records-qa/unified-${width}.png` });
  }
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.record-card')).toHaveCount(20);
  await page.getByRole('group', { name: 'Тип объекта', exact: true }).getByRole('button', { name: 'Все', exact: true }).click();
  await expect(page.locator('.record-card')).toHaveCount(60);
});
