import { expect, test } from '@playwright/test';

test('Learn → catalog → detail', async ({ page }) => {
  await page.goto('/learn');
  await page.getByRole('link', { name: /Флаги/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Флаги' })).toBeVisible();
  await page.getByRole('link', { name: /Мексика/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Мексика' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Источники и права' })).toBeVisible();
  await page.getByRole('button', { name: 'Открыть изображение крупнее' }).click();
  await expect(page.getByRole('dialog', { name: 'Просмотр изображения' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Просмотр изображения' })).toBeHidden();
});

test('new Bhutan flag card appears with its local illustration', async ({ page }) => {
  await page.goto('/learn/flags');
  await page.getByRole('textbox', { name: 'Поиск по каталогу' }).fill('Бутан');
  await page.getByRole('link', { name: /Бутан/ }).click();
  await expect(page.getByRole('heading', { name: 'Бутан' })).toBeVisible();
  await expect(page.getByText(/Белый дракон — главный опознавательный знак/)).toBeVisible();
  const image = page.getByRole('img', { name: 'Национальный флаг Бутан' });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
});

test('plain national flag shows facts and a local image', async ({ page }) => {
  await page.goto('/item/botswana-national-flag');
  await expect(page.getByRole('heading', { name: 'Ботсвана' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ключевые факты' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Как узнать' })).toBeVisible();
  const image = page.locator('.detail-media img').first();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
});

test('new flag and landmark cards load', async ({ page }) => {
  for (const [id, title] of [['lebanon-national-flag', 'Ливан'], ['liberia-national-flag', 'Либерия'], ['liechtenstein-national-flag', 'Лихтенштейн'], ['luxembourg-national-flag', 'Люксембург'], ['nigeria-national-flag', 'Нигерия'], ['madagascar-national-flag', 'Мадагаскар'], ['malaysia-national-flag', 'Малайзия'], ['maldives-national-flag', 'Мальдивские Острова'], ['mauritius-national-flag', 'Маврикий'], ['moldova-state-flag', 'Республика Молдова'], ['montenegro-state-flag', 'Черногория'], ['morocco-national-flag', 'Марокко'], ['mozambique-national-flag', 'Мозамбик'], ['dominican-republic-national-flag', 'Доминиканская Республика'], ['ecuador-state-flag', 'Эквадор'], ['el-salvador-state-flag', 'Сальвадор'], ['equatorial-guinea-national-flag', 'Экваториальная Гвинея'], ['ethiopia-national-flag', 'Эфиопия'], ['eritrea-national-flag', 'Эритрея'], ['gabon-national-flag', 'Габон'], ['georgia-national-flag', 'Грузия'], ['gambia-national-flag', 'Гамбия'], ['ghana-national-flag', 'Гана'], ['grenada-national-flag', 'Гренада'], ['guinea-national-flag', 'Гвинея'], ['greece-national-flag', 'Греция'], ['ireland-national-flag', 'Ирландия'], ['italy-national-flag', 'Италия'], ['japan-national-flag', 'Япония'], ['latvia-national-flag', 'Латвия'], ['cyprus-national-flag', 'Кипр'], ['czechia-national-flag', 'Чехия'], ['benin-national-flag', 'Бенин'], ['estonia-national-flag', 'Эстония'], ['finland-state-flag', 'Финляндия'], ['france-national-flag', 'Франция'], ['armenia-national-flag', 'Армения'], ['belgium-national-flag', 'Бельгия'], ['bulgaria-national-flag', 'Болгария'], ['bahamas-national-flag', 'Багамские Острова'], ['congo-national-flag', 'Конго'], ['bolivia-state-flag', 'Боливия'], ['bahrain-national-flag', 'Бахрейн'], ['chad-national-flag', 'Чад'], ['barbados-national-flag', 'Барбадос'], ['antigua-and-barbuda-national-flag', 'Антигуа и Барбуда'], ['bosnia-and-herzegovina-national-flag', 'Босния и Герцеговина'], ['bosnia-and-herzegovina-coat-of-arms', 'Босния и Герцеговина'], ['seongsan-ilchulbong', 'Сонсан-Ильчхульбон'], ['mount-halla', 'Халласан'], ['geomunoreum-lava-tubes', 'Лавовые трубки Гомунорым'], ['mount-kilimanjaro', 'Килиманджаро'], ['lake-baikal', 'Озеро Байкал'], ['namib-sand-sea', 'Намибское песчаное море'], ['sundarbans-bangladesh', 'Мангровые леса Сундарбан'], ['bialowieza-forest', 'Беловежская пуща']]) {
    await page.goto(`/item/${id}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Источники и права' })).toBeVisible();
    const image = page.locator('.detail-media img').first();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  }
});

test('correct answer shows explanation before next question', async ({ page }) => {
  await page.goto('/item/mexico-national-flag');
  await page.getByRole('link', { name: 'Проверить себя' }).click();
  await page.getByRole('button', { name: 'Мексика' }).click();
  await expect(page.getByText('Верно', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Мексика' })).toBeVisible();
  await page.getByRole('button', { name: 'Следующий вопрос' }).click();
  await expect(page.getByText('2 / 5')).toBeVisible();
});

test('wrong answer appears in Mistakes and persists after reload', async ({ page }) => {
  await page.goto('/item/mexico-national-flag');
  await page.getByRole('link', { name: 'Проверить себя' }).click();
  await page.locator('.answer-button').filter({ hasNotText: 'Мексика' }).first().click();
  await expect(page.getByText(/Неверно\. Правильный ответ: Мексика/)).toBeVisible();
  await page.goto('/mistakes');
  await expect(page.getByRole('link', { name: /Мексика/ }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: /Мексика/ }).first()).toBeVisible();
});

test('navigation matches viewport and does not overflow', async ({ page }, testInfo) => {
  await page.goto('/learn/flags');
  const mobile = testInfo.project.name === 'mobile';
  await expect(page.locator('.mobile-bottom-nav')).toBeVisible({ visible: mobile });
  await expect(page.locator('.desktop-sidebar')).toBeVisible({ visible: !mobile });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('visited app shell opens offline', async ({ page, context }) => {
  await page.goto('/learn');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect.poll(() => page.evaluate(async () => Boolean(await caches.match('/media/flags/mexico.svg')))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Изучать' })).toBeVisible();
  await expect.poll(() => page.locator('.category-flag img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});

test('main layouts fit required widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  test.setTimeout(60_000);
  for (const width of [360, 390, 430, 768, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    for (const route of ['/learn', '/learn/flags', '/item/mexico-national-flag', '/quiz/session?mode=flag&count=5&focus=mexico-national-flag', '/progress']) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});
