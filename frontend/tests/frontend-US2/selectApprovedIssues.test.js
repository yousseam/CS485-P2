/**
 * US2 — selectApprovedIssues (spec rows 10–11)
 * @see docs/test-specification-frontend-us2-issueReview.md
 */

import { selectApprovedIssues } from '../../src/issueReview/issueReview.js'

describe('selectApprovedIssues', () => {
  it('includes only approved tasks in original order', () => {
    const tasks = [{ id: '1' }, { id: '2' }, { id: '3' }]
    const out = selectApprovedIssues(tasks, new Set(['2']))
    expect(out).toEqual([{ id: '2' }])
  })

  it('returns empty array when none approved', () => {
    expect(selectApprovedIssues([{ id: '1' }], new Set())).toEqual([])
  })
})
