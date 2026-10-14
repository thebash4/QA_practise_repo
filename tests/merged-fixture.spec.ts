import { test, expect } from '../fixtures/index';
import { TIMEOUT } from '../utils/timeout';

test('provides greeting and evaluation page fixtures together', async ({
  greeting,
  evaluationPage,
}) => {
  expect(greeting).toBe('hello');

  await evaluationPage.navigateToEvaluationPage();
  await expect(evaluationPage.evaluationRunHeading).toBeVisible({
    timeout: TIMEOUT.medium,
  });
});
