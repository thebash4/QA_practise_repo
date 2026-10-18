/** Connected API workflow checks from evaluation creation through filtered completed results. */
import {
  BUILT_IN_AGENT_ID,
  BUILT_IN_DATASET_ID,
  expect,
  test,
} from '../../fixtures/built-in-evaluation-fixtures';

test.describe('Evaluation API workflow', { tag: '@integration' }, () => {
  test('creates and polls a built-in evaluation to completion', async ({ builtInRun }) => {
    expect(builtInRun).toMatchObject({
      datasetId: BUILT_IN_DATASET_ID,
      agentId: BUILT_IN_AGENT_ID,
      status: 'COMPLETE',
      totalScenarios: 6,
      passedCount: 6,
      failedCount: 0,
    });
  });

  test('retrieves the same completed run through its resource URL', async ({ evaluationApi, builtInRun }) => {
    const retrieved = await evaluationApi.getEvaluation(builtInRun.id);

    expect(retrieved).toEqual(builtInRun);
  });

  test('returns all completed results through the results resource', async ({ evaluationApi, builtInRun }) => {
    const response = await evaluationApi.getResults(builtInRun.id);

    expect(response.count).toBe(builtInRun.totalScenarios);
    expect(response.results.map(({ scenarioId }) => scenarioId).sort()).toEqual(
      builtInRun.results.map(({ scenarioId }) => scenarioId).sort(),
    );
  });

  test('partitions completed results with PASSED and FAILED filters', async ({ evaluationApi, builtInRun }) => {
    const passed = await evaluationApi.getResults(builtInRun.id, 'PASSED');
    const failed = await evaluationApi.getResults(builtInRun.id, 'FAILED');

    expect(passed.count).toBe(6);
    expect(passed.results).toHaveLength(6);
    expect(passed.results.every(({ passed: resultPassed }) => resultPassed)).toBe(true);
    expect(failed).toEqual({ results: [], count: 0 });
  });
});
