/**
 * Backend Integration Tests
 * Tests the complete US1 + US2 workflow with database persistence
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { testConnection, query } from '../src/database/connection.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { SpecificationDocument } from '../src/models/SpecificationDocument.js';
import { SuggestionBatch } from '../src/models/SuggestionBatch.js';
import { GeneratedTask } from '../src/models/GeneratedTask.js';
import { AuditEvent } from '../src/models/AuditEvent.js';

describe('Backend Integration Tests', { timeout: 30000 }, async () => {
  let testUser;
  let testProject;
  let testDocument;
  let testBatch;
  let testTask1, testTask2;

  before(async () => {
    // Test database connection
    const dbConnected = await testConnection();
    assert.strictEqual(dbConnected, true, 'Database should be connected');

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123',
      role: 'ProjectLead'
    });

    // Create test project
    testProject = await Project.create({
      name: 'Test Project',
      description: 'Test project for integration tests',
      owner_id: testUser.id
    });

    // Create test document
    testDocument = await SpecificationDocument.create({
      project_id: testProject.id,
      file_name: 'test-spec.txt',
      file_type: 'txt',
      storage_key: null,
      raw_text: '# Test Specification\n\nThis is a test specification for integration testing.'
    });

    // Update document status to completed
    await testDocument.updateStatus('Completed');

    // Create test batch
    testBatch = await SuggestionBatch.create({
      document_id: testDocument.id,
      prompt_version: 'v1',
      model: 'mock',
      created_by: testUser.id
    });

    // Create test tasks
    testTask1 = await GeneratedTask.create({
      batch_id: testBatch.id,
      project_id: testProject.id,
      source: 'AI_MOCK',
      task_type: 'story',
      title: 'Test Task 1',
      description: 'This is a test task',
      acceptance_criteria: ['Criterion 1', 'Criterion 2'],
      suggested_priority: 'P2',
      suggested_story_points: 3,
      size: 'M',
      tags: ['test', 'integration'],
      flagged_as_gap: false,
      confidence_score: 0.85,
      sort_order: 0,
      generated_payload: { mock: true }
    });

    testTask2 = await GeneratedTask.create({
      batch_id: testBatch.id,
      project_id: testProject.id,
      source: 'AI_MOCK',
      task_type: 'epic',
      title: 'Test Task 2',
      description: 'This is another test task',
      acceptance_criteria: ['Criterion A', 'Criterion B'],
      suggested_priority: 'P1',
      suggested_story_points: 5,
      size: 'L',
      tags: ['test', 'epic'],
      flagged_as_gap: false,
      confidence_score: 0.90,
      sort_order: 1,
      generated_payload: { mock: true }
    });
  });

  after(async () => {
    // Cleanup
    if (testTask1) await testTask1.delete();
    if (testTask2) await testTask2.delete();
    if (testBatch) await testBatch.discard();
    if (testDocument) await testDocument.delete();
    if (testProject) await testProject.delete();
    if (testUser) await testUser.delete();
  });

  describe('User Model', () => {
    it('should create a user with hashed password', async () => {
      assert.ok(testUser.id);
      assert.strictEqual(testUser.name, 'Test User');
      assert.strictEqual(testUser.role, 'ProjectLead');
      assert.ok(testUser.password_hash); // Hashed password
    });

    it('should find user by email', async () => {
      const foundUser = await User.findByEmail(testUser.email);
      assert.ok(foundUser);
      assert.strictEqual(foundUser.id, testUser.id);
    });

    it('should verify password correctly', async () => {
      const isValid = await testUser.verifyPassword('testpassword123');
      assert.strictEqual(isValid, true);

      const isInvalid = await testUser.verifyPassword('wrongpassword');
      assert.strictEqual(isInvalid, false);
    });

    it('should get user projects', async () => {
      const projects = await testUser.getProjects();
      assert.ok(Array.isArray(projects));
      assert.strictEqual(projects.length, 1);
      assert.strictEqual(projects[0].id, testProject.id);
    });
  });

  describe('Project Model', () => {
    it('should create a project', async () => {
      assert.ok(testProject.id);
      assert.strictEqual(testProject.name, 'Test Project');
      assert.strictEqual(testProject.owner_id, testUser.id);
    });

    it('should find project by ID', async () => {
      const foundProject = await Project.findById(testProject.id);
      assert.ok(foundProject);
      assert.strictEqual(foundProject.id, testProject.id);
    });

    it('should find projects by owner', async () => {
      const projects = await Project.findByOwner(testUser.id);
      assert.ok(Array.isArray(projects));
      assert.strictEqual(projects.length, 1);
    });

    it('should get project documents', async () => {
      const documents = await testProject.getDocuments();
      assert.ok(Array.isArray(documents));
      assert.strictEqual(documents.length, 1);
      assert.strictEqual(documents[0].id, testDocument.id);
    });
  });

  describe('Specification Document Model', () => {
    it('should create a document', async () => {
      assert.ok(testDocument.id);
      assert.strictEqual(testDocument.file_name, 'test-spec.txt');
      assert.strictEqual(testDocument.project_id, testProject.id);
      assert.strictEqual(testDocument.status, 'Completed');
    });

    it('should find document by ID', async () => {
      const foundDoc = await SpecificationDocument.findById(testDocument.id);
      assert.ok(foundDoc);
      assert.strictEqual(foundDoc.id, testDocument.id);
    });

    it('should get suggestion batches', async () => {
      const batches = await testDocument.getSuggestionBatches();
      assert.ok(Array.isArray(batches));
      assert.strictEqual(batches.length, 1);
      assert.strictEqual(batches[0].id, testBatch.id);
    });
  });

  describe('Suggestion Batch Model', () => {
    it('should create a batch', async () => {
      assert.ok(testBatch.id);
      assert.strictEqual(testBatch.document_id, testDocument.id);
      assert.strictEqual(testBatch.status, 'DRAFT');
      assert.strictEqual(testBatch.created_by, testUser.id);
    });

    it('should get tasks in batch', async () => {
      const tasks = await testBatch.getTasks();
      assert.ok(Array.isArray(tasks));
      assert.strictEqual(tasks.length, 2);
    });

    it('should validate batch', async () => {
      const validation = await testBatch.validate();
      // Should fail because no approved tasks
      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.length > 0);
    });
  });

  describe('Generated Task Model (US2 Core)', () => {
    it('should create a task', async () => {
      assert.ok(testTask1.id);
      assert.strictEqual(testTask1.batch_id, testBatch.id);
      assert.strictEqual(testTask1.task_type, 'story');
      assert.strictEqual(testTask1.title, 'Test Task 1');
      assert.strictEqual(testTask1.status, 'DRAFT');
      assert.strictEqual(testTask1.version, 1);
    });

    it('should edit a task with optimistic locking', async () => {
      const updatedTask = await testTask1.update(
        { title: 'Updated Test Task 1' },
        1 // Expected version
      );

      assert.strictEqual(updatedTask.title, 'Updated Test Task 1');
      assert.strictEqual(updatedTask.version, 2); // Version incremented

      // Try to update with old version (should fail)
      try {
        await updatedTask.update({ title: 'Another Update' }, 1);
        assert.fail('Should have thrown version conflict error');
      } catch (error) {
        assert.strictEqual(error.code, 'VERSION_CONFLICT');
      }
    });

    it('should approve a task', async () => {
      const approvedTask = await testTask2.approve(testUser.id);
      assert.strictEqual(approvedTask.status, 'APPROVED');
      assert.strictEqual(approvedTask.last_edited_by, testUser.id);
    });

    it('should reject a task', async () => {
      const rejectedTask = await testTask2.reject(testUser.id);
      assert.strictEqual(rejectedTask.status, 'REJECTED');
    });

    it('should bulk update tasks', async () => {
      const updatedCount = await GeneratedTask.bulkUpdateStatus(
        [testTask1.id],
        'APPROVED',
        testUser.id
      );

      assert.strictEqual(updatedCount, 1);

      // Verify status changed
      const updatedTask = await GeneratedTask.findById(testTask1.id);
      assert.strictEqual(updatedTask.status, 'APPROVED');
    });

    it('should get approved tasks', async () => {
      const approvedTasks = await testBatch.getApprovedTasks();
      assert.ok(Array.isArray(approvedTasks));
      assert.ok(approvedTasks.length > 0);
      approvedTasks.forEach(task => {
        assert.strictEqual(task.status, 'APPROVED');
      });
    });
  });

  describe('Audit Event Model', () => {
    it('should create an audit event', async () => {
      const auditEvent = await AuditEvent.create({
        entity_type: 'TASK',
        entity_id: testTask1.id,
        action: 'UPDATE',
        actor_id: testUser.id,
        reason: 'Task edited during test',
        request_id: 'test-request-123'
      });

      assert.ok(auditEvent.id);
      assert.strictEqual(auditEvent.entity_type, 'TASK');
      assert.strictEqual(auditEvent.entity_id, testTask1.id);
      assert.strictEqual(auditEvent.action, 'UPDATE');
      assert.strictEqual(auditEvent.actor_id, testUser.id);
    });

    it('should find events by entity', async () => {
      const events = await AuditEvent.findByEntity('TASK', testTask1.id);
      assert.ok(Array.isArray(events));
      assert.ok(events.length > 0);
    });

    it('should find events by actor', async () => {
      const events = await AuditEvent.findByActor(testUser.id);
      assert.ok(Array.isArray(events));
      assert.ok(events.length > 0);
    });
  });

  describe('Complete US1-US2 Workflow', () => {
    it('should complete full workflow', async () => {
      // 1. Document already created (Completed status)
      assert.strictEqual(testDocument.status, 'Completed');

      // 2. Batch already created (DRAFT status)
      assert.strictEqual(testBatch.status, 'DRAFT');

      // 3. Tasks already created (DRAFT status)
      const tasks = await testBatch.getTasks();
      assert.strictEqual(tasks.length, 2);
      assert.strictEqual(tasks[0].status, 'APPROVED'); // Set in earlier test
      assert.strictEqual(tasks[1].status, 'REJECTED'); // Set in earlier test

      // 4. Validate batch (should pass now with approved task)
      const validation = await testBatch.validate();
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.approved_count, 1);

      // 5. Publish batch (with idempotency)
      const publishResult = await testBatch.publish(testUser.id, 'test-idempotency-key-123');
      assert.strictEqual(publishResult.already_published, false);
      assert.strictEqual(publishResult.published_count, 1);

      // 6. Verify batch status changed
      const updatedBatch = await SuggestionBatch.findById(testBatch.id);
      assert.strictEqual(updatedBatch.status, 'PUBLISHED');
      assert.strictEqual(updatedBatch.idempotency_key_last_publish, 'test-idempotency-key-123');

      // 7. Verify idempotency (should return existing result)
      const idempotentResult = await updatedBatch.publish(testUser.id, 'test-idempotency-key-123');
      assert.strictEqual(idempotentResult.already_published, true);

      console.log('✓ Complete US1-US2 workflow test passed');
    });
  });

  describe('Database Connection Pool', () => {
    it('should support concurrent queries', async () => {
      // Run multiple concurrent queries
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          query('SELECT NOW()')
        );
      }

      const results = await Promise.all(promises);
      assert.strictEqual(results.length, 10);
      results.forEach(result => {
        assert.ok(result.rows[0].now);
      });

      console.log('✓ Concurrent query test passed (10 queries)');
    });
  });
});

console.log('Running backend integration tests...');
