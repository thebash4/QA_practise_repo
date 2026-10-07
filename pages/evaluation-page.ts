import { Page, Locator } from '@playwright/test';

export class EvaluationPage {

    // Declare what locators this Page Object has
  
    private page: Page;
  startButton: Locator;
  evaluationRunHeading: Locator;
  passedCard: Locator;
    completeStatus: Locator;
    passedCount: Locator;

  constructor(page: Page) {

    // Save the browser page
    this.page = page;

    // Create locators using that browser page
    this.startButton =
      this.page.getByRole('button', { name: 'Start evaluation' });

    this.evaluationRunHeading =
      this.page.getByRole('heading', { name: 'Evaluation run' });
  

    this.passedCard = this.page.getByRole('article').filter({ hasText: 'Passed' });

    const evaluationDetailTitleLine = this.page.locator('.title-line').filter({
      has: this.page.getByRole('heading', {
        name: 'Evaluation detail',
        level: 2,
        exact: true,
      }),
    });

    this.completeStatus = evaluationDetailTitleLine.getByText('Complete', {
      exact: true,
    });

    this.passedCount = this.passedCard.getByRole('strong');
  }

  //methods to interact with the page

    async navigateToEvaluationPage() {
    await this.page.goto('http://localhost:5173');
  }

    async clickStartButton() {
    await this.startButton.click();
  } 
}
