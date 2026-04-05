/**
 * US2 — emptyApprovals (spec row 6)
 * @see docs/test-specification-frontend-us2-issueReview.md
 */

import { emptyApprovals } from '../../src/issueReview/issueReview.js'

describe('emptyApprovals', () => {
  it('returns empty set and zero count after reset or new generation', () => {
    const { nextApprovedIds, approvedCount } = emptyApprovals()
    expect(approvedCount).toBe(0)
    expect(nextApprovedIds.size).toBe(0)
  })
})
