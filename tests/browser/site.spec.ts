import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('the daily edition is complete and its section navigation works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('It starts in the earth');
  await expect(page.getByRole('heading', { name: 'The short answer', exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Rainfall can release aerosols, study finds' }),
  ).toHaveAttribute('href', 'https://news.mit.edu/2015/rainfall-can-release-aerosols-0114');
  await page.getByRole('link', { name: 'Read the story' }).click();
  await expect(page).toHaveURL(/#the-short-answer$/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});
test('search and category filters combine, announce counts, and reset', async ({ page }) => {
  await page.goto('/archive/');
  await expect(page.locator('.archive-entry:visible')).toHaveCount(7);
  await page.getByRole('button', { name: 'Nature', exact: true }).click();
  await expect(page.locator('.archive-entry:visible')).toHaveCount(2);
  await page.getByRole('searchbox').fill('octopus');
  await expect(page.locator('.archive-entry:visible')).toHaveCount(1);
  await expect(page.locator('#result-count')).toHaveText('1 discovery');
  await page.getByRole('searchbox').fill('no-such-topic');
  await expect(page.getByRole('heading', { name: 'No discoveries here yet.' })).toBeVisible();
  await page.getByRole('button', { name: 'Show all discoveries' }).click();
  await expect(page.locator('.archive-entry:visible')).toHaveCount(7);
  await page.getByRole('link', { name: /An octopus has three hearts/ }).click();
  await expect(page).toHaveURL('/discoveries/an-octopus-has-three-hearts/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/discoveries\/an-octopus-has-three-hearts\/$/,
  );
});
test('copy-link fallback uses the permanent article URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (value: string) => {
          (window as unknown as { copiedLink: string }).copiedLink = value;
        },
      },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Share this discovery' }).click();
  await expect(page.getByText('Link copied.', { exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { copiedLink: string }).copiedLink),
  ).toContain('/discoveries/the-smell-of-rain/');
});
test('clipboard failures show a selectable link, cancelled native sharing stays quiet', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('Denied');
        },
      },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Share this discovery' }).click();
  await expect(page.getByRole('textbox', { name: 'Article link' })).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Article link' })).toHaveValue(
    /the-smell-of-rain\/$/,
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'share', {
      value: async () => {
        throw new DOMException('Cancelled', 'AbortError');
      },
      configurable: true,
    }),
  );
  await page.getByRole('button', { name: 'Share this discovery' }).click();
  await expect(page.locator('.share-feedback')).toBeEmpty();
});
test('native sharing receives the article title and permanent URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      value: async (data: { title: string; url: string }) => {
        (window as unknown as { shared: typeof data }).shared = data;
      },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Share this discovery' }).click();
  const shared = await page.evaluate(
    () => (window as unknown as { shared: { title: string; url: string } }).shared,
  );
  expect(shared.title).toContain('It starts in the earth');
  expect(shared.url).toContain('/discoveries/the-smell-of-rain/');
});
test('article and archive stay readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await expect(page.getByRole('heading', { name: 'The short answer', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share this discovery' })).toBeHidden();
  await page.goto('http://127.0.0.1:4321/archive/');
  await expect(page.locator('.archive-entry')).toHaveCount(7);
  await expect(page.getByRole('searchbox')).toBeHidden();
  await context.close();
});
test('keyboard skip link, reduced motion, feeds, and missing pages', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  expect(
    await page.locator('.story-title-group').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await page.goto('/about/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("You don't have to know");
  const rss = await request.get('/rss.xml');
  expect(rss.ok()).toBe(true);
  expect((await rss.text()).match(/<item>/g)).toHaveLength(7);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  expect((await sitemap.text()).match(/<loc>/g)).toHaveLength(10);
  const missing = await page.goto('/discoveries/does-not-exist/');
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'A little off the beaten path.',
  );
});
test('main pages have no detected WCAG A or AA accessibility violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/', '/archive/', '/about/', '/discoveries/an-octopus-has-three-hearts/']) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations, `${route}: ${JSON.stringify(results.violations)}`).toEqual([]);
  }
});
