import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../test-results/design/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, viewport, path] of [
    ['desktop-home', { width: 1440, height: 1050 }, '/'],
    ['mobile-home', { width: 390, height: 844 }, '/'],
    ['desktop-archive', { width: 1440, height: 1050 }, '/archive/'],
    ['mobile-archive', { width: 390, height: 844 }, '/archive/'],
    ['desktop-about', { width: 1440, height: 1050 }, '/about/'],
  ]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:4321${path}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, output)), fullPage: true });
    console.log(
      JSON.stringify({
        name,
        errors,
        ...(await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          imageLoaded: [...document.images].every(
            (image) => image.complete && image.naturalWidth > 0,
          ),
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
          ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        }))),
      }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
