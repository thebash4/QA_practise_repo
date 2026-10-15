/**
 * Shared DATA-104 API contract types and pure result-processing helpers.
 *
 * These utilities perform no network requests or Playwright assertions, allowing fixtures and API
 * tests to reuse deterministic partition, membership, duplicate, and normalization behavior.
 */
export type EvaluationStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
export type ResultFilter = 'PASSED' | 'FAILED';
export type ToolName = 'getOrders' | 'getOrder' | 'cancelOrder' | 'refundOrder';
export type ExpectedOutcome = 'SUCCESS' | 'REFUSED' | 'NOT_FOUND';

export type Scenario = {
  id: string;
  name: string;
  input: string;
  context: {
    customerId: string;
    orders: Array<{
      id: string;
      status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
      createdAt: string;
    }>;
  };
  expected: {
    tool: ToolName;
    parameters: Record<string, string>;
    outcome: ExpectedOutcome;
  };
};

export type DatasetImport = {
  id: string;
  name: string;
  description: string;
  scenarios: Scenario[];
};

export type DatasetSummary = Omit<DatasetImport, 'scenarios'> & {
  scenarioCount: number;
};

export type AgentSummary = {
  id: string;
  name: string;
  description: string;
};

export type EvaluationResult = {
  scenarioId: string;
  scenarioName: string;
  input: string;
  expected: Scenario['expected'];
  actual: Scenario['expected'] & { response: string };
  passed: boolean;
  explanation: string;
};

export type EvaluationRun = {
  id: string;
  datasetId: string;
  agentId: string;
  status: EvaluationStatus;
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
  results: EvaluationResult[];
};

export type EvaluationResultsResponse = {
  results: EvaluationResult[];
  count: number;
};

export type ResultPartition = {
  passing: EvaluationResult[];
  failing: EvaluationResult[];
};

export type ScenarioIdDifference = {
  missing: string[];
  unexpected: string[];
};

export function getScenarioIds(results: readonly EvaluationResult[]): string[] {
  return results.map(({ scenarioId }) => scenarioId);
}

/** Returns duplicate scenario IDs in stable lexical order for actionable diagnostics. */
export function findDuplicateScenarioIds(results: readonly EvaluationResult[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const scenarioId of getScenarioIds(results)) {
    if (seen.has(scenarioId)) duplicates.add(scenarioId);
    seen.add(scenarioId);
  }

  return [...duplicates].sort();
}

/** Separates results using the evaluator's returned `passed` value without inferring from ID names. */
export function partitionEvaluationResults(results: readonly EvaluationResult[]): ResultPartition {
  return {
    passing: results.filter(({ passed }) => passed),
    failing: results.filter(({ passed }) => !passed),
  };
}

/** Compares ID membership without treating API result ordering as contractual. */
export function compareScenarioIds(
  actualIds: readonly string[],
  expectedIds: readonly string[],
): ScenarioIdDifference {
  const actual = new Set(actualIds);
  const expected = new Set(expectedIds);

  return {
    missing: [...expected].filter((scenarioId) => !actual.has(scenarioId)).sort(),
    unexpected: [...actual].filter((scenarioId) => !expected.has(scenarioId)).sort(),
  };
}

/** Produces a stable snapshot for comparisons while preserving the documented result fields. */
export function normalizeEvaluationResults(results: readonly EvaluationResult[]): EvaluationResult[] {
  return results
    .map((result) => ({
      ...result,
      expected: {
        ...result.expected,
        parameters: sortRecord(result.expected.parameters),
      },
      actual: {
        ...result.actual,
        parameters: sortRecord(result.actual.parameters),
      },
    }))
    .sort((left, right) => left.scenarioId.localeCompare(right.scenarioId));
}

function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
}
