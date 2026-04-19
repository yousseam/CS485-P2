/**
 * US2 — approvedIdsFromSerialized (spec rows 15–16)
 * @see docs/test-specification-frontend-us2-issueReview.md
 */

import { approvedIdsFromSerialized } from '../../src/issueReview/issueReview.js'

describe('approvedIdsFromSerialized', () => {
  it('returns a Set from a valid persisted id array', () => {
    const s = approvedIdsFromSerialized(['x', 'y'])
    expect(s.has('x')).toBe(true)
    expect(s.has('y')).toBe(true)
    expect(s.size).toBe(2)
  })

  it('returns an empty Set for null, undefined, or non-array without throwing', () => {
    expect(approvedIdsFromSerialized(null).size).toBe(0)
    expect(approvedIdsFromSerialized(undefined).size).toBe(0)
    expect(approvedIdsFromSerialized('bad').size).toBe(0)
  })
})
