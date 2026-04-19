/**
 * US2 — canPublish (spec rows 7–9)
 * @see docs/test-specification-frontend-us2-issueReview.md
 */

import { canPublish } from '../../src/issueReview/issueReview.js'

describe('canPublish', () => {
  it('returns false when fewer approved than tasks', () => {
    expect(canPublish(new Set(['a']), 2)).toBe(false)
  })

  it('returns true when approved count meets task count', () => {
    expect(canPublish(new Set(['a', 'b']), 2)).toBe(true)
  })

  it('returns true when zero tasks (0 >= 0 guard)', () => {
    expect(canPublish(new Set(), 0)).toBe(true)
  })
})
