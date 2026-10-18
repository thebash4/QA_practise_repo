/** Detailed catalog contracts that protect dataset and agent discovery from schema regressions. */
import { expect, test } from '../../fixtures/api-fixtures';
import {
  BUILT_IN_AGENT_ID,
  BUILT_IN_DATASET_ID,
} from '../../fixtures/built-in-evaluation-fixtures';

test.describe('EvalForge catalog contracts', { tag: '@regression' }, () => {
  test('returns well-formed dataset summaries with unique IDs', async ({ evaluationApi }) => {
    const datasets = await evaluationApi.listDatasets();
    const ids = datasets.map(({ id }) => id);

    expect(datasets.length, 'at least one dataset must be available').toBeGreaterThan(0);
    expect(new Set(ids).size, 'dataset IDs must be unique').toBe(ids.length);
    for (const dataset of datasets) {
      expect(dataset).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        scenarioCount: expect.any(Number),
      });
      expect(dataset.id).not.toBe('');
      expect(dataset.scenarioCount).toBeGreaterThan(0);
    }
  });

  test('preserves the built-in dataset metadata', async ({ evaluationApi }) => {
    const dataset = (await evaluationApi.listDatasets()).find(({ id }) => id === BUILT_IN_DATASET_ID);

    expect(dataset, `dataset '${BUILT_IN_DATASET_ID}' must be present`).toEqual({
      id: BUILT_IN_DATASET_ID,
      name: 'Order Agent Basics',
      description: 'Six deterministic e-commerce order scenarios',
      scenarioCount: 6,
    });
  });

  test('returns well-formed agent summaries with unique IDs', async ({ evaluationApi }) => {
    const agents = await evaluationApi.listAgents();
    const ids = agents.map(({ id }) => id);

    expect(agents.length, 'at least one agent must be available').toBeGreaterThan(0);
    expect(new Set(ids).size, 'agent IDs must be unique').toBe(ids.length);
    for (const agent of agents) {
      expect(agent).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
      });
      expect(agent.id).not.toBe('');
    }
  });

  test('preserves the deterministic agent metadata', async ({ evaluationApi }) => {
    const agent = (await evaluationApi.listAgents()).find(({ id }) => id === BUILT_IN_AGENT_ID);

    expect(agent, `agent '${BUILT_IN_AGENT_ID}' must be present`).toEqual({
      id: BUILT_IN_AGENT_ID,
      name: 'Deterministic Order Agent v1',
      description: 'Rule-based agent for order lookup and cancellation',
    });
  });
});
