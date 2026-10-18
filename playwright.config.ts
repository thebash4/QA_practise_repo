import { defineConfig } from '@playwright/test';

function configuredRetries(): number {
  const configured = process.env.PLAYWRIGHT_RETRIES;
  if (configured === undefined) return process.env.CI ? 1 : 0;

  const retries = Number(configured);
  if (!Number.isInteger(retries) || retries < 0) {
    throw new Error(`PLAYWRIGHT_RETRIES must be a non-negative integer, received '${configured}'`);
  }
  return retries;
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: configuredRetries(),
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['junit', { outputFile: process.env.PLAYWRIGHT_JUNIT_OUTPUT_NAME ?? 'reports/playwright-results.xml' }],
    ['html', { outputFolder: process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ?? 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.APP_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
