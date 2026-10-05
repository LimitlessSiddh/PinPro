import { expect } from '@playwright/test';
import { API, playOutWithPutts, register, saveClubs, startRound, test, uniqueName } from './helpers';

test.beforeEach(({ page }) => {
  page.on('dialog', (d) => d.accept()); // confirm() prompts for clear/abandon
});

test('register → onboarding → clubs persist across refresh and direct navigation @mobile', async ({ page }) => {
  await register(page);
  await expect(page.getByText(/Account created/)).toBeVisible();
  // Typing must not remove the banner and shift the fields under the user's finger.
  await page.getByLabel('Driver', { exact: true }).fill('250');
  await expect(page.getByText(/Account created/)).toBeVisible();

  await saveClubs(page, { Driver: 250, '7 Iron': 150, 'Pitching Wedge': 115 });
  await page.reload();
  await expect(page.getByLabel('Driver', { exact: true })).toHaveValue('250');
  await expect(page.getByLabel('7 Iron', { exact: true })).toHaveValue('150');

  // Direct navigation and refresh while authenticated (the original Google bug failed here).
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Your game' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your game' })).toBeVisible();
  await expect(page.getByText('No rounds yet')).toBeVisible();
});

test('invalid club distances are flagged and not saved', async ({ page }) => {
  await register(page);
  await page.getByLabel('Driver', { exact: true }).fill('9000');
  await page.getByLabel('3 Wood', { exact: true }).fill('abc');
  await page.getByRole('button', { name: 'Save clubs' }).click();
  await expect(page.getByText('Fix the highlighted distances before saving.')).toBeVisible();
  await expect(page.getByText(/between 1 and 400 yards/)).toBeVisible();
  await expect(page.getByText(/Use whole yards/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Driver', { exact: true })).toHaveValue('');
});

test('complete 9-hole round with suggestions, resume after refresh, then see it on profile @mobile', async ({ page }) => {
  await register(page);
  await saveClubs(page, { Driver: 250, '7 Iron': 150, 'Pitching Wedge': 115 });

  // Empty course name is rejected (reported bug).
  await page.goto('/start');
  await page.getByText('9 holes', { exact: true }).click();
  await page.getByRole('button', { name: 'Start round' }).click();
  await expect(page.getByText('Enter the course name.')).toBeVisible();

  await page.getByLabel(/Course name/).fill('Test Links');
  await page.getByRole('button', { name: 'Start round' }).click();

  // Suggestions use the saved yardages (boundaries + invalid input).
  const distance = page.getByLabel('Distance to the pin');
  await distance.fill('140');
  await page.getByRole('button', { name: 'Suggest' }).click();
  await expect(page.getByText(/7 Iron.*150 yd club/)).toBeVisible();
  await distance.fill('320');
  await page.getByRole('button', { name: 'Suggest' }).click();
  await expect(page.getByText(/your longest club \(250 yds\)/)).toBeVisible();
  await distance.fill('abc');
  await page.getByRole('button', { name: 'Suggest' }).click();
  await expect(page.getByText(/Use whole yards/)).toBeVisible();

  // Next hole requires a shot.
  await page.getByRole('button', { name: /Next hole/ }).click();
  await expect(page.getByText('Record at least one shot on hole 1 first.')).toBeVisible();

  await distance.fill('140');
  await page.getByRole('button', { name: 'Suggest' }).click();
  await page.getByRole('button', { name: 'Record shot' }).click();
  await page.getByRole('button', { name: '+ Putt' }).click();
  await page.getByRole('button', { name: '+ Putt' }).click();
  await page.getByRole('button', { name: /Next hole/ }).click();

  // The round survives a refresh mid-round.
  await page.reload();
  await expect(page.getByText('Picked up where you left off.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Hole 2/ })).toBeVisible();

  await playOutWithPutts(page, 2, 9, 3); // 3 + 8×3 = 27 strokes on par 36
  await expect(page.getByText('-9')).toBeVisible();

  await page.getByRole('link', { name: 'See your stats' }).click();
  await expect(page.getByRole('heading', { name: 'Round history' })).toBeVisible();
  await expect(page.getByText('Test Links').filter({ visible: true }).first()).toBeVisible();
});

test('18-hole round saves and counts towards the handicap estimate', async ({ page }) => {
  await register(page);
  await startRound(page, 'Long Course', 18);
  await expect(page.getByText(/You haven’t saved any club distances yet/)).toBeVisible();
  await playOutWithPutts(page, 1, 18, 5); // 90 strokes, par 72
  await expect(page.getByText('+18')).toBeVisible();

  await page.goto('/profile');
  await expect(page.getByText('Play 2 more 18-hole rounds')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Long Course' })).toBeVisible();
});

test('logout denies access, and logging in returns to the requested page', async ({ page }) => {
  const username = await register(page);
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Incorrect username or password.')).toBeVisible();

  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/profile/);
});

test('expired or forged session sends the user to login with an explanation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pinpro.session', JSON.stringify({ token: 'forged', user: { id: 1, username: 'x' } }));
  });
  await page.goto('/setup');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(/Your session ended/)).toBeVisible();
});

test('legacy half-session from the old Google bug no longer counts as logged in', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('firebaseToken', 'stale');
    localStorage.setItem('userId', 'undefined');
  });
  await page.goto('/setup');
  await expect(page).toHaveURL(/\/login/);
});

test.describe('Google sign-in (popup stubbed, server response real or simulated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__pinproGoogleToken = 'fake-google-id-token';
    });
  });

  test('a failed server sync shows an error and does not log in', async ({ page }) => {
    await page.route('**/api/auth/sync-firebase-user', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Google sign-in could not be verified. Please try again.' }) })
    );
    await page.goto('/login');
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await expect(page.getByText('Google sign-in could not be verified. Please try again.')).toBeVisible();
    await page.goto('/setup');
    await expect(page).toHaveURL(/\/login/);
  });

  test('a confirmed sync gives full access to setup, play and profile after refresh', async ({ page, request }) => {
    // Use a real backend session so every later request is genuinely authorised.
    const res = await request.post(`${API}/api/auth/register`, { data: { username: uniqueName('google'), password: 'password123' } });
    const session = await res.json();
    await page.route('**/api/auth/sync-firebase-user', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session) })
    );
    await page.goto('/login');
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await expect(page.getByRole('heading', { name: /Let’s set up your bag/ })).toBeVisible();

    for (const [path, heading] of [['/setup', 'Your clubs'], ['/start', 'Play a round'], ['/profile', 'Your game']]) {
      await page.goto(path);
      await page.reload();
      await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    }
  });
});
