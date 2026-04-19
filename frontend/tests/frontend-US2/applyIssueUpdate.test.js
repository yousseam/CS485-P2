/**
 * US2 — applyIssueUpdate (spec rows 12–14)
 * @see docs/test-specification-frontend-us2-issueReview.md
 */

import { applyIssueUpdate } from '../../src/issueReview/issueReview.js'

describe('applyIssueUpdate', () => {
  const singleTask = [
    {
      id: '1',
      summary: 'S',
      description: 'D',
      acceptanceCriteria: ['a'],
    },
  ]

  it('merges all provided fields for the matching issue', () => {
    const out = applyIssueUpdate(singleTask, '1', {
      summary: 'New',
      description: 'Desc',
      acceptanceCriteria: ['x', 'y'],
    })
    expect(out[0].summary).toBe('New')
    expect(out[0].description).toBe('Desc')
    expect(out[0].acceptanceCriteria).toEqual(['x', 'y'])
  })

  it('keeps acceptanceCriteria when updates omit an array for it', () => {
    const out = applyIssueUpdate(singleTask, '1', { summary: 'Only' })
    expect(out[0].summary).toBe('Only')
    expect(out[0].acceptanceCriteria).toEqual(['a'])
  })

  it('does not change issues with a different id', () => {
    const tasks = [
      { id: '1', summary: 'A', description: '', acceptanceCriteria: [] },
      { id: '2', summary: 'B', description: '', acceptanceCriteria: [] },
    ]
    const out = applyIssueUpdate(tasks, '1', { summary: 'Z' })
    expect(out[1].summary).toBe('B')
  })
})
