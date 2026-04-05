/**
 * US2 — toggleApproveAll (spec rows 3–5)
 * @see docs/test-specification-frontend-us2-issueReview.md
 */

import { toggleApproveAll } from '../../src/issueReview/issueReview.js'

describe('toggleApproveAll', () => {
  it('approves every task when not all are approved yet', () => {
    const tasks = [{ id: '1' }, { id: '2' }]
    const prev = new Set(['1'])
    const { nextApprovedIds, approvedCount } = toggleApproveAll(prev, tasks)
    expect(approvedCount).toBe(2)
    expect(nextApprovedIds.has('1')).toBe(true)
    expect(nextApprovedIds.has('2')).toBe(true)
  })

  it('clears all approvals when every task is already approved (Unapprove All)', () => {
    const tasks = [{ id: '1' }, { id: '2' }]
    const prev = new Set(['1', '2'])
    const { nextApprovedIds, approvedCount } = toggleApproveAll(prev, tasks)
    expect(approvedCount).toBe(0)
    expect(nextApprovedIds.size).toBe(0)
  })

  it('treats empty tasks as all-approved and clears', () => {
    const prev = new Set()
    const { nextApprovedIds, approvedCount } = toggleApproveAll(prev, [])
    expect(approvedCount).toBe(0)
    expect(nextApprovedIds.size).toBe(0)
  })
})
