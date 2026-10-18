/**
 * Optional retry demonstration for CI debugging practice.
 *
 * It is skipped unless RUN_FAILURE_DEMO=true and is excluded from every normal suite tag.
 */
import { expect, test } from '@playwright/test';

test.describe('Retry demonstration', { tag: '@failure-demo' }, () => {
  test.skip(process.env.RUN_FAILURE_DEMO !== 'true', 'Enable explicitly with RUN_FAILURE_DEMO=true.');
  test.describe.configure({ retries: 1 });

  test('fails its first attempt and passes on retry', async ({}, testInfo) => {
    expect(testInfo.retry, 'the exercise intentionally passes only on its retry').toBe(1);
  });
});
