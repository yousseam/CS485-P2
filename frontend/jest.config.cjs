/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/frontend-US2'],
  testMatch: ['**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  collectCoverageFrom: ['src/issueReview/issueReview.js'],
  coverageDirectory: 'coverage',
}
