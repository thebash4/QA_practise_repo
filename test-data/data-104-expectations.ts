/**
 * Stable DATA-104 scenario membership and count expectations from the approved test plan.
 *
 * Runtime fixtures must still verify these intended partitions against evaluator output before
 * downstream filtering tests use them; `pass` and `fail` identifiers alone are not evidence.
 */
export const DATA_104_AGENT_ID = 'deterministic-order-agent-v1';

export const DATA_104_PASSING_SCENARIO_IDS = [
  'data104-pass-01',
  'data104-pass-02',
  'data104-pass-03',
  'data104-pass-04',
  'data104-pass-05',
  'data104-pass-06',
  'data104-pass-07',
  'data104-pass-08',
  'data104-pass-09',
  'data104-pass-10',
  'data104-pass-11',
  'data104-pass-12',
] as const;

export const DATA_104_FAILING_SCENARIO_IDS = [
  'data104-fail-01',
  'data104-fail-02',
  'data104-fail-03',
  'data104-fail-04',
  'data104-fail-05',
  'data104-fail-06',
  'data104-fail-07',
  'data104-fail-08',
] as const;

export const DATA_104_ALL_SCENARIO_IDS = [
  ...DATA_104_PASSING_SCENARIO_IDS,
  ...DATA_104_FAILING_SCENARIO_IDS,
] as const;

export const DATA_104_EXPECTED_COUNTS = {
  total: DATA_104_ALL_SCENARIO_IDS.length,
  passed: DATA_104_PASSING_SCENARIO_IDS.length,
  failed: DATA_104_FAILING_SCENARIO_IDS.length,
} as const;

export const DATA_104_ALL_PASS_SCENARIO_IDS = ['data104-all-pass-01'] as const;

export const DATA_104_ALL_PASS_EXPECTED_COUNTS = {
  total: DATA_104_ALL_PASS_SCENARIO_IDS.length,
  passed: DATA_104_ALL_PASS_SCENARIO_IDS.length,
  failed: 0,
} as const;
