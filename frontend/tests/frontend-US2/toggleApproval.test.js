/**
 * US2 — toggleApproval (spec rows 1–2)
 * @see docs/test-specification-frontend-us2-issueReview.md
 */

import { toggleApproval } from '../../src/issueReview/issueReview.js'

describe('toggleApproval', () => {
  it('adds id when not present (approve branch)', () => {
    const prev = new Set()
    const { nextApprovedIds, approvedCount } = toggleApproval(prev, 'a')
    expect(approvedCount).toBe(1)
    expect(nextApprovedIds.has('a')).toBe(true)
    expect(prev.size).toBe(0)
  })

  it('removes id when present (unapprove branch)', () => {
    const prev = new Set(['a', 'b'])
    const { nextApprovedIds, approvedCount } = toggleApproval(prev, 'a')
    expect(approvedCount).toBe(1)
    expect(nextApprovedIds.has('a')).toBe(false)
    expect(nextApprovedIds.has('b')).toBe(true)
  })
})
