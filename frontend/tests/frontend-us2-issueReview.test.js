/**
 * Frontend US2 — unit tests for issueReview.js (review / approve / publish helpers)
 * Run: cd frontend && node --test tests/frontend-us2-issueReview.test.js
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  toggleApproval,
  toggleApproveAll,
  emptyApprovals,
  canPublish,
  selectApprovedIssues,
  applyIssueUpdate,
  approvedIdsFromSerialized,
} from '../src/issueReview/issueReview.js'

describe('issueReview', () => {
  describe('toggleApproval', () => {
    it('adds id when not present', () => {
      const prev = new Set()
      const { nextApprovedIds, approvedCount } = toggleApproval(prev, 'a')
      assert.strictEqual(approvedCount, 1)
      assert.ok(nextApprovedIds.has('a'))
      assert.strictEqual(prev.size, 0)
    })

    it('removes id when present', () => {
      const prev = new Set(['a', 'b'])
      const { nextApprovedIds, approvedCount } = toggleApproval(prev, 'a')
      assert.strictEqual(approvedCount, 1)
      assert.ok(!nextApprovedIds.has('a'))
      assert.ok(nextApprovedIds.has('b'))
    })
  })

  describe('toggleApproveAll', () => {
    it('approves all when not fully approved', () => {
      const tasks = [{ id: '1' }, { id: '2' }]
      const prev = new Set(['1'])
      const { nextApprovedIds, approvedCount } = toggleApproveAll(prev, tasks)
      assert.strictEqual(approvedCount, 2)
      assert.ok(nextApprovedIds.has('1') && nextApprovedIds.has('2'))
    })

    it('clears when all already approved', () => {
      const tasks = [{ id: '1' }, { id: '2' }]
      const prev = new Set(['1', '2'])
      const { nextApprovedIds, approvedCount } = toggleApproveAll(prev, tasks)
      assert.strictEqual(approvedCount, 0)
      assert.strictEqual(nextApprovedIds.size, 0)
    })

    it('treats empty tasks as all-approved (clears)', () => {
      const prev = new Set()
      const { nextApprovedIds, approvedCount } = toggleApproveAll(prev, [])
      assert.strictEqual(approvedCount, 0)
      assert.strictEqual(nextApprovedIds.size, 0)
    })
  })

  describe('emptyApprovals', () => {
    it('returns empty set and zero count', () => {
      const { nextApprovedIds, approvedCount } = emptyApprovals()
      assert.strictEqual(approvedCount, 0)
      assert.strictEqual(nextApprovedIds.size, 0)
    })
  })

  describe('canPublish', () => {
    it('false when fewer approved than tasks', () => {
      assert.strictEqual(canPublish(new Set(['a']), 2), false)
    })

    it('true when all approved', () => {
      assert.strictEqual(canPublish(new Set(['a', 'b']), 2), true)
    })

    it('true when zero tasks (matches prior guard: 0 >= 0)', () => {
      assert.strictEqual(canPublish(new Set(), 0), true)
    })
  })

  describe('selectApprovedIssues', () => {
    it('filters by approvedIds', () => {
      const tasks = [{ id: '1' }, { id: '2' }, { id: '3' }]
      const out = selectApprovedIssues(tasks, new Set(['2']))
      assert.deepStrictEqual(out, [{ id: '2' }])
    })

    it('returns empty when none approved', () => {
      assert.deepStrictEqual(selectApprovedIssues([{ id: '1' }], new Set()), [])
    })
  })

  describe('applyIssueUpdate', () => {
    const tasks = [
      {
        id: '1',
        summary: 'S',
        description: 'D',
        acceptanceCriteria: ['a'],
      },
    ]

    it('merges provided fields', () => {
      const out = applyIssueUpdate(tasks, '1', {
        summary: 'New',
        description: 'Desc',
        acceptanceCriteria: ['x', 'y'],
      })
      assert.strictEqual(out[0].summary, 'New')
      assert.strictEqual(out[0].description, 'Desc')
      assert.deepStrictEqual(out[0].acceptanceCriteria, ['x', 'y'])
    })

    it('keeps acceptanceCriteria when updates omit array', () => {
      const out = applyIssueUpdate(tasks, '1', { summary: 'Only' })
      assert.deepStrictEqual(out[0].acceptanceCriteria, ['a'])
    })

    it('does not mutate other tasks', () => {
      const multi = [
        { id: '1', summary: 'A', description: '', acceptanceCriteria: [] },
        { id: '2', summary: 'B', description: '', acceptanceCriteria: [] },
      ]
      const out = applyIssueUpdate(multi, '1', { summary: 'Z' })
      assert.strictEqual(out[1].summary, 'B')
    })
  })

  describe('approvedIdsFromSerialized', () => {
    it('returns Set from array', () => {
      const s = approvedIdsFromSerialized(['x', 'y'])
      assert.ok(s.has('x') && s.has('y'))
    })

    it('returns empty Set for non-array', () => {
      assert.strictEqual(approvedIdsFromSerialized(null).size, 0)
      assert.strictEqual(approvedIdsFromSerialized(undefined).size, 0)
      assert.strictEqual(approvedIdsFromSerialized('bad').size, 0)
    })
  })
})
