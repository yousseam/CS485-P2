/**
 * Unit Tests for Tasks Routes
 * Tests for User Story #2: Review, edit, approve, reject, validate, publish, and discard tasks
 */

import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock all dependencies
const mockQuery = jest.fn();
const mockTransaction = jest.fn();
const mockAuditEventCreate = jest.fn();
const mockGeneratedTaskFindById = jest.fn();
const mockGeneratedTaskUpdate = jest.fn();
const mockGeneratedTaskBulkUpdateStatus = jest.fn();
const mockBatchFindById = jest.fn();
const mockBatchGetTasks = jest.fn();
const mockBatchGetApprovedTasks = jest.fn();
const mockBatchValidate = jest.fn();
const mockBatchPublish = jest.fn();
const mockBatchDiscard = jest.fn();
const mockPublishIssues = jest.fn();

jest.unstable_mockModule('../src/database/connection.js', () => ({
  query: mockQuery,
  transaction: mockTransaction
}));

jest.unstable_mockModule('../src/middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'user-1', email: 'test@example.com' };
    next();
  }
}));

jest.unstable_mockModule('../src/middleware/errorHandler.js', () => ({
  asyncHandler: (fn) => async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  },
  ApiError: class ApiError extends Error {
    constructor(message, code, statusCode) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
    }
  },
  ErrorCodes: {
    INVALID_INPUT: 'INVALID_INPUT',
    VERSION_CONFLICT: 'VERSION_CONFLICT',
    NOT_FOUND: 'NOT_FOUND',
    INVALID_ISSUES: 'INVALID_ISSUES',
    PUBLISH_ERR: 'PUBLISH_ERR'
  }
}));

jest.unstable_mockModule('../src/models/AuditEvent.js', () => ({
  AuditEvent: {
    create: mockAuditEventCreate
  }
}));

jest.unstable_mockModule('../src/models/GeneratedTask.js', () => ({
  GeneratedTask: {
    findById: mockGeneratedTaskFindById,
    update: mockGeneratedTaskUpdate,
    bulkUpdateStatus: mockGeneratedTaskBulkUpdateStatus
  }
}));

jest.unstable_mockModule('../src/models/SuggestionBatch.js', () => ({
  SuggestionBatch: {
    findById: mockBatchFindById
  }
}));

jest.unstable_mockModule('../src/services/jiraPublisher.js', () => ({
  publishIssues: mockPublishIssues
}));

// Import the router after mocking all dependencies
const { default: tasksRouter } = await import('../src/routes/tasks.js');

// Sample test data
const createSampleBatch = (status = 'DRAFT') => ({
  id: 'batch-1',
  document_id: 'doc-1',
  status,
  toJSON: () => ({ id: 'batch-1', status }),
  getTasks: mockBatchGetTasks,
  getApprovedTasks: mockBatchGetApprovedTasks,
  validate: mockBatchValidate,
  publish: mockBatchPublish,
  discard: mockBatchDiscard
});

const createSampleTask = (status = 'DRAFT') => {
  const createTaskObject = (taskStatus) => {
    const task = {
      id: 'task-1',
      batch_id: 'batch-1',
      project_id: 'proj-1',
      task_type: 'story',
      title: 'Test Task',
      description: 'Test Description',
      acceptance_criteria: ['Criteria 1'],
      status: taskStatus,
      version: 1,
      sort_order: 0,
      update: mockGeneratedTaskUpdate
    };

    task.approve = jest.fn().mockImplementation(async () => {
      const approved = createTaskObject('APPROVED');
      approved.version = 2;
      approved.last_edited_by = 'user-1';
      return approved;
    });

    task.reject = jest.fn().mockImplementation(async () => {
      const rejected = createTaskObject('REJECTED');
      rejected.version = 2;
      rejected.last_edited_by = 'user-1';
      return rejected;
    });

    task.toJSON = () => ({ ...task });

    return task;
  };

  return createTaskObject(status);
};

// Create Express app for testing
const app = express();
app.use(express.json());

// Add request ID middleware
app.use((req, res, next) => {
  req.id = 'test-req-id';
  next();
});

app.use('/api/tasks', tasksRouter);

// Add error handler middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

describe('Tasks Routes - User Story #2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Function 1: GET /api/batches/:batchId
  // ============================================
  describe('GET /api/tasks/batches/:batchId', () => {
    it('should retrieve all tasks for a valid batch ID', async () => {
      const batch = createSampleBatch();
      const task = createSampleTask();

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchGetTasks.mockResolvedValue([task]);

      const response = await request(app)
        .get('/api/tasks/batches/batch-1')
        .expect(200);

      expect(response.body).toMatchObject({
        batch: expect.any(Object),
        tasks: expect.any(Array)
      });
      expect(mockBatchGetTasks).toHaveBeenCalled();
    });

    it('should return 404 for non-existent batch ID', async () => {
      mockBatchFindById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tasks/batches/non-existent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Batch not found',
        code: 'NOT_FOUND'
      });
    });

    it('should return empty tasks array for batch with no tasks', async () => {
      const batch = createSampleBatch();

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchGetTasks.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/tasks/batches/batch-1')
        .expect(200);

      expect(response.body.tasks).toEqual([]);
    });
  });

  // ============================================
  // Function 2: GET /api/tasks/:taskId
  // ============================================
  describe('GET /api/tasks/:taskId', () => {
    it('should retrieve a specific task by valid ID', async () => {
      const task = createSampleTask();

      mockGeneratedTaskFindById.mockResolvedValue(task);

      const response = await request(app)
        .get('/api/tasks/task-1')
        .expect(200);

      expect(response.body).toMatchObject({
        task: expect.any(Object)
      });
    });

    it('should return 404 for non-existent task ID', async () => {
      mockGeneratedTaskFindById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tasks/non-existent')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Task not found',
        code: 'NOT_FOUND'
      });
    });

    it('should return task with all metadata fields', async () => {
      const task = createSampleTask();

      mockGeneratedTaskFindById.mockResolvedValue(task);

      const response = await request(app)
        .get('/api/tasks/task-1')
        .expect(200);

      expect(response.body.task).toMatchObject({
        id: 'task-1',
        batch_id: 'batch-1',
        task_type: 'story',
        title: 'Test Task',
        description: 'Test Description',
        status: 'DRAFT',
        version: 1
      });
    });
  });

  // ============================================
  // Function 3: PATCH /api/tasks/:taskId
  // ============================================
  describe('PATCH /api/tasks/:taskId', () => {
    it('should successfully update task title', async () => {
      const task = createSampleTask();
      const updatedTask = { ...task, title: 'New Title', version: 2 };

      mockGeneratedTaskFindById.mockResolvedValue(task);
      mockGeneratedTaskUpdate.mockResolvedValue(updatedTask);

      const response = await request(app)
        .patch('/api/tasks/task-1')
        .send({ version: 1, title: 'New Title' })
        .expect(200);

      expect(mockGeneratedTaskUpdate).toHaveBeenCalledWith({ title: 'New Title' }, 1);
      expect(mockAuditEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'TASK',
          entity_id: 'task-1',
          action: 'UPDATE',
          actor_id: 'user-1'
        })
      );
    });

    it('should successfully update multiple fields', async () => {
      const task = createSampleTask();
      const updatedTask = {
        ...task,
        title: 'Updated Title',
        description: 'Updated Description',
        task_type: 'epic',
        version: 2
      };

      mockGeneratedTaskFindById.mockResolvedValue(task);
      mockGeneratedTaskUpdate.mockResolvedValue(updatedTask);

      const response = await request(app)
        .patch('/api/tasks/task-1')
        .send({
          version: 1,
          title: 'Updated Title',
          description: 'Updated Description',
          task_type: 'epic'
        })
        .expect(200);

      expect(mockGeneratedTaskUpdate).toHaveBeenCalledWith(
        {
          title: 'Updated Title',
          description: 'Updated Description',
          task_type: 'epic'
        },
        1
      );
    });

    it('should reject update without version field', async () => {
      const response = await request(app)
        .patch('/api/tasks/task-1')
        .send({ title: 'New Title' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Version field is required for updates (optimistic locking)',
        code: 'INVALID_INPUT'
      });
    });

    it('should return 404 for non-existent task ID', async () => {
      mockGeneratedTaskFindById.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/tasks/non-existent')
        .send({ version: 1, title: 'New Title' })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Task not found',
        code: 'NOT_FOUND'
      });
    });

    it('should handle version conflict (optimistic locking)', async () => {
      const task = createSampleTask();
      const { ApiError } = await import('../src/middleware/errorHandler.js');

      mockGeneratedTaskFindById.mockResolvedValue(task);
      mockGeneratedTaskUpdate.mockRejectedValue(
        new ApiError(
          'Update failed: task was modified by another user. Please refresh and try again.',
          'VERSION_CONFLICT',
          409
        )
      );

      const response = await request(app)
        .patch('/api/tasks/task-1')
        .send({ version: 1, title: 'New Title' })
        .expect(409);

      expect(response.body).toMatchObject({
        code: 'VERSION_CONFLICT'
      });
    });
  });

  // ============================================
  // Function 4: POST /api/tasks/:taskId/approve
  // ============================================
  describe('POST /api/tasks/:taskId/approve', () => {
    it('should successfully approve a task', async () => {
      const task = createSampleTask();

      mockGeneratedTaskFindById.mockResolvedValue(task);

      const response = await request(app)
        .post('/api/tasks/task-1/approve')
        .expect(200);

      expect(task.approve).toHaveBeenCalledWith('user-1');
      expect(mockAuditEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'TASK',
          entity_id: 'task-1',
          action: 'APPROVE',
          actor_id: 'user-1'
        })
      );
    });

    it('should preserve other metadata when approving', async () => {
      const task = createSampleTask();

      mockGeneratedTaskFindById.mockResolvedValue(task);

      const response = await request(app)
        .post('/api/tasks/task-1/approve')
        .expect(200);

      expect(response.body.task.status).toBe('APPROVED');
      expect(response.body.task.title).toBe('Test Task');
      expect(response.body.task.description).toBe('Test Description');
    });

    it('should return 404 for non-existent task ID', async () => {
      mockGeneratedTaskFindById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/tasks/non-existent/approve')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Task not found',
        code: 'NOT_FOUND'
      });
    });
  });

  // ============================================
  // Function 5: POST /api/tasks/:taskId/reject
  // ============================================
  describe('POST /api/tasks/:taskId/reject', () => {
    it('should successfully reject a task', async () => {
      const task = createSampleTask();

      mockGeneratedTaskFindById.mockResolvedValue(task);

      const response = await request(app)
        .post('/api/tasks/task-1/reject')
        .expect(200);

      expect(task.reject).toHaveBeenCalledWith('user-1');
      expect(mockAuditEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'TASK',
          entity_id: 'task-1',
          action: 'REJECT',
          actor_id: 'user-1'
        })
      );
    });

    it('should preserve other metadata when rejecting', async () => {
      const task = createSampleTask();

      mockGeneratedTaskFindById.mockResolvedValue(task);

      const response = await request(app)
        .post('/api/tasks/task-1/reject')
        .expect(200);

      expect(response.body.task.status).toBe('REJECTED');
      expect(response.body.task.title).toBe('Test Task');
      expect(response.body.task.description).toBe('Test Description');
    });

    it('should return 404 for non-existent task ID', async () => {
      mockGeneratedTaskFindById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/tasks/non-existent/reject')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Task not found',
        code: 'NOT_FOUND'
      });
    });
  });

  // ============================================
  // Function 6: POST /api/batches/:batchId/bulk-update
  // ============================================
  describe('POST /api/tasks/batches/:batchId/bulk-update', () => {
    it('should successfully bulk approve multiple tasks', async () => {
      const batch = createSampleBatch();

      mockBatchFindById.mockResolvedValue(batch);
      mockGeneratedTaskBulkUpdateStatus.mockResolvedValue(2);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/bulk-update')
        .send({ taskIds: ['task-1', 'task-2'], action: 'approve' })
        .expect(200);

      expect(response.body).toMatchObject({
        updatedCount: 2,
        action: 'approve'
      });
      expect(mockGeneratedTaskBulkUpdateStatus).toHaveBeenCalledWith(['task-1', 'task-2'], 'APPROVE', 'user-1');
    });

    it('should successfully bulk reject multiple tasks', async () => {
      const batch = createSampleBatch();

      mockBatchFindById.mockResolvedValue(batch);
      mockGeneratedTaskBulkUpdateStatus.mockResolvedValue(3);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/bulk-update')
        .send({ taskIds: ['task-1', 'task-2', 'task-3'], action: 'reject' })
        .expect(200);

      expect(response.body).toMatchObject({
        updatedCount: 3,
        action: 'reject'
      });
      expect(mockGeneratedTaskBulkUpdateStatus).toHaveBeenCalledWith(['task-1', 'task-2', 'task-3'], 'REJECT', 'user-1');
    });

    it('should handle missing taskIds array', async () => {
      const response = await request(app)
        .post('/api/tasks/batches/batch-1/bulk-update')
        .send({ action: 'approve' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'taskIds array is required',
        code: 'INVALID_INPUT'
      });
    });

    it('should handle empty taskIds array', async () => {
      const response = await request(app)
        .post('/api/tasks/batches/batch-1/bulk-update')
        .send({ taskIds: [], action: 'approve' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'taskIds array is required',
        code: 'INVALID_INPUT'
      });
    });

    it('should handle invalid action value', async () => {
      const response = await request(app)
        .post('/api/tasks/batches/batch-1/bulk-update')
        .send({ taskIds: ['task-1'], action: 'invalid' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Action must be either "approve" or "reject"',
        code: 'INVALID_INPUT'
      });
    });

    it('should return 404 for non-existent batch ID', async () => {
      mockBatchFindById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/tasks/batches/non-existent/bulk-update')
        .send({ taskIds: ['task-1'], action: 'approve' })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Batch not found',
        code: 'NOT_FOUND'
      });
    });
  });

  // ============================================
  // Function 7: POST /api/batches/:batchId/validate
  // ============================================
  describe('POST /api/tasks/batches/:batchId/validate', () => {
    it('should validate a valid, ready-to-publish batch', async () => {
      const batch = createSampleBatch();
      const validation = {
        valid: true,
        errors: [],
        approved_count: 3,
        draft_count: 0,
        rejected_count: 1
      };

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchValidate.mockResolvedValue(validation);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/validate')
        .expect(200);

      expect(response.body).toMatchObject({
        valid: true,
        errors: [],
        approved_count: 3,
        draft_count: 0,
        rejected_count: 1
      });
    });

    it('should validate batch with no approved tasks', async () => {
      const batch = createSampleBatch();
      const validation = {
        valid: false,
        errors: ['No approved tasks to publish. Please approve at least one task.'],
        approved_count: 0,
        draft_count: 5,
        rejected_count: 0
      };

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchValidate.mockResolvedValue(validation);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/validate')
        .expect(200);

      expect(response.body).toMatchObject({
        valid: false,
        errors: expect.arrayContaining([expect.stringContaining('No approved tasks')])
      });
    });

    it('should validate batch with draft tasks remaining', async () => {
      const batch = createSampleBatch();
      const validation = {
        valid: false,
        errors: ['2 task(s) are still in DRAFT status and will not be published'],
        approved_count: 3,
        draft_count: 2,
        rejected_count: 0
      };

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchValidate.mockResolvedValue(validation);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/validate')
        .expect(200);

      expect(response.body).toMatchObject({
        valid: false,
        draft_count: 2
      });
    });

    it('should validate batch already published', async () => {
      const batch = createSampleBatch('PUBLISHED');
      const validation = {
        valid: false,
        errors: ["Batch status is 'PUBLISHED', cannot publish"],
        approved_count: 3,
        draft_count: 0,
        rejected_count: 1
      };

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchValidate.mockResolvedValue(validation);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/validate')
        .expect(200);

      expect(response.body).toMatchObject({
        valid: false,
        errors: expect.arrayContaining([expect.stringContaining('PUBLISHED')])
      });
    });

    it('should return 404 for non-existent batch ID', async () => {
      mockBatchFindById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/tasks/batches/non-existent/validate')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Batch not found',
        code: 'NOT_FOUND'
      });
    });
  });

  // ============================================
  // Function 8: POST /api/batches/:batchId/publish
  // ============================================
  describe('POST /api/tasks/batches/:batchId/publish', () => {
    it('should successfully publish a valid batch with dryRun=true', async () => {
      const batch = createSampleBatch();
      const validation = { valid: true, errors: [] };
      const approvedTasks = [createSampleTask()];
      const publishResult = {
        publishedCount: 0,
        issues: [{ id: 'task-1', status: 'DRAFT' }],
        dryRun: true
      };

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchValidate.mockResolvedValue(validation);
      mockBatchGetApprovedTasks.mockResolvedValue(approvedTasks);
      mockPublishIssues.mockResolvedValue(publishResult);
      mockBatchPublish.mockResolvedValue({
        already_published: false,
        published_count: 0,
        issues: []
      });

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/publish')
        .send({ idempotency_key: 'key123', options: { dryRun: true } })
        .expect(200);

      expect(response.body).toMatchObject({
        published: true,
        publishedCount: 0
      });
      expect(mockPublishIssues).toHaveBeenCalledWith(
        approvedTasks,
        expect.objectContaining({ dryRun: true })
      );
    });

    it('should successfully publish a valid batch to Jira', async () => {
      const batch = createSampleBatch();
      const validation = { valid: true, errors: [] };
      const approvedTasks = [createSampleTask()];
      const publishResult = {
        publishedCount: 1,
        issues: [{ id: 'task-1', jiraId: 'ABC-1234', key: 'ABC-1234' }],
        projectKey: 'ABC',
        projectName: 'Project ABC'
      };

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchValidate.mockResolvedValue(validation);
      mockBatchGetApprovedTasks.mockResolvedValue(approvedTasks);
      mockPublishIssues.mockResolvedValue(publishResult);
      mockBatchPublish.mockResolvedValue({
        already_published: false,
        published_count: 1,
        issues: [{ id: 'task-1', jira_issue_id: '1234', jira_issue_key: 'ABC-1234' }]
      });

      // Mock the task.update() call that happens after publishing
      mockGeneratedTaskUpdate.mockResolvedValue(approvedTasks[0]);


      const response = await request(app)
        .post('/api/tasks/batches/batch-1/publish')
        .send({ idempotency_key: "key456" })

      expect(response.body).toMatchObject({
        published: true,
        publishedCount: 1
      });
      expect(mockBatchPublish).toHaveBeenCalledWith('user-1', 'key456');
      expect(mockAuditEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'BATCH',
          entity_id: 'batch-1',
          action: 'PUBLISH',
          actor_id: 'user-1'
        })
      );
    });

    it('should handle missing idempotency_key', async () => {
      const response = await request(app)
        .post('/api/tasks/batches/batch-1/publish')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'idempotency_key is required',
        code: 'INVALID_INPUT'
      });
    });

    it('should handle invalid batch (validation fails)', async () => {
      const batch = createSampleBatch();
      const validation = {
        valid: false,
        errors: ['No approved tasks to publish'],
        approved_count: 0
      };

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchValidate.mockResolvedValue(validation);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/publish')
        .send({ idempotency_key: 'key123' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Cannot publish batch',
        validation: expect.any(Object)
      });
    });

    it('should return 404 for non-existent batch ID', async () => {
      mockBatchFindById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/tasks/batches/non-existent/publish')
        .send({ idempotency_key: 'key123' })
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Batch not found',
        code: 'NOT_FOUND'
      });
    });

    it('should handle idempotency: duplicate publish with same key', async () => {
      const batch = createSampleBatch();
      const validation = { valid: true, errors: [] };
      const approvedTasks = [createSampleTask()];
      const publishResult = {
        publishedCount: 1,
        issues: [{ id: 'task-1', jiraId: 'ABC-1234', key: 'ABC-1234' }]
      };

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchValidate.mockResolvedValue(validation);
      mockBatchGetApprovedTasks.mockResolvedValue(approvedTasks);
      mockPublishIssues.mockResolvedValue(publishResult);

      // First publish: returns not already published
      mockBatchPublish.mockResolvedValueOnce({
        published_count: 1,
        issues: [{ id: 'task-1' }]
      });

      // Mock the task.update() call that happens after publishing
      mockGeneratedTaskUpdate.mockResolvedValue(approvedTasks[0]);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/publish')
        .send({ idempotency_key: 'key123' })
        .expect(200);

      expect(mockBatchPublish).toHaveBeenCalledWith('user-1', 'key123');
    });

    it('should create audit event on publish failure', async () => {
      const batch = createSampleBatch();
      const validation = { valid: true, errors: [] };
      const approvedTasks = [createSampleTask()];

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchValidate.mockResolvedValue(validation);
      mockBatchGetApprovedTasks.mockResolvedValue(approvedTasks);
      mockPublishIssues.mockRejectedValue(new Error('Publish failed'));

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/publish')
        .send({ idempotency_key: 'key123' })
        .expect(500);

      // Audit event should be created for failure
      expect(mockAuditEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'BATCH',
          entity_id: 'batch-1',
          action: 'PUBLISH',
          reason: expect.stringContaining('Publish failed')
        })
      );
    });
  });

  // ============================================
  // Function 9: POST /api/batches/:batchId/discard
  // ============================================
  describe('POST /api/tasks/batches/:batchId/discard', () => {
    it('should successfully discard a batch in DRAFT status', async () => {
      const batch = createSampleBatch();

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchDiscard.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/discard')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true
      });
      expect(mockBatchDiscard).toHaveBeenCalled();
      expect(mockAuditEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'BATCH',
          entity_id: 'batch-1',
          action: 'DISCARD',
          actor_id: 'user-1',
          reason: 'Batch discarded'
        })
      );
    });

    it('should discard a batch with approved and draft tasks', async () => {
      const batch = createSampleBatch();

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchDiscard.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/discard')
        .expect(200);

      expect(mockBatchDiscard).toHaveBeenCalled();
    });

    it('should return 404 for non-existent batch ID', async () => {
      mockBatchFindById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/tasks/batches/non-existent/discard')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Batch not found',
        code: 'NOT_FOUND'
      });
    });

    it('should create audit event on discard', async () => {
      const batch = createSampleBatch();

      mockBatchFindById.mockResolvedValue(batch);
      mockBatchDiscard.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/tasks/batches/batch-1/discard')
        .expect(200);

      expect(mockAuditEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'BATCH',
          entity_id: 'batch-1',
          action: 'DISCARD',
          actor_id: 'user-1',
          reason: 'Batch discarded'
        })
      );
    });
  });
});
