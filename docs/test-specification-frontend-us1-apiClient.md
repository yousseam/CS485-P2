# Frontend US1 Test Specification: apiClient.js

## File Under Test
frontend/src/api/apiClient.js

## Functions Tested
- generateIssues(specText, options)
- publishIssues(issues, options)

## Test Cases

1. generateIssues returns backend data when successful
2. generateIssues falls back when request fails
3. generateIssues handles non-ok response
4. publishIssues returns backend result when successful
5. publishIssues falls back when request fails
6. publishIssues handles non-ok response
