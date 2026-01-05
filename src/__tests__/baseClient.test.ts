/**
 * Tests for BaseClient retry logic
 */

import { BaseClient } from '../clients/BaseClient';
import { NetworkError, APIError } from '../errors';

// Mock fetch
global.fetch = jest.fn();

describe('BaseClient Retry Logic', () => {
  let client: BaseClient;

  beforeEach(() => {
    client = new BaseClient('https://api.test.com', 5000, {
      retryAttempts: 2,
      retryDelay: 50, // Shorter delay for faster tests
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should retry on network errors', async () => {
    let callCount = 0;
    (global.fetch as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });
    });

    const result = await client['get']('/test');
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should retry on 5xx errors', async () => {
    let callCount = 0;
    (global.fetch as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: { message: 'Server error' } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });
    });

    const result = await client['get']('/test');
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should retry on rate limit errors', async () => {
    const mockHeaders = new Map();
    mockHeaders.set('Retry-After', '0.1'); // 100ms
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: mockHeaders,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

    const result = await client['get']('/test');
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should not retry on 4xx errors (except 429)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: { message: 'Bad request' } }),
    });

    try {
      await client['get']('/test');
      fail('Should have thrown APIError');
    } catch (error) {
      expect(error).toBeInstanceOf(APIError);
      expect((error as APIError).status).toBe(400);
    }
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should throw after max retry attempts', async () => {
    const networkError = new Error('Network error');
    networkError.name = 'NetworkError';
    (global.fetch as jest.Mock).mockRejectedValue(networkError);

    try {
      await client['get']('/test');
      fail('Should have thrown NetworkError');
    } catch (error) {
      expect(error).toBeInstanceOf(NetworkError);
    }
    expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  }, 10000);
});

