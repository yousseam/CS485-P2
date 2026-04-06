# Test Specification for `backend/src/routes/tasks.js`

**User Story #2:** As a project lead, I want to review and edit AI-generated tasks before publishing them so that I stay in control of final decisions.

---

## Section 1: File Overview

**File name:** `backend/src/routes/tasks.js`

**Purpose:** This file implements the task review, edit, approve, reject, and publish workflow for User Story #2. It allows project leads to review AI-generated tasks, edit their content, approve or reject them, and publish approved tasks to Jira. It includes validation gates to ensure all tasks are approved before publishing and supports bulk operations for efficiency.

---

## Section 2: Functions List

1. **GET /api/batches/:batchId** - Get all tasks in a batch for review
2. **GET /api/tasks/:taskId** - Get a specific task by ID
3. **PATCH /api/tasks/:taskId** - Edit a task with optimistic locking
4. **POST /api/tasks/:taskId/approve** - Approve a single task
5. **POST /api/tasks/:taskId/reject** - Reject a single task
6. **POST /api/batches/:batchId/bulk-update** - Bulk approve or reject multiple tasks
7. **POST /api/batches/:batchId/validate** - Validate batch before publishing
8. **POST /api/batches/:batchId/publish** - Publish approved tasks to Jira
9. **POST /api/batches/:batchId/discard** - Discard a batch without publishing

---

## Section 3: Test Specification Tables

### Function 1: GET /api/batches/:batchId

| Purpose | Inputs | Expected Output |
|---------|--------|-----------------|
| Retrieve all tasks for a valid batch ID | Valid batchId that exists, authenticated user | HTTP 200 with batch object and array of tasks in JSON format |
| Handle non-existent batch ID | Invalid/non-existent batchId, authenticated user | HTTP 404 with error message "Batch not found" and error code "NOT_FOUND" |
| Handle unauthenticated request | Valid batchId, no authentication | HTTP 401 (authentication middleware response) |
| Return tasks sorted by sort_order and created_at | Valid batchId with multiple tasks, authenticated user | HTTP 200 with tasks array sorted by sort_order ascending, then created_at ascending |
| Return empty tasks array for batch with no tasks | Valid batchId with no associated tasks, authenticated user | HTTP 200 with batch object and empty tasks array |

### Function 2: GET /api/tasks/:taskId

| Purpose | Inputs | Expected Output |
|---------|--------|-----------------|
| Retrieve a specific task by valid ID | Valid taskId that exists, authenticated user | HTTP 200 with task object containing all task fields in JSON format |
| Handle non-existent task ID | Invalid/non-existent taskId, authenticated user | HTTP 404 with error message "Task not found" and error code "NOT_FOUND" |
| Handle unauthenticated request | Valid taskId, no authentication | HTTP 401 (authentication middleware response) |
| Return task with all metadata fields | Valid taskId, authenticated user | HTTP 200 with task object including id, batch_id, project_id, task_type, title, description, acceptance_criteria, status, version, timestamps, etc. |
| Return task in DRAFT status | Valid taskId for draft task, authenticated user | HTTP 200 with task object where status = "DRAFT" |

### Function 3: PATCH /api/tasks/:taskId

| Purpose | Inputs | Expected Output |
|---------|--------|-----------------|
| Successfully update task title | Valid taskId, version matching current version, authenticated user, body with { version: 1, title: "New Title" } | HTTP 200 with updated task object reflecting new title and incremented version |
| Successfully update multiple fields | Valid taskId, version matching current version, authenticated user, body with { version: 1, title: "Title", description: "Desc", task_type: "epic" } | HTTP 200 with updated task object reflecting all changes |
| Reject update without version field | Valid taskId, authenticated user, body without version field | HTTP 400 with error message "Version field is required for updates (optimistic locking)" and error code "INVALID_INPUT" |
| Handle non-existent task ID | Invalid/non-existent taskId, version field, authenticated user | HTTP 404 with error message "Task not found" and error code "NOT_FOUND" |
| Handle version conflict (optimistic locking) | Valid taskId, version field that doesn't match current version, authenticated user | HTTP 409 with error message "Update failed: task was modified by another user. Please refresh and try again." and error code "VERSION_CONFLICT" |
| Create audit event on successful update | Valid taskId, version matching current version, authenticated user with valid body | HTTP 200 and AuditEvent created with entity_type="TASK", entity_id=taskId, action="UPDATE", actor_id=req.user.id |
| Update task with empty fields (no-op) | Valid taskId, version matching current version, authenticated user, body with { version: 1 } (no fields to update) | HTTP 200 with task object where only version and timestamps are updated |
| Handle unauthenticated request | Valid taskId, version field, valid body, no authentication | HTTP 401 (authentication middleware response) |

### Function 4: POST /api/tasks/:taskId/approve

| Purpose | Inputs | Expected Output |
|---------|--------|-----------------|
| Successfully approve a task | Valid taskId in DRAFT status, authenticated user | HTTP 200 with task object where status = "APPROVED", last_edited_by = user.id, version incremented |
| Approve a task with other metadata preserved | Valid taskId with existing title/description, authenticated user | HTTP 200 with task object where status = "APPROVED" and all other fields remain unchanged |
| Handle non-existent task ID | Invalid/non-existent taskId, authenticated user | HTTP 404 with error message "Task not found" and error code "NOT_FOUND" |
| Create audit event on approval | Valid taskId in DRAFT status, authenticated user | HTTP 200 and AuditEvent created with entity_type="TASK", entity_id=taskId, action="APPROVE", actor_id=req.user.id |
| Handle already approved task | Valid taskId already in APPROVED status, authenticated user | HTTP 200 with task object remaining in APPROVED status (no error) |
| Handle unauthenticated request | Valid taskId, no authentication | HTTP 401 (authentication middleware response) |

### Function 5: POST /api/tasks/:taskId/reject

| Purpose | Inputs | Expected Output |
|---------|--------|-----------------|
| Successfully reject a task | Valid taskId in DRAFT status, authenticated user | HTTP 200 with task object where status = "REJECTED", last_edited_by = user.id, version incremented |
| Reject a task with other metadata preserved | Valid taskId with existing title/description, authenticated user | HTTP 200 with task object where status = "REJECTED" and all other fields remain unchanged |
| Handle non-existent task ID | Invalid/non-existent taskId, authenticated user | HTTP 404 with error message "Task not found" and error code "NOT_FOUND" |
| Create audit event on rejection | Valid taskId in DRAFT status, authenticated user | HTTP 200 and AuditEvent created with entity_type="TASK", entity_id=taskId, action="REJECT", actor_id=req.user.id |
| Handle already rejected task | Valid taskId already in REJECTED status, authenticated user | HTTP 200 with task object remaining in REJECTED status (no error) |
| Handle unauthenticated request | Valid taskId, no authentication | HTTP 401 (authentication middleware response) |

### Function 6: POST /api/batches/:batchId/bulk-update

| Purpose | Inputs | Expected Output |
|---------|--------|-----------------|
| Successfully bulk approve multiple tasks | Valid batchId, authenticated user, body with { taskIds: ["id1", "id2"], action: "approve" } | HTTP 200 with { updatedCount: 2, action: "approve", requestId, timestamp } |
| Successfully bulk reject multiple tasks | Valid batchId, authenticated user, body with { taskIds: ["id1", "id2", "id3"], action: "reject" } | HTTP 200 with { updatedCount: 3, action: "reject", requestId, timestamp } |
| Handle missing taskIds array | Valid batchId, authenticated user, body without taskIds field | HTTP 400 with error message "taskIds array is required" and error code "INVALID_INPUT" |
| Handle empty taskIds array | Valid batchId, authenticated user, body with { taskIds: [], action: "approve" } | HTTP 400 with error message "taskIds array is required" and error code "INVALID_INPUT" |
| Handle invalid action value | Valid batchId, authenticated user, body with { taskIds: ["id1"], action: "invalid" } | HTTP 400 with error message "Action must be either 'approve' or 'reject'" and error code "INVALID_INPUT" |
| Handle non-existent batch ID | Invalid/non-existent batchId, valid taskIds, valid action, authenticated user | HTTP 404 with error message "Batch not found" and error code "NOT_FOUND" |
| Create audit events for each task in bulk update | Valid batchId, authenticated user, body with valid taskIds and action | HTTP 200 and AuditEvent created for each taskId with entity_type="TASK", entity_id=taskId, action=action.toUpperCase(), actor_id=req.user.id, reason="Bulk ${action}" |
| Handle unauthenticated request | Valid batchId, valid taskIds, valid action, no authentication | HTTP 401 (authentication middleware response) |

### Function 7: POST /api/batches/:batchId/validate

| Purpose | Inputs | Expected Output |
|---------|--------|-----------------|
| Validate a valid, ready-to-publish batch | Valid batchId in DRAFT status with approved tasks, no draft tasks, authenticated user | HTTP 200 with { valid: true, errors: [], approved_count: N > 0, draft_count: 0, rejected_count: M, requestId, timestamp } |
| Validate batch with no approved tasks | Valid batchId in DRAFT status with 0 approved tasks, authenticated user | HTTP 200 with { valid: false, errors: ["No approved tasks to publish. Please approve at least one task."], approved_count: 0, draft_count: N, rejected_count: M, requestId, timestamp } |
| Validate batch with draft tasks remaining | Valid batchId in DRAFT status with approved tasks but also draft tasks, authenticated user | HTTP 200 with { valid: false, errors: ["X task(s) are still in DRAFT status and will not be published"], approved_count: N, draft_count: X, rejected_count: M, requestId, timestamp } |
| Validate batch already published | Valid batchId in PUBLISHED status, authenticated user | HTTP 200 with { valid: false, errors: ["Batch status is 'PUBLISHED', cannot publish"], approved_count: N, draft_count: 0, rejected_count: M, requestId, timestamp } |
| Validate batch already discarded | Valid batchId in DISCARDED status, authenticated user | HTTP 200 with { valid: false, errors: ["Batch status is 'DISCARDED', cannot publish"], approved_count: N, draft_count: 0, rejected_count: M, requestId, timestamp } |
| Handle non-existent batch ID | Invalid/non-existent batchId, authenticated user | HTTP 404 with error message "Batch not found" and error code "NOT_FOUND" |
| Handle unauthenticated request | Valid batchId, no authentication | HTTP 401 (authentication middleware response) |

### Function 8: POST /api/batches/:batchId/publish

| Purpose | Inputs | Expected Output |
|---------|--------|-----------------|
| Successfully publish a valid batch with dryRun=true | Valid batchId in DRAFT status with approved tasks, authenticated user, body with { idempotency_key: "key123", options: { dryRun: true } } | HTTP 200 with { published: true, publishedCount: 0, issues: array of issues with status "DRAFT", dryRun: true, requestId, timestamp } |
| Successfully publish a valid batch to Jira | Valid batchId in DRAFT status with approved tasks, authenticated user, body with { idempotency_key: "key456" } | HTTP 200 with { published: true, publishedCount: N > 0, issues: array of published issues with jiraIds, requestId, timestamp }, batch status updated to PUBLISHED |
| Handle missing idempotency_key | Valid batchId, authenticated user, body without idempotency_key | HTTP 400 with error message "idempotency_key is required" and error code "INVALID_INPUT" |
| Handle invalid batch (validation fails) | Valid batchId with no approved tasks, authenticated user, body with valid idempotency_key | HTTP 400 with { error: "Cannot publish batch", validation: { valid: false, errors: [...], ... }, requestId, timestamp } |
| Handle non-existent batch ID | Invalid/non-existent batchId, valid idempotency_key, authenticated user | HTTP 404 with error message "Batch not found" and error code "NOT_FOUND" |
| Idempotency: handle duplicate publish with same key | Valid batchId, same idempotency_key used twice, authenticated user | HTTP 200 with { published: true, publishedCount: N, issues: array, requestId, timestamp } on first call; second call returns existing published result without re-publishing |
| Create audit event on successful publish | Valid batchId, valid idempotency_key, authenticated user, successful publish | HTTP 200 and AuditEvent created with entity_type="BATCH", entity_id=batchId, action="PUBLISH", actor_id=req.user.id, reason="Batch published", diff including published_count and idempotency_key |
| Create audit event on publish failure | Valid batchId, valid idempotency_key, authenticated user, publish service throws error | AuditEvent created with entity_type="BATCH", entity_id=batchId, action="PUBLISH", reason="Publish failed: ${error.message}", then HTTP 503/500 with error |
| Update tasks with Jira issue IDs after publish | Valid batchId, valid idempotency_key, authenticated user, successful publish | HTTP 200 and GeneratedTask.update called for each task to set jira_issue_id and jira_issue_key |
| Handle unauthenticated request | Valid batchId, valid idempotency_key, no authentication | HTTP 401 (authentication middleware response) |

### Function 9: POST /api/batches/:batchId/discard

| Purpose | Inputs | Expected Output |
|---------|--------|-----------------|
| Successfully discard a batch in DRAFT status | Valid batchId in DRAFT status, authenticated user | HTTP 200 with { success: true, requestId, timestamp }, batch status updated to "DISCARDED" |
| Discard a batch with approved and draft tasks | Valid batchId in DRAFT status with mixed task statuses, authenticated user | HTTP 200 with { success: true, requestId, timestamp }, batch status updated to "DISCARDED" (tasks remain unchanged) |
| Handle non-existent batch ID | Invalid/non-existent batchId, authenticated user | HTTP 404 with error message "Batch not found" and error code "NOT_FOUND" |
| Create audit event on discard | Valid batchId in DRAFT status, authenticated user | HTTP 200 and AuditEvent created with entity_type="BATCH", entity_id=batchId, action="DISCARD", actor_id=req.user.id, reason="Batch discarded" |
| Handle unauthenticated request | Valid batchId, no authentication | HTTP 401 (authentication middleware response) |

---

## Summary

This test specification covers all 9 route handler functions in `backend/src/routes/tasks.js`, ensuring comprehensive coverage of normal cases, edge cases, and error handling for User Story #2's review, edit, approve, reject, validate, publish, and discard workflow.

**Total Test Cases:** 46 test cases across 9 functions

**Key Testing Areas:**
- Authentication and authorization
- Data validation (required fields, valid values)
- Optimistic locking (version conflicts)
- Audit trail creation
- Batch validation before publishing
- Idempotency in publishing
- Error handling for non-existent resources
- Bulk operations
- Status transitions (DRAFT → APPROVED/REJECTED)
- Dry-run mode for publishing
