# Deployment and Testing Audit

## Summary

This document records a weakness found during the red-team review and the improvement proposed from the blue-team perspective.

## Red-Team Finding

The project uses Docker and includes tests, but there is no clearly documented required CI/CD gate before merge or deployment.

## Risk

Because testing is not clearly enforced as a required deployment or merge gate, broken code could be merged or deployed if tests are skipped manually.

## Blue-Team Response

To improve reliability, the project should require an automated CI workflow that runs frontend and backend tests on pull requests before merge.

## Recommended Improvement

- Run backend tests automatically on pull requests
- Run frontend tests automatically on pull requests
- Treat test results as a required merge gate
- Keep deployment steps documented and consistent with the Docker setup

## Why This Helps

This makes it harder for bad changes to reach deployment and improves confidence in the codebase.
