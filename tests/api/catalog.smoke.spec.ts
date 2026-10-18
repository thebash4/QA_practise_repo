/** Essential discovery checks for datasets and agents required to start an evaluation. */
import { expect, test } from '../../fixtures/api-fixtures';
import {
  BUILT_IN_AGENT_ID,
  BUILT_IN_DATASET_ID,
} from '../../fixtures/built-in-evaluation-fixtures';

test.describe('EvalForge catalog availability', { tag: '@smoke' }, () => {
  test('lists the built-in evaluation dataset', async ({ evaluationApi }) => {
    const datasets = await evaluationApi.listDatasets();

    expect(datasets.map(({ id }) => id)).toContain(BUILT_IN_DATASET_ID);
  });

  test('lists the deterministic order agent', async ({ evaluationApi }) => {
    const agents = await evaluationApi.listAgents();

    expect(agents.map(({ id }) => id)).toContain(BUILT_IN_AGENT_ID);
  });
});
