# Integration tests (HTTP)

See the **English specification**: [../docs/test-specification-frontend-backend-integration.md](../docs/test-specification-frontend-backend-integration.md)

**Run from repository root** (after `npm install` at root):

| Command | When |
|---------|------|
| `npm run test:integration:local` | Backend running at `http://localhost:3001` |
| `npm run test:integration:cloud` | Hits deployed API Gateway (no local backend) |
| `npm run test:integration` | Uses `INTEGRATION_API_BASE_URL` env or defaults to localhost |

**After CORS is fixed:** read **§ Post-CORS** in the spec doc for `RUN_CLOUD_PREFLIGHT_TESTS`, CI toggles, and optional Playwright steps.
