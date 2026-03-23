# Backend Tests

This directory contains tests for the AI Specification Breakdown backend API.

## Test Structure

- `issueGenerator.test.js` - Unit tests for the issue generation service
- `jiraPublisher.test.js` - Unit tests for the Jira publishing service
- `integration.test.js` - Integration tests for all API endpoints (requires server running)

## Running Tests

### Unit Tests Only

Run unit tests without needing the server:

```bash
npm test tests/issueGenerator.test.js tests/jiraPublisher.test.js
```

### All Tests (including integration)

To run all tests including integration tests, you need the server running:

**Option 1: Run server manually, then tests**

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run tests
npm test
```

**Option 2: Use the helper script**

```bash
# Make script executable (first time only)
chmod +x tests/test-with-server.sh

# Run tests with server
./tests/test-with-server.sh
```

### Watch Mode

Run tests in watch mode (auto-rerun on file changes):

```bash
npm run test:watch
```

Note: Watch mode only runs unit tests. Integration tests require the server to be running separately.

## Test Coverage

### Unit Tests

These tests don't require the server:

- ✅ Issue Generator Service (10 tests)
- ✅ Jira Publisher Service (11 tests)

### Integration Tests

These tests require the server running:

- ✅ Health Check (3 tests)
- ✅ Root Endpoint (1 test)
- ✅ Generate Issues Endpoint (4 tests)
- ✅ Publish Issues Endpoint (3 tests)
- ✅ Service Health Endpoints (3 tests)
- ✅ Error Handling (2 tests)

## Test Results Summary

```
tests 42
suites 13
pass 26
fail 0
```

All tests should pass when:
- Unit tests can run standalone
- Integration tests have the server running at `http://localhost:3001`

## Writing New Tests

### Unit Tests

Create test files in this directory following the naming convention: `<serviceName>.test.js`

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('My Service', () => {
  it('should do something', () => {
    // Test logic here
  });
});
```

### Integration Tests

Add tests to `integration.test.js`:

```javascript
describe('New Endpoint', () => {
  it('should handle request', async () => {
    const response = await fetch('http://localhost:3001/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();
    assert.strictEqual(response.status, 200);
    assert.ok(data.someField);
  });
});
```

## Troubleshooting

### Integration tests failing with ECONNREFUSED

**Problem:** Tests can't connect to the server.

**Solution:** Make sure the server is running:
```bash
npm run dev
```

Then run the tests in a separate terminal:
```bash
npm test
```

### Tests timing out

**Problem:** Tests take too long and timeout.

**Solution:** Check if the server is responsive:
```bash
curl http://localhost:3001/api/health
```

If the server is not responding, restart it and try again.

### Import errors

**Problem:** Tests fail with import errors.

**Solution:** Make sure you're running tests from the backend directory:
```bash
cd backend
npm test
```

## CI/CD Integration

For CI/CD pipelines, use the helper script:

```yaml
test:
  script:
    - cd backend
    - npm install
    - npm test
```

For integration tests in CI/CD, ensure the server starts before tests run:

```yaml
test:integration:
  before_script:
    - cd backend
    - npm install
    - npm run dev &
    - sleep 5
  script:
    - npm test
```

## Test Environment Variables

The tests use the default environment. For custom test environments, create a `.env.test` file:

```bash
NODE_ENV=test
PORT=3001
```

Then run:

```bash
NODE_ENV=test npm test
```
