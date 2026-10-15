# SST-1 / DATA-104 — Evaluation Result Filtering Test Plan

## Document control

- Jira: [SST-1 — DATA-104: Filter Evaluation Results by Status](https://qapractise.atlassian.net/browse/SST-1)
- Jira status at review: To Do
- Jira priority: Medium
- Plan date: 2026-10-15
- Plan status: Approved replacement
- Automation stack: Playwright Test with TypeScript
- Scope: API, UI, integration/E2E, and focused regression
- Test implementation: Not included in this planning task

## Objective

Verify that users can filter an evaluation's results by All, Passed, or Failed; that returned and displayed records and counts are correct; that filtering never mutates evaluation data; and that loading, recovery, refresh, and rapid-switch behavior remain reliable.

## Requirement summary

### Confirmed from SST-1

- Public endpoint: `GET /api/evaluations/:id/results`.
- Internal endpoint: `GET /runs/:id/results`.
- No `status` parameter returns all results.
- `status=PASSED` returns only records with `passed === true`.
- `status=FAILED` returns only records with `passed === false`.
- A successful response has `{ "results": [...], "count": N }`.
- `count` equals the returned array length.
- A valid filter with no matches returns HTTP 200, empty results, and count 0.
- Invalid, empty, or incorrectly cased status returns HTTP 400 with `INVALID_STATUS`.
- An unknown evaluation ID returns HTTP 404 with `RUN_NOT_FOUND`.
- Filtering must not modify persisted or in-memory results.
- The UI provides All, Passed, and Failed controls.
- The UI shows the selected filter's results and count.
- The UI supports loading, empty, error, and retry states.
- Obsolete requests must not overwrite the latest filter selection.
- Results refresh when an active evaluation's `updatedAt` changes.
- Existing dataset import and evaluation behavior must remain functional.

## Repository implementation guidance

- Direct API tests belong under `tests/api/` and use Playwright `APIRequestContext`.
- Individual browser behavior belongs under `tests/ui/`.
- The complete import/evaluation/filter workflow belongs under `tests/e2e/`.
- Reusable locators and UI interactions belong under `pages/`.
- Reusable setup and API dependencies belong under `fixtures/`.
- Deterministic records and expected ID partitions belong under `test-data/`.
- Do not extend the legacy Python/pytest suite.
- Reuse existing TypeScript assets where suitable.
- Obtain approval before modifying shared fixtures, the existing Page Object, Playwright configuration, or CI.

## Required test data

### DATA-FILTER-20

A controlled, source-controlled JSON dataset containing exactly 20 uniquely identifiable scenarios:

- 12 deterministic passing scenario IDs.
- 8 deterministic failing scenario IDs.
- Stable names, inputs, expected values, and outcomes.
- No duplicate scenario IDs.

The source-controlled template uses top-level dataset ID `data-filter-20`. At runtime, setup must clone the document and replace only the top-level dataset ID with a collision-resistant worker-specific value. Scenario IDs and all scenario content remain stable.

The completed run's actual 12/8 partition must be verified before those expected IDs are used in filter assertions. Intended `pass` or `fail` naming is not sufficient evidence.

#### Source-verified scenario manifest

The following manifest is derived from the adjacent application's deterministic agent and evaluator source. Order notation is `id / status / createdAt`. Expected and actual notation is `tool(parameters) / outcome`. Every JSON scenario also requires the displayed stable ID, a non-empty descriptive name, the exact input, the listed `customerId` and `orders`, and the listed `expected` object.

| Stable scenario ID | Input and context | Expected value stored in dataset | Source-derived actual value | Intended result |
|---|---|---|---|---|
| `data104-pass-01` | `Show order 101.`; `C-101`; `101 / PROCESSING / 2026-01-01T10:00:00Z` | `getOrder({orderId: "101"}) / SUCCESS` | Same as expected | PASS |
| `data104-pass-02` | `Show order 102.`; `C-102`; `102 / SHIPPED / 2026-01-02T10:00:00Z` | `getOrder({orderId: "102"}) / SUCCESS` | Same as expected | PASS |
| `data104-pass-03` | `Show order 103.`; `C-103`; `103 / DELIVERED / 2026-01-03T10:00:00Z` | `getOrder({orderId: "103"}) / SUCCESS` | Same as expected | PASS |
| `data104-pass-04` | `Show my latest order.`; `C-104`; `1041 / DELIVERED / 2026-01-01T10:00:00Z`, `1042 / SHIPPED / 2026-01-02T10:00:00Z` | `getOrder({orderId: "1042"}) / SUCCESS` | Same as expected | PASS |
| `data104-pass-05` | `Cancel order 105.`; `C-105`; `105 / PROCESSING / 2026-01-05T10:00:00Z` | `cancelOrder({orderId: "105"}) / SUCCESS` | Same as expected | PASS |
| `data104-pass-06` | `Cancel my latest order.`; `C-106`; `1061 / SHIPPED / 2026-01-01T10:00:00Z`, `1062 / PROCESSING / 2026-01-02T10:00:00Z` | `cancelOrder({orderId: "1062"}) / SUCCESS` | Same as expected | PASS |
| `data104-pass-07` | `Cancel order 107.`; `C-107`; `107 / SHIPPED / 2026-01-07T10:00:00Z` | `cancelOrder({orderId: "107"}) / REFUSED` | Same as expected | PASS |
| `data104-pass-08` | `Cancel order 108.`; `C-108`; `108 / DELIVERED / 2026-01-08T10:00:00Z` | `cancelOrder({orderId: "108"}) / REFUSED` | Same as expected | PASS |
| `data104-pass-09` | `Show my latest order.`; `C-109`; no orders | `getOrders({customerId: "C-109"}) / NOT_FOUND` | Same as expected | PASS |
| `data104-pass-10` | `Show order 999.`; `C-110`; `110 / PROCESSING / 2026-01-10T10:00:00Z` | `getOrders({customerId: "C-110"}) / NOT_FOUND` | Same as expected because explicit order `999` is absent | PASS |
| `data104-pass-11` | `Cancel order 999.`; `C-111`; `111 / PROCESSING / 2026-01-11T10:00:00Z` | `getOrders({customerId: "C-111"}) / NOT_FOUND` | Same as expected because missing-order handling precedes cancel handling | PASS |
| `data104-pass-12` | `Where is my latest purchase?`; `C-112`; `112 / SHIPPED / 2026-01-12T10:00:00Z` | `getOrder({orderId: "112"}) / SUCCESS` | Same as expected | PASS |
| `data104-fail-01` | `Show order 201.`; `C-201`; `201 / PROCESSING / 2026-02-01T10:00:00Z` | `cancelOrder({orderId: "201"}) / SUCCESS` | `getOrder({orderId: "201"}) / SUCCESS` | FAIL: tool |
| `data104-fail-02` | `Show order 202.`; `C-202`; `202 / SHIPPED / 2026-02-02T10:00:00Z` | `getOrder({orderId: "999"}) / SUCCESS` | `getOrder({orderId: "202"}) / SUCCESS` | FAIL: parameters |
| `data104-fail-03` | `Show order 203.`; `C-203`; `203 / DELIVERED / 2026-02-03T10:00:00Z` | `getOrder({orderId: "203"}) / REFUSED` | `getOrder({orderId: "203"}) / SUCCESS` | FAIL: outcome |
| `data104-fail-04` | `Cancel order 204.`; `C-204`; `204 / PROCESSING / 2026-02-04T10:00:00Z` | `refundOrder({orderId: "204"}) / SUCCESS` | `cancelOrder({orderId: "204"}) / SUCCESS` | FAIL: tool |
| `data104-fail-05` | `Cancel order 205.`; `C-205`; `205 / SHIPPED / 2026-02-05T10:00:00Z` | `cancelOrder({orderId: "205"}) / SUCCESS` | `cancelOrder({orderId: "205"}) / REFUSED` | FAIL: outcome |
| `data104-fail-06` | `Show my latest order.`; `C-206`; no orders | `getOrders({customerId: "C-WRONG"}) / NOT_FOUND` | `getOrders({customerId: "C-206"}) / NOT_FOUND` | FAIL: parameters |
| `data104-fail-07` | `Show my latest order.`; `C-207`; `2071 / PROCESSING / 2026-02-01T10:00:00Z`, `2072 / SHIPPED / 2026-02-02T10:00:00Z` | `getOrder({orderId: "2071"}) / SUCCESS` | `getOrder({orderId: "2072"}) / SUCCESS` | FAIL: parameters |
| `data104-fail-08` | `Cancel order 208.`; `C-208`; `208 / DELIVERED / 2026-02-08T10:00:00Z` | `getOrder({orderId: "208"}) / SUCCESS` | `cancelOrder({orderId: "208"}) / REFUSED` | FAIL: tool and outcome |

Use these exact non-empty scenario names, in ID order: `Lookup processing order`, `Lookup shipped order`, `Lookup delivered order`, `Lookup latest order`, `Cancel processing order`, `Cancel latest processing order`, `Refuse shipped cancellation`, `Refuse delivered cancellation`, `No orders found`, `Explicit lookup order not found`, `Explicit cancellation order not found`, `Lookup latest purchase phrasing`, `Tool mismatch on lookup`, `Parameter mismatch on lookup`, `Outcome mismatch on lookup`, `Tool mismatch on cancellation`, `Outcome mismatch on shipped cancellation`, `Customer parameter mismatch with no orders`, `Latest-order parameter mismatch`, and `Tool and outcome mismatch on delivered cancellation`.

The exact passing-ID set is `data104-pass-01` through `data104-pass-12`. The exact failing-ID set is `data104-fail-01` through `data104-fail-08`.

### DATA-ALL-PASS

A source-controlled dataset with top-level template ID `data-all-pass` and one scenario:

- Stable scenario ID: `data104-all-pass-01`.
- Input: `Show order 301.`.
- Context: customer `C-301` with order `301 / PROCESSING / 2026-03-01T10:00:00Z`.
- Expected: `getOrder({ "orderId": "301" }) / SUCCESS`.
- Source-derived actual: identical to expected, producing PASS.

Runtime setup applies the same unique top-level dataset-ID strategy used for DATA-FILTER-20. The completed run must contain exactly the expected single passing ID and zero failed records before it is used for no-match assertions.

### Other data

- A syntactically valid but nonexistent evaluation ID.
- A unique run per worker or test flow where mutation or parallel interference is possible.
- Controlled contract-shaped responses for loading, error, retry, refresh, and out-of-order UI scenarios.

## Source-verified technical contracts

These contracts were verified by source inspection of `../snorkel-training-app`. SST-2 subsequently exercised the public dataset import and evaluation lifecycle against the local application: DATA-FILTER-20 completed with 20 unique results partitioned into 12 PASS and 8 FAIL, DATA-ALL-PASS completed with 1 PASS and 0 FAIL, and both setup-validation tests passed. Filter-specific SST-3 behavior remains planned rather than implemented.

Primary source evidence:

- `shared/src/index.ts:4-24` — domain types and response contracts.
- `services/dataset-service/src/index.ts:30-133` — import validation, duplicate handling, storage, and response.
- `services/agent-service/src/index.ts:8-31` — registered agent and deterministic execution rules.
- `services/evaluator-service/src/index.ts:8-24` — exact comparison and PASS/FAIL calculation.
- `services/evaluation-api/src/index.ts:21-78` — import proxy and asynchronous evaluation orchestration.
- `services/results-service/src/index.ts:9-60` — in-memory run storage, filtering, counters, and `updatedAt` changes.
- `frontend/src/App.tsx:93-117` — default filter, request cancellation, loading/error/empty/retry states, and refresh dependencies.

### Dataset import

- Public import is `POST /api/datasets` with `Content-Type: application/json`. It proxies the payload unchanged to Dataset Service `POST /datasets`.
- Success is HTTP 201 with `{ "dataset": { "id", "name", "description", "scenarioCount" } }`.
- The exact top-level keys are `id`, `name`, `description`, and `scenarios`; unknown properties are rejected.
- `id` is caller-assigned, non-empty, at most 128 characters, starts with an alphanumeric character, and otherwise allows letters, numbers, periods, underscores, and hyphens.
- `name` is non-empty, `description` is a string, and `scenarios` is a non-empty array.
- A scenario has only `id`, `name`, `input`, `context`, and `expected`. Its first three fields are non-empty strings.
- `context` has only a non-empty `customerId` and an `orders` array. Each order has only a non-empty `id`, `status`, and `createdAt`; status is `PROCESSING`, `SHIPPED`, or `DELIVERED`; timestamps must be normalized ISO-8601 UTC values.
- `expected` has only `tool`, `parameters`, and `outcome`. Tool is `getOrders`, `getOrder`, `cancelOrder`, or `refundOrder`; every parameter value is a string; outcome is `SUCCESS`, `REFUSED`, or `NOT_FOUND`.
- Duplicate scenario IDs within one payload return HTTP 400 `INVALID_DATASET`. Reusing an existing dataset ID returns HTTP 409 `DATASET_ALREADY_EXISTS`.
- Malformed JSON returns HTTP 400 `MALFORMED_JSON`; invalid documents return HTTP 400 `INVALID_DATASET`; requests over the configured limit return HTTP 413 `PAYLOAD_TOO_LARGE`.
- Imported datasets are held in memory and have no update or delete endpoint.

### Deterministic agent

`deterministic-order-agent-v1` applies these rules in order:

1. Lowercase the input and extract the first explicit numeric ID matching `order <digits>`.
2. If an explicit ID exists, select the context order with that exact ID; otherwise select the order with the lexicographically greatest normalized `createdAt` timestamp.
3. If no order is selected, return `getOrders`, `{ customerId }`, and `NOT_FOUND`. This occurs before cancel-intent handling.
4. If the input contains `cancel` and the selected order is `PROCESSING`, return `cancelOrder`, `{ orderId }`, and `SUCCESS`.
5. If the input contains `cancel` and the selected order is `SHIPPED` or `DELIVERED`, return `cancelOrder`, `{ orderId }`, and `REFUSED`.
6. Otherwise return `getOrder`, `{ orderId }`, and `SUCCESS`.

The generated customer response is deterministic but is not part of PASS/FAIL evaluation.

### Evaluator comparison

- Tool and outcome use case-sensitive exact equality.
- Parameters are compared as sorted top-level key/value entries. Property order is ignored; any missing key, extra key, different key, or different string value fails the parameter check.
- PASS requires all three checks—tool, parameters, and outcome—to succeed. Any failed check produces FAIL.
- Scenario name, input, context, and generated response do not determine PASS/FAIL.

### Evaluation lifecycle and filtering

- Start evaluation with `POST /api/evaluations` and `{ "datasetId", "agentId" }`; success is HTTP 202 with a `Location` header and `{ "run": ... }`.
- Processing is asynchronous and sequential. The default source delay is 500 ms per scenario unless `SCENARIO_DELAY_MS` overrides it.
- Retrieve one run through `GET /api/evaluations/:id`. Run states are `PENDING`, `RUNNING`, `COMPLETE`, and `FAILED`.
- `updatedAt` changes when each result is stored and whenever run status changes.
- Public result filtering proxies to Results Service. Unknown-run validation occurs before filter validation. Successful filtering returns a new array and does not mutate the stored run.
- Results and datasets are held in service memory. Run IDs are server-generated UUIDs. No supported run or dataset deletion endpoint exists.

## SST-2 implementation architecture

The minimum maintainable setup is:

- `test-data/data-104-filter-20.json`: the source-controlled 20-scenario template defined above.
- `test-data/data-104-all-pass.json`: the source-controlled one-scenario all-pass template.
- `test-data/data-104-expectations.ts`: total counts and exact stable all/passing/failing ID arrays. It must not contain fixed run IDs or runtime dataset IDs.
- `fixtures/data-104-fixtures.ts`: a dedicated fixture module, imported only by DATA-104 tests rather than merged into the existing global fixture index. It creates an API request context using the Evaluation API URL, imports a cloned dataset with a unique worker-specific top-level ID, starts a run, waits for completion, and exposes the verified run metadata and baseline snapshot.
- `utils/evaluation-polling.ts`: bounded polling of `GET /api/evaluations/:id`; return on `COMPLETE`, fail immediately on `FAILED`, and report the last observed state on timeout.
- `utils/evaluation-results.ts`: pure helpers for unique-ID validation, pass/fail partitioning, stable ID-set comparison, and normalization of documented stable result fields. Assertions remain in test files and fixture readiness checks.

No new dependency, Playwright configuration, CI change, or change to `fixtures/index.ts` is required. Creating the dedicated reusable fixture and utilities requires explicit approval under `AGENTS.md`. DATA-104 filter locators and interactions are not present in the existing Page Object; those additions belong to SST-4 and require separate approval.

### Mandatory completed-run readiness gate

Before any SST-3, SST-4 real-backend, or SST-5 filter assertion uses DATA-FILTER-20, setup must assert all of the following:

1. The run reached `COMPLETE`; a `FAILED` state fails setup immediately.
2. `totalScenarios === 20`, `results.length === 20`, and all 20 scenario IDs are unique.
3. `passedCount === 12` and `failedCount === 8`.
4. The actual passing-ID set exactly equals `data104-pass-01` through `data104-pass-12`.
5. The actual failing-ID set exactly equals `data104-fail-01` through `data104-fail-08`.
6. The union contains no missing or unexpected ID.

The all-pass fixture applies the equivalent exact-ID and zero-failure gate to `data104-all-pass-01`.

### Isolation and cleanup

- Clone each source-controlled dataset and generate a unique top-level dataset ID per worker/import using worker identity plus a collision-resistant suffix. Do not change stable scenario IDs.
- Do not rely on the existing timestamp-only test ID helper for parallel isolation.
- A completed worker-scoped run may be reused by read-only API and UI happy-path tests to avoid repeating the approximately ten-second default DATA-FILTER-20 evaluation. Tests that validate import or run creation must create their own resource.
- Never invent or call a destructive cleanup route. Because cleanup is unsupported, retain test-created resources and rely on unique IDs; service restart clears the in-memory stores.

## Test scenarios

### API-01 — Retrieve all completed evaluation results

- **Layer:** API
- **Priority:** P0
- **Suite:** PR smoke
- **Related acceptance criteria:** AC1, AC7
- **Preconditions:**
  - DATA-FILTER-20 has been imported.
  - A new evaluation has completed successfully.
  - Its actual result partition has been verified as 20 total, 12 passed, and 8 failed.
- **Test data:** The completed DATA-FILTER-20 run ID and verified complete result snapshot.
- **Steps:**
  1. Send `GET /api/evaluations/{runId}/results` without a `status` query parameter.
  2. Parse the response body.
  3. Compare returned scenario IDs with the verified completed-run IDs.
  4. Compare returned result objects with the completed evaluation's result snapshot.
- **Expected results and assertions:**
  - HTTP status is 200.
  - The body contains `results` as an array and `count` as a number.
  - `count` is 20 and equals `results.length`.
  - Exactly 20 unique expected scenario IDs are returned.
  - Exactly 12 records have `passed: true`, and exactly 8 have `passed: false`.
  - Required result fields and their data types match the verified contract.
  - Result content matches the pre-filter snapshot.
- **Cleanup:** Remove only the run or dataset created by the test if a supported cleanup API exists; otherwise use isolated identifiers and retain the resource.
- **Failure conditions:** Any missing, duplicate, unexpected, mutated, or incorrectly counted result fails the scenario.

### API-02 — Retrieve only passed results

- **Layer:** API
- **Priority:** P0
- **Suite:** PR smoke
- **Related acceptance criteria:** AC2, AC7
- **Preconditions:** A completed DATA-FILTER-20 run with a verified result partition.
- **Test data:** The run ID and exact verified set of 12 passing scenario IDs.
- **Steps:**
  1. Send `GET /api/evaluations/{runId}/results?status=PASSED`.
  2. Compare returned scenario IDs with the verified passing-ID set.
  3. Compare each returned object with its unfiltered baseline object.
- **Expected results and assertions:**
  - HTTP status is 200.
  - `count` is 12 and equals `results.length`.
  - Every result has `passed: true`.
  - The exact 12 expected passing IDs are present.
  - No failed ID is present.
  - Result objects retain their original field values.
- **Cleanup:** Same isolation and supported-cleanup policy as API-01.
- **Failure conditions:** A wrong member, status, count, or mutated field fails the scenario.

### API-03 — Retrieve only failed results

- **Layer:** API
- **Priority:** P0
- **Suite:** PR smoke
- **Related acceptance criteria:** AC3, AC7
- **Preconditions:** A completed DATA-FILTER-20 run with a verified result partition.
- **Test data:** The run ID and exact verified set of 8 failing scenario IDs.
- **Steps:**
  1. Send `GET /api/evaluations/{runId}/results?status=FAILED`.
  2. Compare returned scenario IDs with the verified failing-ID set.
  3. Compare each returned object with its unfiltered baseline object.
- **Expected results and assertions:**
  - HTTP status is 200.
  - `count` is 8 and equals `results.length`.
  - Every result has `passed: false`.
  - The exact 8 expected failing IDs are present.
  - No passing ID is present.
  - Result objects retain their original field values.
- **Cleanup:** Same isolation and supported-cleanup policy as API-01.
- **Failure conditions:** A wrong member, status, count, or mutated field fails the scenario.

### API-04 — Valid filter returns no matches

- **Layer:** API
- **Priority:** P1
- **Suite:** Regression
- **Related acceptance criteria:** AC4
- **Preconditions:** A completed DATA-ALL-PASS evaluation.
- **Test data:** An all-passing run ID with at least one verified result.
- **Steps:**
  1. Verify the baseline run contains results and all have `passed: true`.
  2. Request `GET /api/evaluations/{runId}/results?status=FAILED`.
  3. Retrieve the source evaluation again.
- **Expected results and assertions:**
  - HTTP status is 200.
  - The response is `{ "results": [], "count": 0 }`, allowing only additional fields documented by the contract.
  - The response is not an error payload.
  - The source evaluation remains unchanged.
- **Cleanup:** Clean only test-created resources when a supported mechanism exists.
- **Failure conditions:** An error response, nonzero count, returned record, or source mutation fails the scenario.

### API-05 — Reject invalid, empty, and incorrectly cased statuses

- **Layer:** API
- **Priority:** P0
- **Suite:** PR smoke for `status=` and one incorrect-case value; remaining cases in regression
- **Related acceptance criteria:** AC5, AC7
- **Preconditions:** A known valid completed evaluation.
- **Test data:** `status=`, `status=UNKNOWN`, `status=passed`, `status=Passed`, `status=failed`, and `status=Failed`.
- **Steps:**
  1. Capture the unfiltered evaluation snapshot.
  2. Send one request for each invalid value.
  3. Retrieve the unfiltered evaluation after all negative requests.
- **Expected results and assertions for each request:**
  - HTTP status is 400.
  - The body contains `error.code === "INVALID_STATUS"`.
  - The error object satisfies the documented endpoint schema once confirmed.
  - No filtered success payload is returned.
  - The evaluation snapshot remains unchanged after all attempts.
- **Cleanup:** Same isolation and supported-cleanup policy as API-01.
- **Failure conditions:** Acceptance or normalization of an invalid value, an incorrect error code, or mutation fails the scenario.

### API-06 — Reject an unknown evaluation ID

- **Layer:** API
- **Priority:** P1
- **Suite:** PR smoke
- **Related acceptance criteria:** AC6
- **Preconditions:** The selected syntactically valid ID is confirmed not to exist.
- **Test data:** A unique nonexistent evaluation ID.
- **Steps:**
  1. Request the results endpoint without `status`.
  2. Repeat with `status=PASSED`.
  3. Repeat with `status=FAILED`.
- **Expected results and assertions:**
  - Every request returns HTTP 404.
  - Every response contains `error.code === "RUN_NOT_FOUND"`.
  - No result data is disclosed.
  - Correlation ID and message assertions are added only if confirmed as part of this endpoint's contract.
- **Cleanup:** None.
- **Failure conditions:** Any success response, wrong status/code, or result disclosure fails the scenario.

### API-07 — Repeated filtering does not mutate evaluation results

- **Layer:** API
- **Priority:** P0
- **Suite:** PR smoke
- **Related acceptance criteria:** AC7
- **Preconditions:** A completed DATA-FILTER-20 evaluation.
- **Test data:** The run ID and normalized complete baseline snapshot.
- **Steps:**
  1. Retrieve and normalize the complete baseline snapshot.
  2. Request All, Passed, Failed, Passed, and All in sequence.
  3. Retrieve the complete evaluation and unfiltered results again.
- **Expected results and assertions:**
  - Final IDs, pass flags, expected and actual values, explanations, totals, and other stable fields equal the baseline.
  - `totalScenarios`, `passedCount`, and `failedCount` remain 20, 12, and 8.
  - Only fields explicitly documented as volatile may differ.
  - No result is duplicated, removed, or rewritten.
- **Cleanup:** Same isolation and supported-cleanup policy as API-01.
- **Failure conditions:** Any unexplained field difference or membership/count change fails the scenario.

### API-08 — Public and internal results endpoints remain equivalent

- **Layer:** API integration
- **Priority:** P1
- **Suite:** Regression
- **Related acceptance criteria:** AC1, AC2, AC3, AC7
- **Preconditions:** Both endpoints are accessible to QA, and any response-envelope differences are documented.
- **Test data:** One completed DATA-FILTER-20 run accessible through both endpoint forms.
- **Steps:**
  1. Call the public and internal endpoints for All.
  2. Repeat for PASSED.
  3. Repeat for FAILED.
  4. Normalize only documented transport or envelope differences.
- **Expected results and assertions:**
  - HTTP status behavior is equivalent.
  - Each filter returns the same scenario membership and pass values.
  - Counts agree with each other and with their arrays.
  - Neither endpoint mutates the run.
- **Cleanup:** Same isolation and supported-cleanup policy as API-01.
- **Failure conditions:** Undocumented contract, membership, count, or mutation divergence fails the scenario.
- **Blocker:** Internal endpoint accessibility and exact contract are not yet verified.

### UI-01 — Filter a completed evaluation through All, Passed, and Failed

- **Layer:** UI with real backend
- **Priority:** P0
- **Suite:** PR smoke
- **Related acceptance criteria:** AC1, AC2, AC3, AC7, AC8
- **Preconditions:**
  - A completed DATA-FILTER-20 evaluation is available.
  - Its results view can be opened through a supported route or workflow.
- **Test data:** The run ID plus exact all, passing, and failing ID sets.
- **Steps:**
  1. Open the completed evaluation results view.
  2. Identify the selected filter using its accessible role and state.
  3. Select All and wait for the matching results request or visible state.
  4. Select Passed and wait for the matching results request or visible state.
  5. Select Failed and wait for the matching results request or visible state.
  6. Select All again.
- **Expected results and assertions after each selection:**
  - The intended control exposes selected state.
  - The displayed count equals 20, 12, 8, then 20.
  - The exact expected row ID set is rendered.
  - Every visible row's status matches the active filter.
  - No row from the opposing partition is present.
  - Returning to All restores the original result set.
  - No evaluation mutation occurs.
- **Cleanup:** Same isolation and supported-cleanup policy as API-01.
- **Failure conditions:** Any mismatch among selected state, count, row membership, or row status fails the scenario.

### UI-02 — Show a valid empty state

- **Layer:** UI
- **Priority:** P1
- **Suite:** Regression
- **Related acceptance criteria:** AC4, AC8
- **Preconditions:** A completed DATA-ALL-PASS evaluation is available.
- **Test data:** The all-passing run ID.
- **Steps:**
  1. Open its results view.
  2. Select Failed.
  3. Wait for the selected filter request or state to settle.
- **Expected results and assertions:**
  - Failed remains selected.
  - The displayed count is 0.
  - The defined empty state is visible.
  - No result rows or error state are shown.
  - The evaluation remains unchanged.
- **Cleanup:** Clean only test-created resources when supported.
- **Failure conditions:** An error state, stale row, nonzero count, or mutation fails the scenario.

### UI-03 — Loading, error, and retry state transitions

- **Layer:** UI integration with deterministic network control
- **Priority:** P1
- **Suite:** Regression
- **Related acceptance criteria:** AC8
- **Preconditions:** Contract-shaped controlled responses are available.
- **Test data:** Delayed Passed response, failed Failed response, and successful Failed retry response.
- **Steps:**
  1. Delay a Passed response and select Passed.
  2. Observe the UI before releasing the response.
  3. Release a successful response and verify the results.
  4. Configure the next Failed request to fail.
  5. Select Failed and observe the error state.
  6. Configure retry to succeed and activate Retry.
- **Expected results and assertions:**
  - Loading state is visible only while the active request is pending.
  - Results and count are not presented as belonging to the wrong filter.
  - Loading clears on completion.
  - Failure shows the defined error state and a usable Retry control.
  - Empty state is not confused with error state.
  - Retry repeats the last failed request according to the clarified contract.
  - Successful retry renders the exact failed IDs and count once, without duplicate rows.
- **Cleanup:** Remove controlled routes after the test.
- **Failure conditions:** Missing or stuck state, incorrect retry request, stale data, or duplicate results fails the scenario.

### UI-04 — Rapid filter switching cannot display stale responses

- **Layer:** UI integration with deterministic network control
- **Priority:** P0
- **Suite:** Regression
- **Related acceptance criteria:** AC8
- **Preconditions:** Endpoint responses can be delayed and released out of order.
- **Test data:** Contract-shaped Passed and Failed responses with distinct ID sets and counts.
- **Steps:**
  1. Start from All.
  2. Select Passed and hold its response.
  3. Immediately select Failed and return its response first.
  4. Verify Failed results.
  5. Release the older Passed response.
- **Expected results and assertions:**
  - Final selected control remains Failed.
  - Final count remains 8.
  - Only the exact failed IDs remain visible.
  - The obsolete Passed response never replaces or mixes with Failed results.
  - No uncaught browser error is produced.
- **Cleanup:** Remove controlled routes after the test.
- **Failure conditions:** Any stale overwrite, mixed result set, wrong count, or wrong selected state fails the scenario.

### UI-05 — Filter controls support accessible operation

- **Layer:** UI/accessibility
- **Priority:** P2
- **Suite:** Regression
- **Related acceptance criteria:** AC8
- **Preconditions:** A completed evaluation results view is open.
- **Test data:** Any completed evaluation with both passing and failing results.
- **Steps:**
  1. Locate the controls by accessible role and name.
  2. Navigate to and operate each control with the keyboard.
  3. Observe focus, selected state, count, and result updates.
- **Expected results and assertions:**
  - All three controls have meaningful accessible names.
  - Selected state is programmatically exposed.
  - Controls can be reached and activated without a pointer.
  - Visible focus is maintained.
  - Count and state changes are exposed according to clarified accessibility requirements.
- **Cleanup:** None.
- **Failure conditions:** Missing semantics, inaccessible keyboard operation, or lost focus/selection state fails the scenario.

### INT-01 — Import, evaluate, and filter the controlled dataset end to end

- **Layer:** E2E/integration
- **Priority:** P0
- **Suite:** Regression
- **Related acceptance criteria:** AC1, AC2, AC3, AC7, AC9
- **Preconditions:**
  - An approved import mechanism exists.
  - DATA-FILTER-20 and the deterministic agent are available.
- **Test data:** DATA-FILTER-20 and the supported deterministic agent ID.
- **Steps:**
  1. Import DATA-FILTER-20 through the supported interface.
  2. Confirm the dataset is listed with 20 scenarios.
  3. Create a new evaluation.
  4. Poll observable run state until COMPLETE; fail immediately on FAILED.
  5. Retrieve the completed run and verify the actual 12/8 ID partition.
  6. Open the same run in the UI.
  7. Exercise All, Passed, and Failed.
  8. Retrieve the run again through the API.
- **Expected results and assertions:**
  - Import, listing, evaluation creation, and completion succeed.
  - UI and API refer to the same run ID.
  - API and UI membership and counts agree for every filter.
  - Final persisted results equal the pre-filter snapshot.
- **Cleanup:** Use supported cleanup only for resources created by this test.
- **Failure conditions:** A workflow failure, wrong outcome partition, cross-interface mismatch, or mutation fails the scenario.

### INT-02 — Refresh an active evaluation when `updatedAt` changes

- **Layer:** UI/API integration
- **Priority:** P1
- **Suite:** Regression
- **Related acceptance criteria:** AC8
- **Preconditions:**
  - A controllable active evaluation can progress from one result snapshot to another.
  - Expected behavior for retaining the selected filter is clarified.
- **Test data:** Two contract-shaped active-run snapshots with increasing `updatedAt` values and known result deltas.
- **Steps:**
  1. Open an active evaluation.
  2. Select a valid filter.
  3. Capture the current `updatedAt`, visible IDs, and count.
  4. Cause or simulate a newer `updatedAt` with additional results.
  5. Wait on the documented refresh signal or state.
- **Expected results and assertions:**
  - Results refresh only after the newer state is observed.
  - The UI retains or resets the filter exactly as clarified.
  - Displayed rows all match the active selected filter.
  - Count equals rendered membership.
  - Older data does not overwrite the refreshed state.
- **Cleanup:** Remove controlled routes or clean the test-created run where supported.
- **Failure conditions:** Missing refresh, wrong filter state, inconsistent count, or stale overwrite fails the scenario.
- **Source-verified dependency:** Active states are `PENDING` and `RUNNING`; the run list polls while either exists, updates the selected run, and the details view refetches results when that run's `updatedAt` changes. The selected filter state is retained during this refetch. Runtime behavior still requires validation once the application is available.

### REG-01 — Existing dataset import and evaluation flow remains functional

- **Layer:** Regression integration
- **Priority:** P0
- **Suite:** PR smoke if runtime permits; otherwise regression
- **Related acceptance criteria:** AC9
- **Preconditions:** The existing `order-agent-basics` dataset and deterministic agent are available.
- **Test data:** Dataset `order-agent-basics` and agent `deterministic-order-agent-v1`.
- **Steps:**
  1. Retrieve the dataset catalog.
  2. Verify `order-agent-basics` remains available with six scenarios.
  3. Create a new evaluation using the documented agent.
  4. Poll to COMPLETE.
  5. Retrieve its evaluation details and results view.
- **Expected results and assertions:**
  - Existing endpoint status codes and required fields remain valid.
  - The run reaches COMPLETE rather than FAILED.
  - `totalScenarios` is 6.
  - `passedCount + failedCount === totalScenarios`.
  - Six unique result records are available.
  - The existing summary UI remains usable.
- **Cleanup:** Clean only the newly created run when supported.
- **Failure conditions:** Import/listing, creation, completion, result, or existing UI regression fails the scenario.

### REG-02 — Unfiltered behavior remains backward compatible

- **Layer:** API/UI regression
- **Priority:** P1
- **Suite:** Regression
- **Related acceptance criteria:** AC1, AC9
- **Preconditions:** An existing completed evaluation is available.
- **Test data:** A completed run with a verified result snapshot.
- **Steps:**
  1. Call the existing evaluation details endpoint.
  2. Call the new results endpoint without `status`.
  3. Open the results view without changing the filter.
- **Expected results and assertions:**
  - Existing evaluation fields and totals remain available.
  - The new unfiltered endpoint returns the same result membership.
  - The UI presents the complete result set and correct total.
  - No filter interaction is required to access existing results.
- **Cleanup:** None beyond test-created resources.
- **Failure conditions:** Contract loss, membership/count mismatch, or required user interaction fails the scenario.

## Acceptance-criteria traceability

| Acceptance criterion | Planned coverage |
|---|---|
| AC1 — All returns the complete result set and correct count | API-01, UI-01, INT-01, REG-02 |
| AC2 — Passed returns only passing results and correct count | API-02, UI-01, INT-01 |
| AC3 — Failed returns only failing results and correct count | API-03, UI-01, INT-01 |
| AC4 — No matches returns empty state/count 0/no error | API-04, UI-02 |
| AC5 — Invalid or empty status returns 400 INVALID_STATUS | API-05 |
| AC6 — Unknown evaluation returns 404 RUN_NOT_FOUND | API-06 |
| AC7 — Filtering does not mutate results | API-01, API-02, API-03, API-05, API-07, API-08, UI-01, INT-01 |
| AC8 — UI filter and loading/error/retry/rapid-switch behavior | UI-01, UI-02, UI-03, UI-04, UI-05, INT-02 |
| AC9 — Existing import and evaluation behavior remains unchanged | INT-01, REG-01, REG-02 |

## Proposed suite classification

### PR smoke

- API-01 — Unfiltered baseline.
- API-02 — PASSED membership and count.
- API-03 — FAILED membership and count.
- API-05 — Empty status and one incorrect-case example.
- API-06 — Unknown evaluation.
- API-07 — Non-mutation.
- UI-01 — Core filter workflow against the real backend.
- REG-01 — Existing evaluation flow when environment runtime permits.

### Broader regression

- Remaining API-05 invalid-status permutations.
- API-04 and API-08.
- UI-02 through UI-05.
- INT-01 and INT-02.
- REG-02.

## Reliability controls

- Use Playwright `APIRequestContext` for every new direct API test.
- Generate or reserve an isolated run per worker.
- Verify completion and the actual result partition before filtering.
- Compare exact ID sets; do not rely on counts alone.
- Assert order only if ordering becomes a documented requirement.
- Use targeted response or state waits and auto-retrying assertions.
- Do not use `waitForTimeout()`.
- Use deterministic Playwright routing for error and race-state UI coverage.
- Retain at least one real-backend happy-path workflow.
- Do not use retries to conceal reproducible defects.
- Do not destructively clean shared data.

## Open questions

Source inspection resolved the default All selection, the labeled select control, loading/empty/error/retry copy, clearing of prior results during a request, retry behavior, active statuses, `updatedAt` refresh, filter retention during refresh, error envelope, import endpoint, and absence of cleanup endpoints. The following questions remain:

1. Is result ordering contractual, or should tests continue comparing membership without asserting order?
2. How must duplicate `status` query parameters behave as a product contract? The source rejects non-string parsed values, but runtime parser behavior has not been verified.
3. Is the internal Results Service endpoint directly accessible to QA and CI?
4. What authorization or tenant-isolation rules apply, if any?
5. Which browsers and viewports are release requirements?

## Blockers and assumptions

### Remaining blockers

- The existing Page Object does not yet expose DATA-104 filter, count, result-row, loading, empty, error, or retry interactions.
- Direct Results Service accessibility from QA and CI remains unverified for API-08.

### Assumptions pending verification

- UI transient-state tests may use route interception while core workflows use the real backend.
- The test environment will expose the Evaluation API separately from the UI base URL.

### Verified SST-2 runtime evidence

- DATA-FILTER-20 completed with exactly 20 unique results: 12 PASS and 8 FAIL, matching the approved scenario-ID partitions.
- DATA-ALL-PASS completed with exactly 1 PASS and 0 FAIL.
- Both Playwright `@setup-validation` tests passed against the local Evaluation API, so the mandatory readiness gates have been executed successfully.
- This evidence validates reusable test setup only; SST-3 filtering tests have not yet been implemented.

## Implementation readiness assessment

**Status: READY FOR FILTER TEST IMPLEMENTATION WITH DEPENDENCIES.**

- **Ready from source evidence:** Dataset schema and import errors, deterministic agent outputs, exact evaluator comparison, the 12/8 dataset design, the all-pass design, public evaluation lifecycle, result-filter contract, non-mutation behavior, and the minimum fixture/utility approach are sufficiently defined to implement without guessing.
- **Verified setup:** The controlled datasets, expectations, dedicated fixture, polling utility, result utility, and setup-validation spec are implemented. Live execution confirmed the exact 20/12/8 and 1/0 readiness gates, with both SST-2 tests passing.
- **Environment dependency:** Future real-backend tests require the Evaluation API, Dataset Service, Agent Service, Evaluator Service, and Results Service to be running; UI scenarios additionally require the UI.
- **Approval dependency:** Dedicated SST-2 fixtures and utilities were explicitly approved and implemented. Any future Page Object or other shared-framework changes still require approval under `AGENTS.md`.
- **Scenario-specific dependency:** API-08 remains dependent on direct Results Service reachability from the target environment. SST-4 UI automation remains dependent on runtime locator/state confirmation and approved Page Object changes.
- **Cleanup disposition:** Cleanup is not blocked or assumed. It is unsupported by the current application contract, so isolation uses unique test-created dataset IDs and non-destructive retention.

## Entry criteria

- DATA-104 is deployed or otherwise accessible.
- DATA-FILTER-20, DATA-ALL-PASS, and the exact expected ID partitions have been implemented from this verified design.
- Required open questions for the selected scenarios are resolved.
- The test environment supports isolated runs.
- Any shared fixture, Page Object, configuration, or CI changes are separately approved.

## Exit criteria

- All applicable P0 scenarios pass with exact membership, count, schema, and non-mutation evidence.
- Applicable P1 scenarios pass or have an explicit release disposition.
- Import and evaluation regression remains functional.
- No reproducible stale-response, mutation, or incorrect-filter defect remains unresolved.
- Reports retain actionable request, response, trace, and screenshot evidence without exposing secrets.
