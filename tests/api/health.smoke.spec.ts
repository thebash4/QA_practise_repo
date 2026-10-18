/** Fast health check for the public Evaluation API boundary. */
import { expect, test } from '../../fixtures/api-fixtures';

test.describe('Evaluation API health', { tag: '@smoke' }, () => {
  test('reports the evaluation API as healthy', async ({ evaluationApi }) => {
    const health = await evaluationApi.getHealth();

    expect(health).toEqual({ status: 'ok', service: 'evaluation-api' });
  });
});
