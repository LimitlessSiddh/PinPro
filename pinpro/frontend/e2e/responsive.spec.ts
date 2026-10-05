import { expect } from '@playwright/test';
import { register, test } from './helpers';

const WIDTHS = [375, 768, 1024, 1440];

test('no horizontal overflow and every input is labelled, at all breakpoints', async ({ page }) => {
  await page.goto('/login');
  const pages = ['/login', '/register'];
  await register(page);
  const authed = ['/', '/setup', '/start', '/profile'];

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of authed) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} @${width}px overflows`).toBeLessThanOrEqual(0);
      const unlabelled = await page.evaluate(() =>
        [...document.querySelectorAll('input:not([type=hidden]):not(.sr-only), select')]
          .filter((el) => !(el as HTMLInputElement).labels?.length && !el.getAttribute('aria-label'))
          .map((el) => el.outerHTML.slice(0, 80))
      );
      expect(unlabelled, `${path} @${width}px`).toEqual([]);
    }
  }

  await page.getByRole('button', { name: 'Log out' }).click();
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of pages) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} @${width}px overflows`).toBeLessThanOrEqual(0);
    }
  }
});

test('keyboard users can skip to content and see focus', async ({ page }) => {
  await register(page);
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  const outline = await skip.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).toBe('solid');
});
