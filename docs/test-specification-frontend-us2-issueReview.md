# Test specification: frontend US2 — `issueReview.js`

**Module:** `frontend/src/issueReview/issueReview.js`  
**Purpose:** Pure functions that implement US2 review/approve/publish gating and issue edits without React or I/O.  
**Jest (US2 suite):** `frontend/tests/frontend-US2/*.test.js` (run: `cd frontend && npm test` or `npm run test:frontend-us2`)  
**Node test runner (full `issueReview` suite):** `frontend/tests/frontend-us2-issueReview.test.js` (run: `cd frontend && npm run test:issue-review`)

---

## Functions under test

The module exports **seven** named functions:

1. **`toggleApproval(approvedIds, issueId)`** — Toggles whether a single issue id is in the approved set; returns a new `Set` and the new count (input `Set` is not mutated).
2. **`toggleApproveAll(approvedIds, tasks)`** — If every task is already approved (by count), clears all approvals; otherwise sets approvals to all task ids.
3. **`emptyApprovals()`** — Returns an empty approved set and count `0` (e.g. after reset or new generation).
4. **`canPublish(approvedIds, taskCount)`** — Returns whether the UI should allow publish: `true` when the number of approved ids is at least `taskCount`.
5. **`selectApprovedIssues(tasks, approvedIds)`** — Returns the sub-list of tasks whose `id` appears in `approvedIds` (order preserved).
6. **`applyIssueUpdate(tasks, issueId, updates)`** — Returns a new tasks array with one issue merged with optional `summary`, `description`, and/or `acceptanceCriteria`; other issues unchanged.
7. **`approvedIdsFromSerialized(ids)`** — Converts persisted JSON (array of string ids) into a `Set`; non-arrays yield an empty `Set`.

---

## Test table

Each row is one unit test: **purpose**, **inputs** (concrete values passed to the function), and **expected output** if the test passes.

| # | Function | Purpose of test | Inputs | Expected output |
|---|----------|-----------------|--------|-----------------|
| 1 | `toggleApproval` | Approve an issue that was not previously approved (add branch). | `approvedIds` = empty `Set`; `issueId` = `'a'` | `nextApprovedIds` is a `Set` containing `'a'`; `approvedCount` = `1`. Original `approvedIds` still empty (no mutation). |
| 2 | `toggleApproval` | Unapprove an issue that was previously approved (remove branch). | `approvedIds` = `Set(['a','b'])`; `issueId` = `'a'` | `nextApprovedIds` contains only `'b'`; `approvedCount` = `1`. |
| 3 | `toggleApproveAll` | Approve every task when not all are approved yet. | `approvedIds` = `Set(['1'])`; `tasks` = `[{ id: '1' }, { id: '2' }]` | `nextApprovedIds` = `Set(['1','2'])`; `approvedCount` = `2`. |
| 4 | `toggleApproveAll` | Clear all approvals when every task is already approved (Unapprove All). | `approvedIds` = `Set(['1','2'])`; `tasks` = `[{ id: '1' }, { id: '2' }]` | `nextApprovedIds` = empty `Set`; `approvedCount` = `0`. |
| 5 | `toggleApproveAll` | Edge case: no tasks — treat as “all approved” and clear. | `approvedIds` = empty `Set`; `tasks` = `[]` | `nextApprovedIds` = empty `Set`; `approvedCount` = `0`. |
| 6 | `emptyApprovals` | After reset or new generation, approvals start empty. | (none) | `nextApprovedIds` = empty `Set`; `approvedCount` = `0`. |
| 7 | `canPublish` | Publish must stay blocked until every task is approved. | `approvedIds` = `Set(['a'])`; `taskCount` = `2` | `false`. |
| 8 | `canPublish` | Publish allowed when approved count meets task count. | `approvedIds` = `Set(['a','b'])`; `taskCount` = `2` | `true`. |
| 9 | `canPublish` | Edge case: zero tasks — guard matches prior app behavior (`0 >= 0`). | `approvedIds` = empty `Set`; `taskCount` = `0` | `true`. |
| 10 | `selectApprovedIssues` | Only approved tasks are included, in original order. | `tasks` = `[{ id: '1' }, { id: '2' }, { id: '3' }]`, `approvedIds` = `Set(['2'])` | Array with one element: `[{ id: '2' }]`. |
| 11 | `selectApprovedIssues` | No approvals yields empty list. | `tasks` = `[{ id: '1' }]`, `approvedIds` = empty `Set` | `[]`. |
| 12 | `applyIssueUpdate` | Save edits merges all provided fields for the matching issue. | `tasks` = one issue `{ id: '1', summary: 'S', description: 'D', acceptanceCriteria: ['a'] }`; `issueId` = `'1'`; `updates` = `{ summary: 'New', description: 'Desc', acceptanceCriteria: ['x','y'] }` | New array: first issue has `summary` `'New'`, `description` `'Desc'`, `acceptanceCriteria` `['x','y']`. |
| 13 | `applyIssueUpdate` | If `updates` does not include an array for `acceptanceCriteria`, keep existing criteria. | Same base task; `updates` = `{ summary: 'Only' }` only | First issue `summary` `'Only'`; `acceptanceCriteria` still `['a']`. |
| 14 | `applyIssueUpdate` | Issues with a different `id` are unchanged (no accidental updates). | `tasks` = two issues ids `'1'` and `'2'`; `issueId` = `'1'`; `updates` = `{ summary: 'Z' }` | Second issue unchanged (e.g. still `summary` `'B'` if that was its value). |
| 15 | `approvedIdsFromSerialized` | Restore from valid persisted array. | `ids` = `['x','y']` | `Set` containing `'x'` and `'y'`. |
| 16 | `approvedIdsFromSerialized` | Invalid or missing persisted value does not throw; yields empty set. | `ids` = `null`, `undefined`, or non-array such as `'bad'` | Empty `Set` in each case. |

---

## Path / coverage notes (for milestone goals)

- **`toggleApproval`:** Two branches — id absent (add) vs present (remove); tests 1–2.
- **`toggleApproveAll`:** Two branches — not all approved (approve all) vs all approved (clear); plus empty `tasks`; tests 3–5.
- **`emptyApprovals`:** Single return path; test 6.
- **`canPublish`:** Boolean outcome paths (blocked vs allowed) plus `taskCount === 0`; tests 7–9.
- **`selectApprovedIssues`:** Non-empty filter vs empty result; tests 10–11.
- **`applyIssueUpdate`:** Branch on matching `id` vs non-matching; branch on `Array.isArray(updates.acceptanceCriteria)` vs not; tests 12–14.
- **`approvedIdsFromSerialized`:** Array branch vs `!Array.isArray` branch (exception-safe empty set); tests 15–16.

Together these tests exercise each function and the main conditional paths inside them, consistent with the implemented unit tests in `frontend-us2-issueReview.test.js`.
