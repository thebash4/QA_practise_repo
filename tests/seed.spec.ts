import { test, expect } from '@playwright/test';
import { generateTestUser } from '../utils/test-data-generator';

test.describe('Test group', () => {
  test('generate test user', async ({  }) => {
    const user = generateTestUser();
    console.log('Generated Test User:', user);
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('password');
  });
  test('generate test user with overrides', async ({  }) => {
    const user = generateTestUser({ email: 'invalid*email' });
    console.log('Generated Test User:', user);
    expect(user.email).toBe('invalid*email');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('password');
  });
});
