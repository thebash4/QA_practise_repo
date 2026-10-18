/**
 * Immutable completed-run fixture for built-in EvalForge workflow assertions.
 *
 * The run is worker-scoped because result-reading tests do not mutate it. Parallel workers still
 * create independent runs, so retries and concurrent Jenkins jobs do not share mutable state.
 */
import { test as apiTest } from './api-fixtures';
import type { EvaluationRun } from '../utils/evaluation-results';

export const BUILT_IN_DATASET_ID = 'order-agent-basics';
export const BUILT_IN_AGENT_ID = 'deterministic-order-agent-v1';

type BuiltInEvaluationWorkerFixtures = {
  builtInRun: EvaluationRun;
};

export const test = apiTest.extend<{}, BuiltInEvaluationWorkerFixtures>({
  builtInRun: [
    async ({ evaluationApi }, use) => {
      const created = await evaluationApi.startEvaluation(BUILT_IN_DATASET_ID, BUILT_IN_AGENT_ID);
      const completed = await evaluationApi.pollToCompletion(created.id);
      await use(completed);
    },
    { scope: 'worker', timeout: 60_000 },
  ],
});

export { expect } from '@playwright/test';
