import { expect, test as base, type Page } from '@playwright/test';

// Every test fails on unexpected console errors or uncaught exceptions. Expected 4xx responses
// (bad login, forged token) show up as "Failed to load resource" and are allowed.
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await use(errors);
      expect(errors, 'console errors').toEqual([]);
    },
    { auto: true },
  ],
});

export const API = 'http://localhost:5051';
let counter = 0;
export const uniqueName = (prefix = 'golfer') => `${prefix}_${Date.now().toString(36)}${counter++}`;

export const register = async (page: Page, username = uniqueName()) => {
  await page.goto('/register');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/setup\?welcome=1/);
  return username;
};

export const saveClubs = async (page: Page, clubs: Record<string, number>) => {
  await page.goto('/setup');
  for (const [club, yards] of Object.entries(clubs)) {
    await page.getByLabel(club, { exact: true }).fill(String(yards));
  }
  await page.getByRole('button', { name: 'Save clubs' }).click();
  await expect(page.getByText(/^Saved \d+ clubs?\./)).toBeVisible();
};

export const startRound = async (page: Page, course: string, holes: 9 | 18) => {
  await page.goto('/start');
  await page.getByLabel(/Course name/).fill(course);
  await page.getByText(`${holes} holes`, { exact: true }).click();
  await page.getByRole('button', { name: 'Start round' }).click();
  await expect(page.getByRole('heading', { name: /Hole 1/ })).toBeVisible();
};

// Records `perHole` putts on every remaining hole and finishes the round.
export const playOutWithPutts = async (page: Page, fromHole: number, holes: number, perHole = 1) => {
  for (let hole = fromHole; hole <= holes; hole++) {
    await expect(page.getByRole('heading', { name: new RegExp(`Hole ${hole}\\b`) })).toBeVisible();
    for (let i = 0; i < perHole; i++) await page.getByRole('button', { name: '+ Putt' }).click();
    await page.getByRole('button', { name: hole === holes ? 'Finish & save round' : /Next hole/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'Round saved' })).toBeVisible();
};
