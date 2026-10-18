# Jenkins CI/CD Testing Lab

This repository is the QA client for the externally managed EvalForge training application. The
pipeline never starts or changes EvalForge; it verifies that the selected Jenkins agent can reach
the required services before running tests.

## Test suites and tags

Every lab test has one primary tag so selecting a category does not execute the same test twice.

| Suite | Tag | Coverage | Requires UI |
| --- | --- | --- | --- |
| Smoke | `@smoke` | API health, catalog availability, UI availability, essential UI workflow | Yes |
| Regression | `@regression` | Detailed contracts, completed results, UI/API consistency | Yes |
| Negative | `@negative` | Invalid identifiers, payloads, filters, routes, and methods | No |
| Integration | `@integration` | Evaluation creation, polling, retrieval, and result filtering | No |

DATA-104 readiness tests retain their separate `@setup-validation` classification. The optional
`@failure-demo` exercise is excluded from all normal suites.

```bash
# Run by npm alias.
npm run test:smoke
npm run test:regression
npm run test:negative
npm run test:integration
npm run test:all

# Equivalent direct Playwright selections.
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep @negative
npx playwright test --grep @integration
```

## Environment requirements

The API fixture uses `EVALFORGE_BASE_URL`, defaulting to `http://localhost:3000`. Browser tests use
`APP_URL`, defaulting to `http://localhost:5173`.

For Jenkins running directly on the same Mac as EvalForge:

1. Start EvalForge using its documented development command outside this repository.
2. Confirm `curl -fsS http://localhost:3000/health` succeeds.
3. Confirm `curl -fsS http://localhost:5173` succeeds for UI suites.
4. Keep the services running for the duration of the build.

For a containerized or remote Jenkins agent, `localhost` refers to that agent—not the Mac. Supply
reachable `API_BASE_URL` and `UI_BASE_URL` values through **Build with Parameters**. Network routing,
firewalls, and service binding must allow the agent to reach those URLs. Do not guess or commit
environment credentials; verify connectivity with `curl` from the agent itself.

## Jenkins parameters

- `TEST_SUITE`: `smoke`, `regression`, `negative`, `integration`, `all`, or preserved
  `legacy-pytest` training coverage.
- `WORKERS`: `1`, `2`, `4`, or `6` for Playwright.
- `RETRIES`: `0`, `1`, or `2` for Playwright.
- `API_BASE_URL`: reachable Evaluation API address.
- `UI_BASE_URL`: reachable UI address for smoke, regression, and all selections.

The Jenkinsfile validates controlled values against allowlists before constructing Playwright
arguments. Automated multibranch builds safely default to smoke, one worker, and zero retries.

## Trigger and diagnose a Jenkins build

1. Open the multibranch pipeline or branch job and select **Build with Parameters**.
2. Select the suite, worker count, retry count, and reachable service URLs.
3. Start the build and open **Console Output**.
4. Confirm checkout, dependency installation, environment verification, discovery count, and the
   printed `suite/workers/retries` line.
5. For a failure, open the failed stage and locate the first assertion or transport error. A retry
   is evidence to investigate, not proof that the failure is harmless.
6. Open **Test Result** for JUnit history and individual test failures.
7. Download `playwright-report/` from archived artifacts and open `index.html` locally.
8. Download the affected directory under `test-results/`. Open a retained trace with:

   ```bash
   npx playwright show-trace path/to/trace.zip
   ```

9. For API failures, use the HTTP status, error envelope, correlation ID, and fixture diagnostics.
   Do not publish secrets, authorization headers, cookies, or real customer data.
10. Compare the first attempt and retry output. Reproduce with retries disabled before classifying
    a failure as flaky.

The pipeline uses Jenkins' `junit` step and `archiveArtifacts`, both already used by this project.
It does not require the HTML Publisher plugin. If that plugin is installed later, `publishHTML` can
be added after explicit Jenkins-administrator approval.

## Worker performance experiment

Use the same commit, suite, environment, retry value, and dataset state for every run. Integration
is a useful API-only comparison:

```bash
npx playwright test --grep @integration --workers=1 --retries=0
npx playwright test --grep @integration --workers=2 --retries=0
npx playwright test --grep @integration --workers=4 --retries=0
npx playwright test --grep @integration --workers=6 --retries=0
```

Record verified output only:

| Suite | Workers | Total | Passed | Failed | Retried | Skipped | Duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| integration | 1 | 4 | 4 | 0 | 0 | 0 | 4.3s |
| integration | 2 | 4 | 4 | 0 | 0 | 0 | 4.2s |
| integration | 4 | 4 | 4 | 0 | 0 | 0 | 4.3s |
| integration | 6 requested (4 used) | 4 | 4 | 0 | 0 | 0 | 4.2s |

These local measurements were captured on 2026-10-17 against the same running application and
commit, with retries disabled. Playwright used four workers for the six-worker request because only
four integration tests were available to schedule.

More workers may be slower when startup, browser creation, network latency, CPU contention, or a
shared backend dominates execution. The worker-scoped request and completed-run fixtures avoid
repeating setup within one worker while keeping separate runs across workers and Jenkins jobs.

## Optional retry demonstration

The demonstration is skipped and excluded from default suites. Run it explicitly on an isolated
training build:

```bash
npm run test:failure-demo
```

Its first attempt fails and its single configured retry passes, producing visible retry evidence
without weakening or breaking the normal smoke, regression, negative, or integration suites.
