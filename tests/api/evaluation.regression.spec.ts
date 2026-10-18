/** Evaluation creation and completed-result contracts verified against the built-in workflow. */
import {
  BUILT_IN_AGENT_ID,
  BUILT_IN_DATASET_ID,
  expect,
  test,
} from '../../fixtures/built-in-evaluation-fixtures';

test.describe('Evaluation contracts', { tag: '@regression' }, () => {
  test('accepts a valid evaluation and returns its resource location', async ({ evaluationApi }) => {
    const response = await evaluationApi.request.post('/api/evaluations', {
      data: { datasetId: BUILT_IN_DATASET_ID, agentId: BUILT_IN_AGENT_ID },
    });
    const body = await response.json();

    expect(response.status()).toBe(202);
    expect(response.headers().location).toBe(`/api/evaluations/${body.run.id}`);
    expect(body.run).toMatchObject({
      id: expect.any(String),
      datasetId: BUILT_IN_DATASET_ID,
      agentId: BUILT_IN_AGENT_ID,
      status: 'PENDING',
      totalScenarios: 6,
      passedCount: 0,
      failedCount: 0,
      results: [],
    });
  });

  test('reports internally consistent completed counters and timestamps', async ({ builtInRun }) => {
    const createdAt = Date.parse(builtInRun.createdAt);
    const updatedAt = Date.parse(builtInRun.updatedAt);

    expect(builtInRun.status).toBe('COMPLETE');
    expect(builtInRun.totalScenarios).toBe(6);
    expect(builtInRun.passedCount + builtInRun.failedCount).toBe(builtInRun.totalScenarios);
    expect(builtInRun.results).toHaveLength(builtInRun.totalScenarios);
    expect(createdAt, 'createdAt must be a valid ISO-compatible timestamp').not.toBeNaN();
    expect(updatedAt, 'updatedAt must be a valid ISO-compatible timestamp').not.toBeNaN();
    expect(updatedAt).toBeGreaterThanOrEqual(createdAt);
  });

  test('returns complete expected and actual fields for every scenario result', async ({ builtInRun }) => {
    for (const result of builtInRun.results) {
      expect(result).toEqual({
        scenarioId: expect.any(String),
        scenarioName: expect.any(String),
        input: expect.any(String),
        expected: {
          tool: expect.any(String),
          parameters: expect.any(Object),
          outcome: expect.any(String),
        },
        actual: {
          tool: expect.any(String),
          parameters: expect.any(Object),
          outcome: expect.any(String),
          response: expect.any(String),
        },
        passed: expect.any(Boolean),
        explanation: expect.any(String),
      });
    }
  });
});
