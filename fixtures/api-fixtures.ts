/**
 * Shared Playwright API client and worker-scoped request context for EvalForge.
 *
 * API tests use a dedicated base URL because Playwright's global `baseURL` points at the UI.
 * The client keeps transport/status validation reusable while individual tests own the
 * business assertions for the behavior they cover.
 */
import {
  request as playwrightRequest,
  test as base,
  type APIRequestContext,
  type APIResponse,
} from '@playwright/test';
import { pollEvaluationToCompletion } from '../utils/evaluation-polling';
import type {
  AgentSummary,
  DatasetImport,
  DatasetSummary,
  EvaluationResultsResponse,
  EvaluationRun,
  ResultFilter,
} from '../utils/evaluation-results';

const EVALUATION_API_URL = process.env.EVALFORGE_BASE_URL ?? 'http://localhost:3000';

export type HealthResponse = {
  status: string;
  service: string;
};

type ApiWorkerFixtures = {
  evaluationApi: EvaluationApi;
};

/** Wraps stable public Evaluation API operations used across API and integration tests. */
export class EvaluationApi {
  constructor(readonly request: APIRequestContext) {}

  async getHealth(): Promise<HealthResponse> {
    const response = await this.request.get('/health');
    return requireJsonStatus<HealthResponse>(response, 200, 'get API health');
  }

  async listDatasets(): Promise<DatasetSummary[]> {
    const response = await this.request.get('/api/datasets');
    const body = await requireJsonStatus<{ datasets: DatasetSummary[] }>(response, 200, 'list datasets');
    return body.datasets;
  }

  async importDataset(dataset: DatasetImport): Promise<DatasetSummary> {
    const response = await this.request.post('/api/datasets', { data: dataset });
    const body = await requireJsonStatus<{ dataset: DatasetSummary }>(
      response,
      201,
      `import dataset '${dataset.id}'`,
    );

    if (body.dataset.id !== dataset.id || body.dataset.scenarioCount !== dataset.scenarios.length) {
      throw new Error(
        `Import response for dataset '${dataset.id}' did not match the request: ${JSON.stringify(body.dataset)}`,
      );
    }
    return body.dataset;
  }

  async listAgents(): Promise<AgentSummary[]> {
    const response = await this.request.get('/api/agents');
    const body = await requireJsonStatus<{ agents: AgentSummary[] }>(response, 200, 'list agents');
    return body.agents;
  }

  async startEvaluation(datasetId: string, agentId: string): Promise<EvaluationRun> {
    const response = await this.request.post('/api/evaluations', {
      data: { datasetId, agentId },
    });
    const body = await requireJsonStatus<{ run: EvaluationRun }>(
      response,
      202,
      `start evaluation for dataset '${datasetId}'`,
    );

    if (body.run.datasetId !== datasetId || body.run.agentId !== agentId) {
      throw new Error(
        `Created evaluation did not reference dataset '${datasetId}' and agent '${agentId}': ${JSON.stringify(body.run)}`,
      );
    }
    return body.run;
  }

  async getEvaluation(runId: string): Promise<EvaluationRun> {
    const response = await this.request.get(`/api/evaluations/${encodeURIComponent(runId)}`);
    const body = await requireJsonStatus<{ run: EvaluationRun }>(response, 200, `get evaluation '${runId}'`);
    return body.run;
  }

  /** Returns the raw response so negative and contract tests can inspect status, headers, and errors. */
  getResultsResponse(runId: string, status?: string): Promise<APIResponse> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request.get(`/api/evaluations/${encodeURIComponent(runId)}/results${query}`);
  }

  async getResults(runId: string, status?: ResultFilter): Promise<EvaluationResultsResponse> {
    const response = await this.getResultsResponse(runId, status);
    return requireJsonStatus<EvaluationResultsResponse>(
      response,
      200,
      `get ${status ?? 'all'} results for evaluation '${runId}'`,
    );
  }

  /** Polls observable run state within a fixed budget; it never relies on an arbitrary sleep. */
  pollToCompletion(runId: string): Promise<EvaluationRun> {
    return pollEvaluationToCompletion(this.request, runId);
  }
}

/**
 * Base test for API automation. One request context per worker reduces setup overhead while all
 * test-created runs and datasets retain server-generated or collision-resistant identifiers.
 */
export const test = base.extend<{}, ApiWorkerFixtures>({
  evaluationApi: [
    async ({}, use) => {
      const request = await playwrightRequest.newContext({ baseURL: EVALUATION_API_URL });
      await use(new EvaluationApi(request));
      await request.dispose();
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';

async function requireJsonStatus<T>(response: APIResponse, expectedStatus: number, action: string): Promise<T> {
  const body = await readResponseBody(response);
  if (response.status() !== expectedStatus) {
    throw new Error(
      `Failed to ${action}: expected HTTP ${expectedStatus}, received ${response.status()} ${JSON.stringify(body)}`,
    );
  }
  return body as T;
}

async function readResponseBody(response: APIResponse): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return await response.text();
  }
}
