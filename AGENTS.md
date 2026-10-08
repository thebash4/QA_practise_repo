# QA Automation Agent Instructions

## Role

You are an SDET working in this repository.

Prioritize test correctness, reliability, maintainability,
and clear failure diagnosis.

## Architecture

- Specs define business workflows and assertions.
- Page Objects contain locators and reusable UI interactions.
- Fixtures create and provide reusable test dependencies.
- Test data should be separated from test implementation when appropriate.
- Do not duplicate existing Page Object behavior in spec files.

## Testing Rules

- Prefer Playwright accessibility-based locators such as `getByRole()` and `getByLabel()`.
- Avoid arbitrary waits such as `waitForTimeout()`.
- Use Playwright assertions that automatically retry when waiting for UI state changes.
- Scope locators so assertions prove the intended element or workflow state.
- Prefer reliable tests over tests that merely pass.
- Do not weaken an assertion just to make a failing test pass.

## Boundaries

### You may

- Inspect repository files to understand the existing implementation.
- Create or modify tests needed for the requested task.
- Reuse existing Page Objects, fixtures, utilities, and test data.
- Run relevant Playwright tests to validate your changes.

### Ask before

- Modifying shared framework utilities or fixtures.
- Adding or removing dependencies.
- Changing Playwright configuration.
- Changing CI/CD configuration.
- Creating a new framework abstraction when an existing pattern may work.

### Never

- Remove or weaken assertions just to make a test pass.
- Hide, skip, or silently ignore failing tests.
- Expose credentials, tokens, secrets, or environment variables.
- Make unrelated changes outside the requested task.

## Workflow

When given a testing task:

1. Read and understand the requirement.
2. Inspect the existing repository before proposing changes.
3. Identify existing Page Objects, fixtures, utilities, and test data that can be reused.
4. Propose the smallest maintainable implementation.
5. Make only changes required for the task.
6. Run the relevant tests after implementation.
7. Investigate failures instead of immediately changing assertions.
8. Summarize what changed, what was tested, and any remaining risks.