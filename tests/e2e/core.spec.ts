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
  test.setTimeout(90_000);
  for (const [id, title] of [['mauritania-national-flag', 'Мавритания'], ['sao-tome-and-principe-national-flag', 'Сан-Томе и Принсипи'], ['lesotho-national-flag', 'Лесото'], ['kuwait-national-flag', 'Кувейт'], ['mali-national-flag', 'Мали'], ['palau-national-flag', 'Палау'], ['panama-national-flag', 'Панама'], ['micronesia-national-flag', 'Федеративные Штаты Микронезии'], ['burkina-faso-national-flag', 'Буркина-Фасо'], ['cote-divoire-national-flag', 'Кот-д’Ивуар'], ['jamaica-national-flag', 'Ямайка'], ['malta-national-flag', 'Мальта'], ['iceland-state-flag', 'Исландия'], ['lithuania-state-flag', 'Литва'], ['netherlands-kingdom-of-the-national-flag', 'Нидерланды'], ['russia-national-flag', 'Россия'], ['indonesia-national-flag', 'Индонезия'], ['israel-state-flag', 'Израиль'], ['jordan-national-flag', 'Иордания'], ['norway-state-flag', 'Норвегия'], ['denmark-state-flag', 'Дания'], ['germany-state-flag', 'Германия'], ['hungary-national-flag', 'Венгрия'], ['vietnam-national-flag', 'Вьетнам'], ['zambia-national-flag', 'Замбия'], ['zimbabwe-national-flag', 'Зимбабве'], ['yemen-national-flag', 'Йемен'], ['tanzania-national-flag', 'Танзания'], ['uganda-national-flag', 'Уганда'], ['ukraine-national-flag', 'Украина'], ['united-arab-emirates-national-flag', 'Объединённые Арабские Эмираты'], ['united-kingdom-national-flag', 'Соединённое Королевство'], ['united-states-national-flag', 'США'], ['uruguay-national-flag', 'Уругвай'], ['uzbekistan-national-flag', 'Узбекистан'], ['thailand-national-flag', 'Таиланд'], ['timor-leste-national-flag', 'Тимор-Лешти'], ['togo-national-flag', 'Того'], ['trinidad-and-tobago-national-flag', 'Тринидад и Тобаго'], ['tunisia-national-flag', 'Тунис'], ['turkiye-national-flag', 'Турция'], ['turkmenistan-national-flag', 'Туркменистан'], ['spain-state-flag', 'Испания'], ['serbia-state-flag', 'Сербия'], ['somalia-national-flag', 'Сомали'], ['sudan-national-flag', 'Судан'], ['suriname-national-flag', 'Суринам'], ['sweden-national-flag', 'Швеция'], ['senegal-national-flag', 'Сенегал'], ['seychelles-national-flag', 'Сейшельские Острова'], ['singapore-national-flag', 'Сингапур'], ['sierra-leone-national-flag', 'Сьерра-Леоне'], ['slovakia-state-flag', 'Словакия'], ['slovenia-national-flag', 'Словения'], ['south-africa-national-flag', 'Южная Африка'], ['portugal-national-flag', 'Португалия'], ['qatar-national-flag', 'Катар'], ['romania-national-flag', 'Румыния'], ['rwanda-national-flag', 'Руанда'], ['samoa-national-flag', 'Самоа'], ['san-marino-national-flag', 'Сан-Марино'], ['switzerland-national-flag', 'Швейцария'], ['namibia-national-flag', 'Намибия'], ['nepal-national-flag', 'Непал'], ['new-zealand-national-flag', 'Новая Зеландия'], ['niger-national-flag', 'Нигер'], ['pakistan-national-flag', 'Пакистан'], ['papua-new-guinea-national-flag', 'Папуа-Новая Гвинея'], ['lebanon-national-flag', 'Ливан'], ['liberia-national-flag', 'Либерия'], ['liechtenstein-national-flag', 'Лихтенштейн'], ['luxembourg-national-flag', 'Люксембург'], ['nigeria-national-flag', 'Нигерия'], ['madagascar-national-flag', 'Мадагаскар'], ['malaysia-national-flag', 'Малайзия'], ['maldives-national-flag', 'Мальдивские Острова'], ['mauritius-national-flag', 'Маврикий'], ['moldova-state-flag', 'Республика Молдова'], ['montenegro-state-flag', 'Черногория'], ['morocco-national-flag', 'Марокко'], ['mozambique-national-flag', 'Мозамбик'], ['dominican-republic-national-flag', 'Доминиканская Республика'], ['ecuador-state-flag', 'Эквадор'], ['el-salvador-state-flag', 'Сальвадор'], ['equatorial-guinea-national-flag', 'Экваториальная Гвинея'], ['ethiopia-national-flag', 'Эфиопия'], ['eritrea-national-flag', 'Эритрея'], ['gabon-national-flag', 'Габон'], ['georgia-national-flag', 'Грузия'], ['gambia-national-flag', 'Гамбия'], ['ghana-national-flag', 'Гана'], ['grenada-national-flag', 'Гренада'], ['guinea-national-flag', 'Гвинея'], ['greece-national-flag', 'Греция'], ['ireland-national-flag', 'Ирландия'], ['italy-national-flag', 'Италия'], ['japan-national-flag', 'Япония'], ['latvia-national-flag', 'Латвия'], ['cyprus-national-flag', 'Кипр'], ['czechia-national-flag', 'Чехия'], ['benin-national-flag', 'Бенин'], ['estonia-national-flag', 'Эстония'], ['finland-state-flag', 'Финляндия'], ['france-national-flag', 'Франция'], ['armenia-national-flag', 'Армения'], ['belgium-national-flag', 'Бельгия'], ['bulgaria-national-flag', 'Болгария'], ['bahamas-national-flag', 'Багамские Острова'], ['congo-national-flag', 'Конго'], ['bolivia-state-flag', 'Боливия'], ['bahrain-national-flag', 'Бахрейн'], ['chad-national-flag', 'Чад'], ['barbados-national-flag', 'Барбадос'], ['antigua-and-barbuda-national-flag', 'Антигуа и Барбуда'], ['bosnia-and-herzegovina-national-flag', 'Босния и Герцеговина'], ['bosnia-and-herzegovina-coat-of-arms', 'Босния и Герцеговина'], ['seongsan-ilchulbong', 'Сонсан-Ильчхульбон'], ['mount-halla', 'Халласан'], ['geomunoreum-lava-tubes', 'Лавовые трубки Гомунорым'], ['mount-kilimanjaro', 'Килиманджаро'], ['lake-baikal', 'Озеро Байкал'], ['namib-sand-sea', 'Намибское песчаное море'], ['sundarbans-bangladesh', 'Мангровые леса Сундарбан'], ['bialowieza-forest', 'Беловежская пуща']]) {
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
