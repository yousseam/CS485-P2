# Backend Test Specification - US1 - SuggestionBatch

## User Story
**US1:** As a project lead, I want the AI to automatically break a specification into suggested Jira issues so that I save time on manual task creation.

## Code File Under Test
`backend/src/models/SuggestionBatch.js`

## Why This File Was Chosen
`SuggestionBatch.js` directly supports User Story 1 by representing one AI generation session tied to a specification document. It persists suggestion batches, retrieves generated tasks, validates whether a batch is ready for publishing, and supports idempotent publishing behavior. This makes it a core backend component of the AI-generated issue workflow. 

## Functions in the Code File
- `constructor(data)`
- `static create({ document_id, prompt_version, model, created_by })`
- `static findById(id)`
- `static findByDocument(document_id)`
- `publish(publishedBy, idempotencyKey)`
- `discard()`
- `getTasks()`
- `getApprovedTasks()`
- `validate()`
- `toJSON()`

## Test Cases

| Function | Test Purpose | Test Input | Expected Output |
|---|---|---|---|
| `constructor(data)` | Create a batch object with provided values | `data = { id: "batch-1", document_id: "doc-1", status: "DRAFT", prompt_version: "v1", model: "gpt-4", created_by: "user-1" }` | A `SuggestionBatch` object is created with matching field values |
| `constructor(data)` | Apply default values when optional values are missing | `data = { document_id: "doc-1", created_by: "user-1" }` | Object is created with default `status = "DRAFT"` and generated `id` |
| `static create(...)` | Create a batch successfully when required fields are provided | `{ document_id: "doc-1", prompt_version: "v1", model: "gpt-4", created_by: "user-1" }` | Returns a new `SuggestionBatch` object with `status = "DRAFT"` |
| `static create(...)` | Reject create when `document_id` is missing | `{ prompt_version: "v1", model: "gpt-4", created_by: "user-1" }` | Throws `ApiError` with message `"document_id and created_by are required"` |
| `static create(...)` | Reject create when `created_by` is missing | `{ document_id: "doc-1", prompt_version: "v1", model: "gpt-4" }` | Throws `ApiError` with message `"document_id and created_by are required"` |
| `static findById(id)` | Return a batch when it exists | `"batch-1"` | Returns a `SuggestionBatch` object for that ID |
| `static findById(id)` | Return `null` when no batch exists | `"missing-batch"` | Returns `null` |
| `static findByDocument(document_id)` | Return all batches for a document | `"doc-1"` | Returns an array of `SuggestionBatch` objects |
| `static findByDocument(document_id)` | Return empty array when document has no batches | `"doc-empty"` | Returns `[]` |
| `publish(publishedBy, idempotencyKey)` | Return existing published result when the same idempotency key is reused | `publishedBy = "user-1", idempotencyKey = "same-key"` on a batch whose `idempotency_key_last_publish` is already `"same-key"` | Returns `{ already_published: true, published_count: <count>, issues: [...] }` without publishing again |
| `publish(publishedBy, idempotencyKey)` | Publish successfully when a new idempotency key is used | `publishedBy = "user-1", idempotencyKey = "new-key"` | Returns `{ already_published: false, published_count: <count>, issues: [...] }` after updating batch status and returning approved task issue info |
| `discard()` | Mark a batch as discarded | batch instance with `id = "batch-1"` | Updates batch status to `DISCARDED` and returns `true` |
| `getTasks()` | Return all tasks in the batch | batch instance with `id = "batch-1"` | Returns an array of plain task objects for that batch |
| `getTasks()` | Return empty array when batch has no tasks | batch instance with `id = "batch-empty"` | Returns `[]` |
| `getApprovedTasks()` | Return only approved tasks in the batch | batch instance with `id = "batch-1"` | Returns an array containing only tasks whose `status` is `"APPROVED"` |
| `getApprovedTasks()` | Return empty array when there are no approved tasks | batch instance with `id = "batch-no-approved"` | Returns `[]` |
| `validate()` | Return valid result when batch is publishable | batch with `status = "DRAFT"`, approved tasks present, no draft tasks remaining | Returns `{ valid: true, errors: [], approved_count: >0, draft_count: 0, rejected_count: <count> }` |
| `validate()` | Reject validation when batch status is not `DRAFT` | batch with `status = "PUBLISHED"` | Returns `valid: false` and includes error `"Batch status is 'PUBLISHED', cannot publish"` |
| `validate()` | Reject validation when no approved tasks exist | batch with zero approved tasks | Returns `valid: false` and includes error `"No approved tasks to publish. Please approve at least one task."` |
| `validate()` | Warn when draft tasks still exist | batch with one or more tasks still in `DRAFT` | Returns `valid: false` and includes error stating how many tasks remain in draft status |
| `validate()` | Report correct task counts | batch with approved, draft, and rejected tasks | Returns correct `approved_count`, `draft_count`, and `rejected_count` values |
| `toJSON()` | Convert batch to API-ready plain object | batch instance with populated fields | Returns plain object containing `id`, `document_id`, `status`, `prompt_version`, `model`, `created_by`, `created_at`, `published_at`, and `published_by` |
| `toJSON()` | Exclude methods and non-serialized behavior | batch instance | Returned value is a plain object and does not include class methods like `publish`, `discard`, or `validate` |

## Notes on Test Design
These unit tests should mock the database layer, specifically `query` and `transaction`, so the tests remain isolated and do not hit the real PostgreSQL database. This matches the assignment requirement that tests remain isolated and use mocks where needed instead of depending on the other end of the system. 
