/** Cross-layer regression check proving the UI presents the completed API run consistently. */
import { expect, test } from '../../fixtures/api-fixtures';
import { EvaluationPage } from '../../pages/evaluation-page';

test.describe('Evaluation UI and API consistency', { tag: '@regression' }, () => {
  test('shows the same passed count returned by the completed API run', async ({
    page,
    evaluationApi,
  }) => {
    const evaluationPage = new EvaluationPage(page);
    await evaluationPage.navigateToEvaluationPage();
    const createdResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/evaluations',
    );

    await evaluationPage.clickStartButton();
    const response = await createdResponse;
    const body = (await response.json()) as { run: { id: string } };
    const completedRun = await evaluationApi.pollToCompletion(body.run.id);

    await expect(evaluationPage.completeStatus).toBeVisible();
    await expect(evaluationPage.passedCount).toHaveText(String(completedRun.passedCount));
  });
});
