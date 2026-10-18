/** Error-contract coverage for invalid evaluation requests and unsupported API operations. */
import type { APIResponse } from '@playwright/test';
import { expect, test } from '../../fixtures/built-in-evaluation-fixtures';
import {
  BUILT_IN_AGENT_ID,
  BUILT_IN_DATASET_ID,
} from '../../fixtures/built-in-evaluation-fixtures';

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    correlationId: string;
  };
};

async function expectApiError(
  response: APIResponse,
  expectedStatus: number,
  expectedCode: string,
  expectedMessage: string,
): Promise<void> {
  const body = (await response.json()) as ApiErrorBody;

  expect(response.status()).toBe(expectedStatus);
  expect(response.headers()['content-type']).toContain('application/json');
  expect(body).toEqual({
    error: {
      code: expectedCode,
      message: expectedMessage,
      correlationId: expect.any(String),
    },
  });
  expect(body.error.correlationId).not.toBe('');
}

test.describe('Evaluation API errors', { tag: '@negative' }, () => {
  test('rejects an unknown dataset ID', async ({ evaluationApi }) => {
    const response = await evaluationApi.request.post('/api/evaluations', {
      data: { datasetId: 'missing-dataset', agentId: BUILT_IN_AGENT_ID },
    });

    await expectApiError(response, 404, 'DATASET_NOT_FOUND', "Dataset 'missing-dataset' was not found");
  });

  test('rejects an unknown agent ID', async ({ evaluationApi }) => {
    const response = await evaluationApi.request.post('/api/evaluations', {
      data: { datasetId: BUILT_IN_DATASET_ID, agentId: 'missing-agent' },
    });

    await expectApiError(response, 404, 'AGENT_NOT_FOUND', "Agent 'missing-agent' was not found");
  });

  test('rejects a request missing datasetId', async ({ evaluationApi }) => {
    const response = await evaluationApi.request.post('/api/evaluations', {
      data: { agentId: BUILT_IN_AGENT_ID },
    });

    await expectApiError(response, 400, 'INVALID_REQUEST', 'datasetId and agentId are required');
  });

  test('rejects a request missing agentId', async ({ evaluationApi }) => {
    const response = await evaluationApi.request.post('/api/evaluations', {
      data: { datasetId: BUILT_IN_DATASET_ID },
    });

    await expectApiError(response, 400, 'INVALID_REQUEST', 'datasetId and agentId are required');
  });

  test('rejects an empty request object', async ({ evaluationApi }) => {
    const response = await evaluationApi.request.post('/api/evaluations', { data: {} });

    await expectApiError(response, 400, 'INVALID_REQUEST', 'datasetId and agentId are required');
  });

  test('rejects an array request payload', async ({ evaluationApi }) => {
    const response = await evaluationApi.request.post('/api/evaluations', { data: [] });

    await expectApiError(response, 400, 'INVALID_REQUEST', 'datasetId and agentId are required');
  });

  test('rejects malformed JSON', async ({ evaluationApi }) => {
    const response = await evaluationApi.request.post('/api/evaluations', {
      headers: { 'content-type': 'application/json' },
      data: '{"datasetId":',
    });

    await expectApiError(response, 400, 'MALFORMED_JSON', 'The request body contains malformed JSON');
  });

  test('returns a JSON error for an unsupported method', async ({ evaluationApi }) => {
    const response = await evaluationApi.request.fetch('/api/datasets', {
      method: 'PUT',
      data: {},
    });

    await expectApiError(response, 404, 'ROUTE_NOT_FOUND', 'The requested endpoint does not exist');
  });

  test('returns a JSON error for an unknown evaluation run', async ({ evaluationApi }) => {
    const response = await evaluationApi.request.get('/api/evaluations/not-a-real-run');

    await expectApiError(response, 404, 'RUN_NOT_FOUND', "Evaluation 'not-a-real-run' was not found");
  });

  test('rejects an unsupported result-status filter', async ({ evaluationApi, builtInRun }) => {
    const response = await evaluationApi.getResultsResponse(builtInRun.id, 'UNKNOWN');

    await expectApiError(response, 400, 'INVALID_STATUS', 'status must be one of: PASSED, FAILED');
  });
});
