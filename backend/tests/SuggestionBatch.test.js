import { jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockTransaction = jest.fn();

jest.unstable_mockModule('../src/database/connection.js', () => ({
    query: mockQuery,
    transaction: mockTransaction
  }));
  const { default: SuggestionBatch } = await import('../src/models/SuggestionBatch.js');

describe('SuggestionBatch model', () => {
  const baseBatchRow = {
    id: 'batch-1',
    document_id: 'doc-1',
    status: 'DRAFT',
    prompt_version: 'v1',
    model: 'gpt-test',
    created_by: 'user-1',
    created_at: new Date(),
    published_at: null,
    published_by: null,
    idempotency_key_last_publish: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('creates object with provided values', () => {
      const batch = new SuggestionBatch(baseBatchRow);

      expect(batch.id).toBe('batch-1');
      expect(batch.document_id).toBe('doc-1');
      expect(batch.status).toBe('DRAFT');
    });

    test('applies default values', () => {
      const batch = new SuggestionBatch({
        document_id: 'doc-1',
        created_by: 'user-1'
      });

      expect(batch.status).toBe('DRAFT');
      expect(batch.id).toBeDefined();
    });
  });

  describe('create', () => {
    test('creates batch successfully', async () => {
      mockQuery.mockResolvedValue({ rows: [baseBatchRow] });

      const result = await SuggestionBatch.create({
        document_id: 'doc-1',
        prompt_version: 'v1',
        model: 'gpt-test',
        created_by: 'user-1'
      });

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toBeInstanceOf(SuggestionBatch);
    });

    test('throws if document_id missing', async () => {
      await expect(
        SuggestionBatch.create({
          created_by: 'user-1'
        })
      ).rejects.toThrow();
    });

    test('throws if created_by missing', async () => {
      await expect(
        SuggestionBatch.create({
          document_id: 'doc-1'
        })
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    test('returns batch when found', async () => {
      mockQuery.mockResolvedValue({ rows: [baseBatchRow] });

      const result = await SuggestionBatch.findById('batch-1');

      expect(result).toBeInstanceOf(SuggestionBatch);
    });

    test('returns null when not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await SuggestionBatch.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByDocument', () => {
    test('returns batches', async () => {
      mockQuery.mockResolvedValue({ rows: [baseBatchRow] });

      const result = await SuggestionBatch.findByDocument('doc-1');

      expect(result.length).toBe(1);
    });

    test('returns empty array if none', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await SuggestionBatch.findByDocument('doc-1');

      expect(result).toEqual([]);
    });
  });

  describe('publish', () => {
    test('handles duplicate publish', async () => {
      const batch = new SuggestionBatch({
        ...baseBatchRow,
        idempotency_key_last_publish: 'same-key'
      });

      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ id: 'task-1', jira_issue_id: '1', jira_issue_key: 'KEY-1' }]
        })
      };

      mockTransaction.mockImplementation(async (cb) => cb(mockClient));

      const result = await batch.publish('user-1', 'same-key');

      expect(result.already_published).toBe(true);
    });

    test('publishes normally', async () => {
      const batch = new SuggestionBatch(baseBatchRow);

      const mockClient = {
        query: jest
          .fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({
            rows: [{ id: 'task-1', jira_issue_id: '1', jira_issue_key: 'KEY-1' }]
          })
      };

      mockTransaction.mockImplementation(async (cb) => cb(mockClient));

      const result = await batch.publish('user-1', 'new-key');

      expect(result.already_published).toBe(false);
    });
  });

  describe('discard', () => {
    test('returns true', async () => {
      mockQuery.mockResolvedValue({});

      const batch = new SuggestionBatch(baseBatchRow);
      const result = await batch.discard();

      expect(result).toBe(true);
    });
  });

  describe('getTasks', () => {
    test('returns tasks', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: 'task-1', status: 'DRAFT', title: 'Task' }]
      });

      const batch = new SuggestionBatch(baseBatchRow);
      const result = await batch.getTasks();

      expect(result.length).toBe(1);
    });

    test('returns empty array', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const batch = new SuggestionBatch(baseBatchRow);
      const result = await batch.getTasks();

      expect(result).toEqual([]);
    });
  });

  describe('getApprovedTasks', () => {
    test('returns approved tasks', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: 'task-1', status: 'APPROVED' }]
      });

      const batch = new SuggestionBatch(baseBatchRow);
      const result = await batch.getApprovedTasks();

      expect(result.length).toBe(1);
    });

    test('returns empty array', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await new SuggestionBatch(baseBatchRow).getApprovedTasks();

      expect(result).toEqual([]);
    });
  });

  describe('validate', () => {
    test('returns valid true', async () => {
      const batch = new SuggestionBatch(baseBatchRow);

      jest.spyOn(batch, 'getApprovedTasks').mockResolvedValue([{ status: 'APPROVED' }]);
      jest.spyOn(batch, 'getTasks').mockResolvedValue([{ status: 'APPROVED' }]);

      const result = await batch.validate();

      expect(result.valid).toBe(true);
    });

    test('returns invalid if no approved tasks', async () => {
      const batch = new SuggestionBatch(baseBatchRow);

      jest.spyOn(batch, 'getApprovedTasks').mockResolvedValue([]);
      jest.spyOn(batch, 'getTasks').mockResolvedValue([]);

      const result = await batch.validate();

      expect(result.valid).toBe(false);
    });
  });

  describe('toJSON', () => {
    test('returns plain object', () => {
      const batch = new SuggestionBatch(baseBatchRow);
      const result = batch.toJSON();

      expect(result.id).toBe('batch-1');
      expect(result.document_id).toBe('doc-1');
    });
  });
});