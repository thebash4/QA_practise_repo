// Import Playwright's base test and assertion function.
import { test as base, expect } from '@playwright/test';

// Create a test instance that provides a reusable greeting fixture.
export const test = base.extend<{ greeting: string }>({
  // Make the greeting available to any test that requests this fixture.
  greeting: async ({}, use) => {
    await use('hello');
  },
});

// Export expect so tests can import both Playwright utilities from this fixture module.
export { expect };
