/**
 * Frontend ↔ backend integration tests (HTTP contract aligned with apiClient.js).
 * Run with backend up (local) or INTEGRATION_API_BASE_URL pointing at API Gateway (cloud).
 *
 * Publish calls use options.disableRandomErrors to avoid flaky 503 from mock Jira layer.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { apiFetch, getApiBaseUrl, isCloudTarget } from './helpers.mjs'

const SAMPLE_SPEC =
  'As a user, I need a login page with email and password so that I can access my account securely. Acceptance: validate input, hash passwords, show errors.'

const MINIMAL_ISSUE = {
  id: 'integration-story-1',
  key: 'STORY-INT-1',
  type: 'story',
  summary: 'Integration test publish payload',
  description:
    'This issue exists only to exercise POST /api/publish-issues from automated tests.',
  size: 'S',
  acceptanceCriteria: ['Publish endpoint returns structured response'],
}

describe('integration: API health', () => {
  it('GET /health returns healthy JSON', async () => {
    const res = await apiFetch('/health', { method: 'GET' })
    if (res.status !== 200) {
      assert.fail(`expected 200, got ${res.status}: ${await res.text()}`)
    }
    const body = await res.json()
    assert.strictEqual(body.status, 'healthy')
    assert.ok(body.timestamp)
  })
})

describe('integration: POST /generate-issues (same contract as frontend generateIssues)', () => {
  it('rejects specification text shorter than 10 characters', async () => {
    const res = await apiFetch('/generate-issues', {
      method: 'POST',
      body: JSON.stringify({ specText: 'short', options: {} }),
    })
    assert.strictEqual(res.status, 400)
    const body = await res.json().catch(() => ({}))
    assert.ok(
      body.code || body.message || body.error,
      'expected error payload with code or message',
    )
  })

  it('accepts valid specText and returns an issues array', async () => {
    const res = await apiFetch('/generate-issues', {
      method: 'POST',
      body: JSON.stringify({ specText: SAMPLE_SPEC, options: {} }),
    })
    if (res.status !== 200) {
      assert.fail(
        `generate-issues failed: ${res.status} ${await res.text()}`,
      )
    }
    const data = await res.json()
    assert.ok(Array.isArray(data.issues), 'response.issues must be an array')
    assert.ok(data.issues.length > 0, 'expected at least one generated issue')
    const first = data.issues[0]
    assert.ok(first.id && first.summary, 'issue should include id and summary')
    assert.ok(
      typeof data.usedAI === 'boolean' || data.usedAI === undefined,
      'usedAI may be present as boolean',
    )
  })
})

describe('integration: POST /publish-issues (same contract as frontend publishIssues)', () => {
  it('returns 400 when issues field is missing', async () => {
    const res = await apiFetch('/publish-issues', {
      method: 'POST',
      body: JSON.stringify({ options: {} }),
    })
    assert.strictEqual(res.status, 400)
  })

  it('accepts dryRun with disableRandomErrors and returns project metadata', async () => {
    const res = await apiFetch('/publish-issues', {
      method: 'POST',
      body: JSON.stringify({
        issues: [MINIMAL_ISSUE],
        options: { dryRun: true, disableRandomErrors: true },
      }),
    })
    if (res.status !== 200) {
      assert.fail(`publish-issues failed: ${res.status} ${await res.text()}`)
    }
    const data = await res.json()
    assert.strictEqual(typeof data.publishedCount, 'number')
    assert.ok(Array.isArray(data.issues))
    assert.ok(
      data.projectKey || data.projectName,
      'expected projectKey or projectName in response',
    )
    assert.strictEqual(data.dryRun, true)
  })
})

/**
 * API Gateway often terminates OPTIONS for CORS before Lambda. Local Express may not
 * define OPTIONS on these routes. Run only for cloud target (see spec doc).
 */
describe('integration: OPTIONS preflight (cloud / API Gateway)', () => {
  const amplifyOrigin =
    process.env.INTEGRATION_AMPLIFY_ORIGIN ||
    'https://main.dz861w28fydmp.amplifyapp.com'

  it('responds to CORS preflight for generate-issues (gated until CORS is verified)', async (t) => {
    if (!isCloudTarget()) {
      t.skip(
        'Skip on localhost: Express may not expose OPTIONS the same way as API Gateway.',
      )
      return
    }
    if (process.env.RUN_CLOUD_PREFLIGHT_TESTS !== 'true') {
      t.skip(
        'Set RUN_CLOUD_PREFLIGHT_TESTS=true after API Gateway CORS is configured for Amplify.',
      )
      return
    }
    const base = getApiBaseUrl()
    const url = `${base}/generate-issues`
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        Origin: amplifyOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    })
    assert.ok(
      [200, 204].includes(res.status),
      `unexpected OPTIONS status ${res.status}`,
    )
    const allowOrigin = res.headers.get('access-control-allow-origin')
    assert.ok(
      allowOrigin,
      'Access-Control-Allow-Origin should include the Amplify origin (or *) after CORS fix.',
    )
  })
})
