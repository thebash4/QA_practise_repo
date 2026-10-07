import { test as base, expect } from '@playwright/test';
import { EvaluationPage } from '../pages/evaluation-page';

type EvaluationFixtures = {
  evaluationPage: EvaluationPage;
};

// Provide a fresh page object for each test while Playwright manages the underlying page lifecycle.
export const test = base.extend<EvaluationFixtures>({
  evaluationPage: async ({ page }, use) => {
    await use(new EvaluationPage(page));
  },
});

// Re-export expect so tests can import their Playwright utilities from one fixture module.
export { expect };
