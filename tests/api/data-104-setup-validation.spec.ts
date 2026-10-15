/**
 * Validates the reusable SST-2 datasets and worker fixtures against the real Evaluation API.
 *
 * These setup-validation tests establish trustworthy baselines for later DATA-104 coverage; they
 * are intentionally not classified as product smoke, sanity, or regression tests.
 */
import { expect, test } from '../../fixtures/data-104-fixtures';
import {
  DATA_104_ALL_PASS_EXPECTED_COUNTS,
  DATA_104_ALL_PASS_SCENARIO_IDS,
  DATA_104_ALL_SCENARIO_IDS,
  DATA_104_EXPECTED_COUNTS,
  DATA_104_FAILING_SCENARIO_IDS,
  DATA_104_PASSING_SCENARIO_IDS,
} from '../../test-data/data-104-expectations';
import { getScenarioIds, partitionEvaluationResults } from '../../utils/evaluation-results';

test.describe('SST-2 deterministic test data readiness', { tag: '@setup-validation' }, () => {
  test('DATA-FILTER-20 completes with the exact 12-pass and 8-fail partition', async ({
    data104Run,
    evaluationApi,
  }, testInfo) => {
    // Re-fetch through the public results operation so this spec validates both setup and API reuse.
    const response = await evaluationApi.getResults(data104Run.runId);
    const partition = partitionEvaluationResults(response.results);
    const allIds = getScenarioIds(response.results).sort();
    const passingIds = getScenarioIds(partition.passing).sort();
    const failingIds = getScenarioIds(partition.failing).sort();

    expect(data104Run.run.status, 'evaluation must reach COMPLETE').toBe('COMPLETE');
    expect(data104Run.run.totalScenarios).toBe(DATA_104_EXPECTED_COUNTS.total);
    expect(data104Run.run.passedCount).toBe(DATA_104_EXPECTED_COUNTS.passed);
    expect(data104Run.run.failedCount).toBe(DATA_104_EXPECTED_COUNTS.failed);
    expect(response.count).toBe(DATA_104_EXPECTED_COUNTS.total);
    expect(response.results).toHaveLength(DATA_104_EXPECTED_COUNTS.total);
    expect(allIds).toEqual([...DATA_104_ALL_SCENARIO_IDS].sort());
    expect(passingIds).toEqual([...DATA_104_PASSING_SCENARIO_IDS].sort());
    expect(failingIds).toEqual([...DATA_104_FAILING_SCENARIO_IDS].sort());

    const evidence = {
      datasetId: data104Run.datasetId,
      runId: data104Run.runId,
      status: data104Run.run.status,
      executionTimeMs: Date.parse(data104Run.run.updatedAt) - Date.parse(data104Run.run.createdAt),
      responseCount: response.count,
      passingIds,
      failingIds,
    };
    console.info(`DATA-FILTER-20 evidence: ${JSON.stringify(evidence)}`);
    // Retain the full synthetic response as reviewable evidence without cluttering console output.
    await testInfo.attach('data-filter-20-results.json', {
      body: JSON.stringify(response, null, 2),
      contentType: 'application/json',
    });
  });

  test('DATA-ALL-PASS completes with the exact one-pass and zero-fail partition', async ({
    allPassRun,
    evaluationApi,
  }, testInfo) => {
    const response = await evaluationApi.getResults(allPassRun.runId);
    const partition = partitionEvaluationResults(response.results);
    const allIds = getScenarioIds(response.results).sort();
    const passingIds = getScenarioIds(partition.passing).sort();
    const failingIds = getScenarioIds(partition.failing).sort();

    expect(allPassRun.run.status, 'evaluation must reach COMPLETE').toBe('COMPLETE');
    expect(allPassRun.run.totalScenarios).toBe(DATA_104_ALL_PASS_EXPECTED_COUNTS.total);
    expect(allPassRun.run.passedCount).toBe(DATA_104_ALL_PASS_EXPECTED_COUNTS.passed);
    expect(allPassRun.run.failedCount).toBe(DATA_104_ALL_PASS_EXPECTED_COUNTS.failed);
    expect(response.count).toBe(DATA_104_ALL_PASS_EXPECTED_COUNTS.total);
    expect(response.results).toHaveLength(DATA_104_ALL_PASS_EXPECTED_COUNTS.total);
    expect(allIds).toEqual([...DATA_104_ALL_PASS_SCENARIO_IDS]);
    expect(passingIds).toEqual([...DATA_104_ALL_PASS_SCENARIO_IDS]);
    expect(failingIds).toEqual([]);

    const evidence = {
      datasetId: allPassRun.datasetId,
      runId: allPassRun.runId,
      status: allPassRun.run.status,
      executionTimeMs: Date.parse(allPassRun.run.updatedAt) - Date.parse(allPassRun.run.createdAt),
      responseCount: response.count,
      passingIds,
      failingIds,
    };
    console.info(`DATA-ALL-PASS evidence: ${JSON.stringify(evidence)}`);
    await testInfo.attach('data-all-pass-results.json', {
      body: JSON.stringify(response, null, 2),
      contentType: 'application/json',
    });
  });
});
