/**
 * E2E tests global setup
 *
 * Network handling:
 * - External network calls are allowed for e2e tests (unlike unit tests)
 * - If specific external calls must be mocked, do so per-test rather than globally
 *
 * Timeout:
 * - Global timeout for e2e tests is configured in jest.config.ts (30 seconds)
 * - Override per-test if needed using jest.setTimeout() or passing timeout as third arg to it()
 */

// Setup code can be added here if needed
// For example: global test utilities, shared mocks, etc.
