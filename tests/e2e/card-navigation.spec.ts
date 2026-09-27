import { expect, test } from '@playwright/test';

test('next and random keep the reader in the same urban catalog', async ({ page }) => {
  await page.goto('/urban-place/urban-new-york-times-square');
  expect(await page.locator('.detail-lower').evaluate(element => element.firstElementChild?.classList.contains('card-navigation'))).toBe(true);
  await page.getByRole('navigation', { name: 'Навигация по карточкам' }).scrollIntoViewIfNeeded();
  await expect(page.getByText('Карточка 1 из 199')).toBeVisible();
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page).toHaveURL(/\/urban-place\/urban-tokyo-shibuya-crossing$/);
  await expect(page.getByText('Карточка 2 из 199')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.getByRole('button', { name: 'Случайная' }).click();
  await expect(page).toHaveURL(/\/urban-place\/urban-/);
  expect(new URL(page.url()).pathname).not.toBe('/urban-place/urban-tokyo-shibuya-crossing');
});

test('travel cards stay within their kind', async ({ page }) => {
  await page.goto('/travel/food-balut');
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page).toHaveURL(/\/travel\/food-hakarl$/);
  await page.goto('/travel/architecture-eifeleva-bashnya');
  await page.getByRole('button', { name: 'Дальше' }).click();
  await expect(page).toHaveURL(/\/travel\/architecture-tadzh-mahal$/);
});

test('the other learning sections offer the next card of the same type', async ({ page }) => {
  const routes = [
    ['/item/mexico-national-flag', '/item/india-national-flag'],
    ['/item/mexico-coat-of-arms', '/item/india-state-emblem'],
    ['/item/grand-canyon', '/item/uluru'],
    ['/capital/capital-algeria-algiers', '/capital/capital-angola-luanda'],
    ['/border/gambia', '/border/lesotho'],
  ];
  for (const [first, second] of routes) {
    await page.goto(first);
    expect(await page.locator('.card-navigation').evaluate(element => {
      const source = document.querySelector('.source-block');
      return source !== null && Boolean(element.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING);
    })).toBe(true);
    await page.getByRole('button', { name: 'Дальше' }).click();
    await expect(page).toHaveURL(new RegExp(`${second}$`));
  }
});

test('navigation buttons fit the required screen widths', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop project sets the complete viewport matrix.');
  for (const width of [360, 390, 430, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/urban-place/urban-new-york-times-square');
    await expect(page.getByRole('button', { name: 'Дальше' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Случайная' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), `overflow at ${width}px`).toBe(false);
  }
});
