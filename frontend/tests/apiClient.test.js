import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/api/mockApi.js', () => ({
  generateIssues: vi.fn(),
  publishIssues: vi.fn(),
  readSpecFromFile: vi.fn(),
}));

import * as mockApi from '../src/api/mockApi.js';
import { generateIssues, publishIssues } from '../src/api/apiClient.js';

describe('apiClient.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('generateIssues', () => {
    it('falls back to mock API when backend request fails', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      mockApi.generateIssues.mockResolvedValue({ issues: [{ id: 'mock-1' }] });

      const result = await generateIssues('spec text');

      expect(mockApi.generateIssues).toHaveBeenCalledWith('spec text', {});
      expect(result).toEqual({ issues: [{ id: 'mock-1' }] });
    });

    it('returns backend data when fetch succeeds', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ issues: [{ id: '1' }] }),
      });

      const result = await generateIssues('spec text');

      expect(fetch).toHaveBeenCalled();
      expect(result).toEqual({ issues: [{ id: '1' }] });
    });

    it('uses fallback result when backend returns non-ok', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Bad request', code: 'BAD_REQ' }),
      });

      mockApi.generateIssues.mockResolvedValue({ issues: [{ id: 'fallback' }] });

      const result = await generateIssues('spec text');

      expect(result).toEqual({ issues: [{ id: 'fallback' }] });
    });
  });

  describe('publishIssues', () => {
    it('falls back to mock publish when backend request fails', async () => {
      fetch.mockRejectedValue(new Error('Server down'));
      mockApi.publishIssues.mockResolvedValue({
        publishedCount: 1,
        projectKey: 'Project ABC',
      });

      const issues = [{ id: '1' }];
      const result = await publishIssues(issues);

      expect(mockApi.publishIssues).toHaveBeenCalledWith(issues, {});
      expect(result).toEqual({
        publishedCount: 1,
        projectKey: 'Project ABC',
      });
    });

    it('returns backend publish result when fetch succeeds', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ publishedCount: 2, projectKey: 'Project ABC' }),
      });

      const issues = [{ id: '1' }, { id: '2' }];
      const result = await publishIssues(issues);

      expect(fetch).toHaveBeenCalled();
      expect(result).toEqual({
        publishedCount: 2,
        projectKey: 'Project ABC',
      });
    });

    it('uses fallback publish when backend returns non-ok', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Publish failed', code: 'PUBLISH_ERR' }),
      });

      mockApi.publishIssues.mockResolvedValue({
        publishedCount: 3,
        projectKey: 'Project ABC',
      });

      const result = await publishIssues([{ id: '1' }]);

      expect(result).toEqual({
        publishedCount: 3,
        projectKey: 'Project ABC',
      });
    });
  });
});