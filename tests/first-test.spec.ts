// Import Playwright's test function and assertion function.
import { test, expect } from '../fixtures/evaluation-fixtures';
import { evaluationData } from '../test-data/evaluation-data';


// Define a test and give it a name.
test('training app loads successfully', async ({ evaluationPage }) => {

    // Navigate to the training app's URL.
    await evaluationPage.navigateToEvaluationPage();

    // Find the heading and verify that the user can see it.
await expect(evaluationPage.evaluationRunHeading).toBeVisible();

// Find the Start evaluation button and click it.
await evaluationPage.clickStartButton();

await expect(evaluationPage.completeStatus).toBeVisible();

// Read the expected result from shared test data to keep this assertion reusable and maintainable.
await expect(evaluationPage.passedCount).toHaveText(evaluationData.expectedPassedCount);

});
