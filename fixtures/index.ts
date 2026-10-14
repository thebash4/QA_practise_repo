import { mergeTests } from '@playwright/test';
import { test as greetingTest } from './simple-fixture';
import { test as evaluationTest } from './evaluation-fixtures';

export const test = mergeTests(greetingTest, evaluationTest);

export { expect } from '@playwright/test';
