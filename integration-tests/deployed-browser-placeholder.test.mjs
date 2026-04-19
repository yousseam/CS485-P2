/**
 * True browser E2E (Amplify UI → API) belongs here after:
 * 1) API Gateway / Lambda return CORS headers for your Amplify origin, and
 * 2) You add @playwright/test (or Cypress) and wire CI to install browsers.
 *
 * Node-based integration tests in api.integration.test.mjs do not exercise CORS.
 */

import { describe, it } from 'node:test'

describe.skip(
  'integration: deployed browser E2E (add Playwright after CORS — see docs/test-specification-frontend-backend-integration.md § Post-CORS)',
  () => {
    it('Load INTEGRATION_AMPLIFY_URL and exercise generate/publish in a real browser', () => {})
  },
)
