/**
 * Provides the DATA-104 API client and worker-scoped evaluation fixtures.
 *
 * Each worker imports collision-resistant dataset copies and exposes results only after the
 * deterministic readiness gate succeeds. The Evaluation API must be reachable through
 * `EVALFORGE_BASE_URL` (default `http://localhost:3000`). The application has no cleanup API,
 * so isolation relies on unique dataset IDs and the service's in-memory lifecycle.
 */
import { randomUUID } from 'node:crypto';
import type { WorkerInfo } from '@playwright/test';
import { test as apiTest, type EvaluationApi } from './api-fixtures';
import allPassDatasetTemplate from '../test-data/data-104-all-pass.json';
import filter20DatasetTemplate from '../test-data/data-104-filter-20.json';
import {
  DATA_104_AGENT_ID,
  DATA_104_ALL_PASS_EXPECTED_COUNTS,
  DATA_104_ALL_PASS_SCENARIO_IDS,
  DATA_104_ALL_SCENARIO_IDS,
  DATA_104_EXPECTED_COUNTS,
  DATA_104_FAILING_SCENARIO_IDS,
  DATA_104_PASSING_SCENARIO_IDS,
} from '../test-data/data-104-expectations';
import {
  compareScenarioIds,
  findDuplicateScenarioIds,
  getScenarioIds,
  normalizeEvaluationResults,
  partitionEvaluationResults,
  type DatasetImport,
  type EvaluationResult,
  type EvaluationRun,
} from '../utils/evaluation-results';

export type VerifiedEvaluationRun = {
  datasetId: string;
  runId: string;
  run: EvaluationRun;
  baselineResults: EvaluationResult[];
  passingIds: string[];
  failingIds: string[];
};

type Data104WorkerFixtures = {
  data104Run: VerifiedEvaluationRun;
  allPassRun: VerifiedEvaluationRun;
};

/**
 * DATA-104 Playwright test instance with worker-scoped API and verified-run fixtures.
 * Worker scope avoids repeating the roughly ten-second baseline evaluation for every read-only test.
 */
export const test = apiTest.extend<{}, Data104WorkerFixtures>({
  data104Run: [
    async ({ evaluationApi }, use, workerInfo) => {
      const dataset = prepareDataset(
        filter20DatasetTemplate as unknown as DatasetImport,
        DATA_104_ALL_SCENARIO_IDS,
        workerInfo,
      );
      await evaluationApi.importDataset(dataset);
      const createdRun = await evaluationApi.startEvaluation(dataset.id, DATA_104_AGENT_ID);
      const completedRun = await evaluationApi.pollToCompletion(createdRun.id);
      const verifiedRun = verifyCompletedRun(
        completedRun,
        dataset.id,
        DATA_104_EXPECTED_COUNTS,
        DATA_104_PASSING_SCENARIO_IDS,
        DATA_104_FAILING_SCENARIO_IDS,
      );
      await use(verifiedRun);
    },
    { scope: 'worker', timeout: 60_000 },
  ],

  allPassRun: [
    async ({ evaluationApi }, use, workerInfo) => {
      const dataset = prepareDataset(
        allPassDatasetTemplate as unknown as DatasetImport,
        DATA_104_ALL_PASS_SCENARIO_IDS,
        workerInfo,
      );
      await evaluationApi.importDataset(dataset);
      const createdRun = await evaluationApi.startEvaluation(dataset.id, DATA_104_AGENT_ID);
      const completedRun = await evaluationApi.pollToCompletion(createdRun.id);
      const verifiedRun = verifyCompletedRun(
        completedRun,
        dataset.id,
        DATA_104_ALL_PASS_EXPECTED_COUNTS,
        DATA_104_ALL_PASS_SCENARIO_IDS,
        [],
      );
      await use(verifiedRun);
    },
    { scope: 'worker', timeout: 60_000 },
  ],
});

export { expect } from '@playwright/test';

function prepareDataset(
  template: DatasetImport,
  expectedScenarioIds: readonly string[],
  workerInfo: WorkerInfo,
): DatasetImport {
  const actualScenarioIds = template.scenarios.map(({ id }) => id);
  assertExactIds(`${template.name} source template`, actualScenarioIds, expectedScenarioIds);

  return {
    ...template,
    id: createUniqueDatasetId(template.id, workerInfo),
  };
}

function createUniqueDatasetId(templateId: string, workerInfo: WorkerInfo): string {
  // Worker coordinates aid diagnosis; the UUID prevents collisions across retries, shards, and concurrent jobs.
  return `${templateId}-p${workerInfo.parallelIndex}-w${workerInfo.workerIndex}-${randomUUID()}`;
}

function verifyCompletedRun(
  run: EvaluationRun,
  expectedDatasetId: string,
  expectedCounts: { total: number; passed: number; failed: number },
  expectedPassingIds: readonly string[],
  expectedFailingIds: readonly string[],
): VerifiedEvaluationRun {
  // Do not expose a baseline to filtering tests until counts and exact membership match the approved manifest.
  const errors: string[] = [];
  const results = Array.isArray(run.results) ? run.results : [];
  const duplicates = findDuplicateScenarioIds(results);
  const partition = partitionEvaluationResults(results);
  const allExpectedIds = [...expectedPassingIds, ...expectedFailingIds];

  if (run.status !== 'COMPLETE') errors.push(`status was ${run.status}, expected COMPLETE`);
  if (run.datasetId !== expectedDatasetId) {
    errors.push(`datasetId was '${run.datasetId}', expected '${expectedDatasetId}'`);
  }
  if (run.totalScenarios !== expectedCounts.total) {
    errors.push(`totalScenarios was ${run.totalScenarios}, expected ${expectedCounts.total}`);
  }
  if (results.length !== expectedCounts.total) {
    errors.push(`results.length was ${results.length}, expected ${expectedCounts.total}`);
  }
  if (run.passedCount !== expectedCounts.passed) {
    errors.push(`passedCount was ${run.passedCount}, expected ${expectedCounts.passed}`);
  }
  if (run.failedCount !== expectedCounts.failed) {
    errors.push(`failedCount was ${run.failedCount}, expected ${expectedCounts.failed}`);
  }
  if (duplicates.length > 0) errors.push(`duplicate scenario IDs: ${duplicates.join(', ')}`);

  appendIdDifference(errors, 'all results', getScenarioIds(results), allExpectedIds);
  appendIdDifference(errors, 'passing results', getScenarioIds(partition.passing), expectedPassingIds);
  appendIdDifference(errors, 'failing results', getScenarioIds(partition.failing), expectedFailingIds);

  if (errors.length > 0) {
    throw new Error(
      `DATA-104 readiness gate failed for evaluation '${run.id}':\n- ${errors.join('\n- ')}\n` +
        `Observed summary: ${JSON.stringify({
          status: run.status,
          totalScenarios: run.totalScenarios,
          passedCount: run.passedCount,
          failedCount: run.failedCount,
          resultIds: getScenarioIds(results),
        })}`,
    );
  }

  return {
    datasetId: expectedDatasetId,
    runId: run.id,
    run,
    baselineResults: normalizeEvaluationResults(results),
    passingIds: getScenarioIds(partition.passing).sort(),
    failingIds: getScenarioIds(partition.failing).sort(),
  };
}

function assertExactIds(label: string, actualIds: readonly string[], expectedIds: readonly string[]): void {
  const errors: string[] = [];
  const duplicates = findDuplicateStrings(actualIds);
  if (duplicates.length > 0) errors.push(`duplicate IDs: ${duplicates.join(', ')}`);
  appendIdDifference(errors, label, actualIds, expectedIds);
  if (errors.length > 0) throw new Error(`${label} is invalid: ${errors.join('; ')}`);
}

function appendIdDifference(
  errors: string[],
  label: string,
  actualIds: readonly string[],
  expectedIds: readonly string[],
): void {
  const difference = compareScenarioIds(actualIds, expectedIds);
  if (difference.missing.length > 0) errors.push(`${label} missing IDs: ${difference.missing.join(', ')}`);
  if (difference.unexpected.length > 0) {
    errors.push(`${label} unexpected IDs: ${difference.unexpected.join(', ')}`);
  }
}

function findDuplicateStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}
