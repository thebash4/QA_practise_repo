/**
 * Bounded polling for asynchronous evaluation runs.
 *
 * The utility observes the public run state instead of using a fixed sleep, fails immediately on
 * terminal application failure, and includes the last known state in timeout diagnostics.
 */
import type { APIRequestContext } from '@playwright/test';
import type { EvaluationRun, EvaluationStatus } from './evaluation-results';

export type EvaluationPollingOptions = {
  timeoutMs?: number;
  intervalMs?: number;
};

const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_INTERVAL_MS = 250;
const TERMINAL_STATUSES: EvaluationStatus[] = ['COMPLETE', 'FAILED'];

/**
 * Polls an evaluation until it reaches `COMPLETE`.
 *
 * @param request API context configured for the Evaluation API.
 * @param runId Server-generated evaluation identifier.
 * @param options Optional timeout and interval overrides for known environment constraints.
 * @returns The completed run returned by the API.
 * @throws When polling fails, the run reaches `FAILED`, or the bounded timeout expires.
 */
export async function pollEvaluationToCompletion(
  request: APIRequestContext,
  runId: string,
  options: EvaluationPollingOptions = {},
): Promise<EvaluationRun> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;

  if (timeoutMs <= 0 || intervalMs < 0) {
    throw new Error(`Invalid polling limits: timeoutMs=${timeoutMs}, intervalMs=${intervalMs}`);
  }

  const startedAt = Date.now();
  let lastRun: EvaluationRun | undefined;

  while (Date.now() - startedAt < timeoutMs) {
    const response = await request.get(`/api/evaluations/${encodeURIComponent(runId)}`);
    const responseBody = await readResponseBody(response);

    if (!response.ok()) {
      throw new Error(
        `Unable to poll evaluation '${runId}': HTTP ${response.status()} ${JSON.stringify(responseBody)}`,
      );
    }

    const run = extractRun(responseBody, runId);
    lastRun = run;

    if (TERMINAL_STATUSES.includes(run.status)) {
      if (run.status === 'FAILED') {
        throw new Error(
          `Evaluation '${runId}' failed after ${Date.now() - startedAt}ms: ${run.error ?? 'no error detail returned'}`,
        );
      }
      return run;
    }

    const remainingMs = timeoutMs - (Date.now() - startedAt);
    // Cap each interval at the remaining budget so a final sleep cannot extend the declared timeout.
    if (remainingMs > 0) await delay(Math.min(intervalMs, remainingMs));
  }

  throw new Error(
    `Evaluation '${runId}' did not complete within ${timeoutMs}ms. ` +
      `Last observed state: ${lastRun ? JSON.stringify(summarizeRun(lastRun)) : 'no successful response'}`,
  );
}

async function readResponseBody(response: { json(): Promise<unknown>; text(): Promise<string> }): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return await response.text();
  }
}

function extractRun(body: unknown, expectedRunId: string): EvaluationRun {
  if (!isRecord(body) || !isRecord(body.run)) {
    throw new Error(`Evaluation '${expectedRunId}' returned an invalid response envelope: ${JSON.stringify(body)}`);
  }

  const run = body.run;
  if (run.id !== expectedRunId || typeof run.status !== 'string' || !isEvaluationStatus(run.status)) {
    throw new Error(`Evaluation '${expectedRunId}' returned an invalid run: ${JSON.stringify(run)}`);
  }

  return run as EvaluationRun;
}

function isEvaluationStatus(value: string): value is EvaluationStatus {
  return ['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function summarizeRun(run: EvaluationRun) {
  return {
    id: run.id,
    status: run.status,
    totalScenarios: run.totalScenarios,
    passedCount: run.passedCount,
    failedCount: run.failedCount,
    resultsCount: Array.isArray(run.results) ? run.results.length : 'invalid',
    updatedAt: run.updatedAt,
    error: run.error,
  };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
