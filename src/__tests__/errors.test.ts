/**
 * Tests for error classes
 */

import {
  PacificaError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  APIError,
  ValidationError,
} from '../errors';

describe('Error Classes', () => {
  describe('PacificaError', () => {
    it('should create error with message and code', () => {
      const error = new PacificaError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('PacificaError');
    });
  });

  describe('NetworkError', () => {
    it('should create network error', () => {
      const originalError = new Error('Original error');
      const error = new NetworkError('Network failed', originalError);
      expect(error.message).toBe('Network failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error with default message', () => {
      const error = new TimeoutError();
      expect(error.message).toBe('Request timeout');
      expect(error.code).toBe('TIMEOUT_ERROR');
    });

    it('should create timeout error with custom message', () => {
      const error = new TimeoutError('Custom timeout');
      expect(error.message).toBe('Custom timeout');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with retry after', () => {
      const error = new RateLimitError('Rate limited', 5000);
      expect(error.message).toBe('Rate limited');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.retryAfter).toBe(5000);
    });
  });

  describe('APIError', () => {
    it('should create API error with status and response data', () => {
      const responseData = { error: { message: 'Bad request' } };
      const error = new APIError('API error', 400, responseData);
      expect(error.message).toBe('API error');
      expect(error.code).toBe('API_ERROR');
      expect(error.status).toBe(400);
      expect(error.responseData).toBe(responseData);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid value', 'email');
      expect(error.message).toBe('Invalid value');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('email');
    });
  });
});

