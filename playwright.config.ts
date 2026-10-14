import { defineConfig } from '@playwright/test';

export default defineConfig({

  // Our Playwright tests live inside the tests folder.
  testDir: './tests',

  // Retry once on CI to absorb environment hiccups; never retry locally so failures surface immediately.
  retries: process.env.CI ? 1 : 0,

  use: {
    // Use localhost for local and Mac-hosted Jenkins runs unless APP_URL overrides it.
    baseURL: process.env.APP_URL ?? 'http://localhost:5173',
    screenshot: 'only-on-failure',
  }

});
