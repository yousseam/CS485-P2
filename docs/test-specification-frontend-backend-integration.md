# Integration test specification: frontend ↔ backend (HTTP API)

**Scope:** Paths exercised when the React app uses the real backend via `frontend/src/api/apiClient.js` (not the in-browser `mockApi` fallback). These are **HTTP-level** integration checks: the same URLs, methods, and JSON bodies the UI sends.

**Test implementation:** `integration-tests/*.test.mjs` (Node.js built-in test runner: `node --test`).

**Environment variables:**

| Variable | Purpose |
|----------|---------|
| `INTEGRATION_API_BASE_URL` | Base URL including `/api`, e.g. `http://localhost:3001/api` or `https://…execute-api…/prod/api` |
| `INTEGRATION_TARGET` | Optional: `local` or `cloud` (used for documentation / conditional skips) |
| `INTEGRATION_AMPLIFY_ORIGIN` | Optional: Amplify URL used as `Origin` for OPTIONS preflight tests (default: team Amplify production URL) |
| `RUN_CLOUD_PREFLIGHT_TESTS` | Set to `true` **after** API Gateway CORS is verified, to assert OPTIONS preflight headers on cloud |

---

## Functionality to test (cross-cutting)

1. **API liveness** — Backend reachable; health payload matches contract.
2. **Generate issues (US1)** — `POST /api/generate-issues` with `specText` / `options` as the frontend sends; success and validation error paths.
3. **Publish issues (US2)** — `POST /api/publish-issues` with `issues` / `options` as the frontend sends; validation error and successful `dryRun` path (avoids flaky random 503 from mock publisher via `disableRandomErrors`).
4. **CORS preflight (deployed / API Gateway only)** — `OPTIONS` to `…/generate-issues` with `Origin` = Amplify; **skipped on localhost** and **skipped on cloud until** `RUN_CLOUD_PREFLIGHT_TESTS=true` so CI stays green while CORS is in progress.
5. **Browser E2E (future)** — Full Chromium flow from Amplify URL; **skipped** until Playwright (or similar) is added and CORS is fixed (see `integration-tests/deployed-browser-placeholder.test.mjs` and § Post-CORS below).

---

## Test table

| # | Area | Purpose | Inputs | Expected if pass |
|---|------|---------|--------|------------------|
| 1 | Health | Verify API up | `GET {BASE}/health` | `200`, JSON `status: "healthy"`, timestamp present |
| 2 | Generate (validation) | Short spec rejected like production | `POST {BASE}/generate-issues`, body `{ specText: "short", options: {} }` | `400`, error body with `code` or `message` |
| 3 | Generate (success) | Valid spec returns issues array | `POST {BASE}/generate-issues`, body `{ specText: "<valid paragraph>", options: {} }` | `200`, `issues` non-empty array, issues have `id`, `summary` |
| 4 | Publish (validation) | Missing `issues` rejected | `POST {BASE}/publish-issues`, body `{ options: {} }` | `400` |
| 5 | Publish (dry run) | Same happy path shape as UI publish (no random failure) | `POST {BASE}/publish-issues`, body `{ issues: [<one minimal issue>], options: { dryRun: true, disableRandomErrors: true } }` | `200`, `dryRun: true`, `issues` array, and **`projectKey` or `projectName`** present (either satisfies contract) |
| 6 | OPTIONS preflight | **Cloud only** — API Gateway answers CORS preflight for Amplify | `OPTIONS {BASE}/generate-issues`, headers `Origin` = Amplify URL, `Access-Control-Request-Method: POST` | Skipped unless `isCloudTarget()` **and** `RUN_CLOUD_PREFLIGHT_TESTS=true`; when enabled: `200` or `204`, response includes `Access-Control-Allow-Origin` |
| 7 | Browser E2E | Real browser from Amplify | (Playwright — not implemented) | Suite skipped until implemented |

---

## How to run

**Local (backend must be running on port 3001):**

```bash
cd backend && npm install && npm start
# other terminal:
npm run test:integration:local
```

**Cloud (API Gateway only; no local backend):**

```bash
npm run test:integration:cloud
```

**Default:**

```bash
npm run test:integration
```

Uses `INTEGRATION_API_BASE_URL` if set; otherwise `http://localhost:3001/api`.

---

## Post-CORS: what to update (detailed checklist)

When your teammate finishes **CORS** on API Gateway / Lambda for the Amplify origin:

### 1. Manual smoke (no code required)

1. Open the Amplify URL (e.g. `https://main.<appId>.amplifyapp.com`).
2. DevTools → **Network** → trigger **Regenerate** / generate flow.
3. Confirm `POST …/generate-issues` is **200** (not CORS blocked).

**You do not need to redeploy the frontend** for a CORS-only API change if `VITE_API_BASE_URL` was already correct.

### 2. Turn on automated OPTIONS preflight assertion

After manual smoke succeeds:

```bash
# Windows PowerShell example
$env:INTEGRATION_API_BASE_URL="https://7j3debwhz5.execute-api.us-east-2.amazonaws.com/prod/api"
$env:INTEGRATION_TARGET="cloud"
$env:RUN_CLOUD_PREFLIGHT_TESTS="true"
npm run test:integration
```

If this fails, CORS is still incomplete (or wrong Amplify origin in `INTEGRATION_AMPLIFY_ORIGIN`).

**CI:** Add `RUN_CLOUD_PREFLIGHT_TESTS: true` to `.github/workflows/run-integration-tests.yml` **only after** CORS is verified, so the workflow stays green during the fix.

### 3. Optional: Playwright browser E2E

1. Add `@playwright/test` as a **devDependency** (typically at repo root or `frontend/`).
2. Replace `integration-tests/deployed-browser-placeholder.test.mjs` with real tests, or add `integration-tests/browser.e2e.spec.cjs` and a script `test:integration:browser`.
3. In CI, run `npx playwright install --with-deps` before tests.
4. Use `INTEGRATION_AMPLIFY_URL` env pointing at Amplify **frontend**; tests click through generate/publish.

### 4. Backend `FRONTEND_URL` (if using Express locally with credentials)

For **local** browser → **local** API, `backend/server.js` already allows `http://localhost:5173`. If you add more dev origins, set `FRONTEND_URL` in `backend/.env` (comma-separated). **Amplify URL matters for production Express** only if you run Express behind a custom domain; your deployed path uses **Lambda + API Gateway**, not Express CORS.

### 5. No redo of rows 1–5 tests required

The HTTP contract tests stay valid. You only **un-skip / enable** gated suites (OPTIONS, Playwright) and optionally tighten assertions on `Access-Control-Allow-Headers` if your app sends `Authorization`.

---

## Mapping to frontend code

| Spec rows | Frontend entry |
|-----------|------------------|
| 2–3 | `generateIssues()` → `POST /generate-issues` |
| 4–5 | `publishIssues()` → `POST /publish-issues` |
| 1 | Not called directly from `apiClient.js`; included for deployment / monitoring parity |
