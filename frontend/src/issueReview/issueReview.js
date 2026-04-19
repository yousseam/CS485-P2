/**
 * Pure helpers for US2: review, edit, approve, and publish gating.
 * No React or I/O — safe to unit test in isolation.
 */

/**
 * Toggle a single issue’s approval (add if absent, remove if present).
 * @param {Set<string>} approvedIds
 * @param {string} issueId
 * @returns {{ nextApprovedIds: Set<string>, approvedCount: number }}
 */
export function toggleApproval(approvedIds, issueId) {
  const next = new Set(approvedIds)
  if (next.has(issueId)) {
    next.delete(issueId)
  } else {
    next.add(issueId)
  }
  return { nextApprovedIds: next, approvedCount: next.size }
}

/**
 * If all tasks are already approved, clear approvals; otherwise approve every task.
 * Matches previous App.jsx Approve All / Unapprove All behavior.
 * @param {Set<string>} approvedIds
 * @param {Array<{ id: string }>} tasks
 * @returns {{ nextApprovedIds: Set<string>, approvedCount: number }}
 */
export function toggleApproveAll(approvedIds, tasks) {
  const total = tasks.length
  const allApproved = approvedIds.size === total
  if (allApproved) {
    return { nextApprovedIds: new Set(), approvedCount: 0 }
  }
  return {
    nextApprovedIds: new Set(tasks.map((t) => t.id)),
    approvedCount: total,
  }
}

/**
 * Cleared approvals (e.g. after new generation or reset).
 * @returns {{ nextApprovedIds: Set<string>, approvedCount: number }}
 */
export function emptyApprovals() {
  return { nextApprovedIds: new Set(), approvedCount: 0 }
}

/**
 * Whether publish should be allowed (same guard as before: every task approved).
 * @param {Set<string>} approvedIds
 * @param {number} taskCount
 * @returns {boolean}
 */
export function canPublish(approvedIds, taskCount) {
  return approvedIds.size >= taskCount
}

/**
 * Issues to send to publishIssues (approved subset, stable order).
 * @param {Array<{ id: string }>} tasks
 * @param {Set<string>} approvedIds
 * @returns {Array<{ id: string }>}
 */
export function selectApprovedIssues(tasks, approvedIds) {
  return tasks.filter((t) => approvedIds.has(t.id))
}

/**
 * Apply inline-edit fields to one issue; others unchanged.
 * @param {Array<Record<string, unknown>>} tasks
 * @param {string} issueId
 * @param {{ summary?: string, description?: string, acceptanceCriteria?: string[] }} updates
 * @returns {Array<Record<string, unknown>>}
 */
export function applyIssueUpdate(tasks, issueId, updates) {
  return tasks.map((t) =>
    t.id === issueId
      ? {
          ...t,
          summary: updates.summary ?? t.summary,
          description: updates.description ?? t.description,
          acceptanceCriteria: Array.isArray(updates.acceptanceCriteria)
            ? updates.acceptanceCriteria
            : t.acceptanceCriteria,
        }
      : t
  )
}

/**
 * Restore Set from persisted JSON (localStorage).
 * @param {unknown} ids
 * @returns {Set<string>}
 */
export function approvedIdsFromSerialized(ids) {
  if (!Array.isArray(ids)) {
    return new Set()
  }
  return new Set(ids)
}
