# Deployment and Testing Audit

## Summary
This document records a weakness found during the red-team review and the improvement proposed from the blue-team perspective.

## Red-Team Finding
The project does not clearly enforce CI/CD testing before deployment or merge.

## Risk
Broken code could be deployed if tests are skipped manually.

## Blue-Team Response
Require automated test checks on pull requests before merging.

## Improvement
- Add CI pipeline
- Run tests automatically
- Require tests to pass before merge
