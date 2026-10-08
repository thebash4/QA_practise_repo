
//Test Id
        export function generateTestId (prefix:string): string {
    return `${prefix}${Date.now()}`
}   

//Test Email
        export function generateTestEmail (prefix:string): string {
    return `${prefix}${Date.now()}@test.com`
}

//multi return output- genrate user
//above fucntions are returning one value, but this function is returning multiple values in one object

// Define the structure/type of a TestUser.
// This ensures every TestUser has these three properties with the correct types.
export type TestUser = {
  name: string;
  email: string;
  password: string;
};

// Function that generates and returns a TestUser.
// Partial<TestUser> allows the caller to optionally override
// name, email, password, or any combination of them.
// = {} means if no overrides are provided, use an empty object.
export function generateTestUser(
  overrides: Partial<TestUser> = {}
): TestUser {

  // Generate the unique ID once so name, email, and password
  // all use the same identifier.
  const uniqueId = Date.now();

  // Return an object that follows the TestUser structure.
  return {

    // Generate default test data using our unique ID.
    name: `TestUser${uniqueId}`,
    email: `testuser${uniqueId}@test.com`,
    password: `TestPassword${uniqueId}`,

    // Replace any default values with values provided by the caller.
    // This is last so the overrides win.
    ...overrides
  };
}