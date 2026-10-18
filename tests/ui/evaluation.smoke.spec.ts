/** User-visible smoke coverage for loading EvalForge and completing its essential workflow. */
import { expect, test } from '../../fixtures/evaluation-fixtures';
import { evaluationData } from '../../test-data/evaluation-data';

test.describe('Evaluation UI essentials', { tag: '@smoke' }, () => {
  test('loads the evaluation page with its primary action', async ({ evaluationPage }) => {
    await evaluationPage.navigateToEvaluationPage();

    await expect(evaluationPage.evaluationRunHeading).toBeVisible();
    await expect(evaluationPage.startButton).toBeVisible();
  });

  test('completes the built-in evaluation workflow', async ({ evaluationPage }) => {
    await evaluationPage.navigateToEvaluationPage();
    await evaluationPage.clickStartButton();

    await expect(evaluationPage.completeStatus).toBeVisible();
    await expect(evaluationPage.passedCount).toHaveText(evaluationData.expectedPassedCount);
  });
});
