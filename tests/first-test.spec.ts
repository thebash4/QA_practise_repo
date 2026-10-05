// Import Playwright's test function and assertion function.
import { test, expect } from '@playwright/test';

// Define a test and give it a name.
test('training app loads successfully', async ({ page }) => {

    // Navigate to the training app's URL.
    await page.goto('http://localhost:5173');

    // Find the heading and verify that the user can see it.
await expect(
    page.getByRole('heading', { name: 'Evaluation run' })
).toBeVisible();

// Find the Start evaluation button and click it.
await page.getByRole('button', { name: 'Start evaluation' }).click();

// const completetext = await page.getByText('Complete', { exact: true });

// await expect(completetext).toBeVisible();

// const Passedarea = await page.getByRole('article').filter({ hasText: 'Passed' });
// const Result = await Passedarea.getByRole('strong').filter({ hasText: '6' });

// await expect(Result).toBeVisible();

const completeStatus = page.getByText('Complete', { exact: true });
await expect(completeStatus).toBeVisible();

const passedCard = page
  .getByRole('article')
  .filter({ hasText: 'Passed' });

const passedCount = passedCard.getByRole('strong');

await expect(passedCount).toHaveText('6');

});