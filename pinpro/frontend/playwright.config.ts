import { defineConfig, devices } from '@playwright/test';

// Runs the real backend against a disposable local database (pinpro_e2e), never production.
const API_PORT = 5051;
const WEB_PORT = 5174;
const DB = process.env.E2E_DATABASE_URL ?? 'postgres://localhost/pinpro_e2e';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../backend',
      url: `http://localhost:${API_PORT}/api/health`,
      env: { DATABASE_URL: DB, PORT: String(API_PORT), NODE_ENV: 'development', JWT_SECRET: 'e2e-secret' },
      reuseExistingServer: false,
    },
    {
      command: `npx vite --mode test --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { VITE_API_URL: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
    },
  ],
});
