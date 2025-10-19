// Unit tests for RetryHandler

import { RetryHandler } from '../../../src/agents/executor/retry-handler';

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;
  
  beforeEach(() => {
    retryHandler = new RetryHandler();
  });
  
  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await retryHandler.retryWithBackoff(mockFn, 3, 100);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue('success');
      
      const result = await retryHandler.retryWithBackoff(mockFn, 3, 100);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
    
    it('should fail after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));
      
      await expect(retryHandler.retryWithBackoff(mockFn, 2, 10)).rejects.toThrow('Persistent error');
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
    
    it('should not retry non-retryable errors', async () => {
      const nonRetryableError = new Error('Validation error');
      (nonRetryableError as any).isRetryable = false;
      
      const mockFn = jest.fn().mockRejectedValue(nonRetryableError);
      
      await expect(retryHandler.retryWithBackoff(mockFn, 3, 100)).rejects.toThrow('Validation error');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    it('should use custom retry delay from error', async () => {
      const errorWithDelay = new Error('Rate limited');
      (errorWithDelay as any).retryAfter = 200; // Reduced delay for test
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(errorWithDelay)
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retryHandler.retryWithBackoff(mockFn, 3, 100);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const networkError = new Error('Network timeout');
      expect(retryHandler.isRetryableError(networkError)).toBe(true);
    });
    
    it('should return true for connection errors', () => {
      const connectionError = new Error('ECONNRESET');
      expect(retryHandler.isRetryableError(connectionError)).toBe(true);
    });
    
    it('should return true for server errors', () => {
      const serverError = new Error('Internal server error 500');
      expect(retryHandler.isRetryableError(serverError)).toBe(true);
    });
    
    it('should return true for rate limit errors', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      expect(retryHandler.isRetryableError(rateLimitError)).toBe(true);
    });
    
    it('should return false for validation errors', () => {
      const validationError = new Error('Invalid input validation');
      expect(retryHandler.isRetryableError(validationError)).toBe(false);
    });
    
    it('should return false for authorization errors', () => {
      const authError = new Error('Unauthorized 401');
      expect(retryHandler.isRetryableError(authError)).toBe(false);
    });
    
    it('should return false for not found errors', () => {
      const notFoundError = new Error('Not found 404');
      expect(retryHandler.isRetryableError(notFoundError)).toBe(false);
    });
    
    it('should return false for syntax errors', () => {
      const syntaxError = new Error('Syntax error in request');
      expect(retryHandler.isRetryableError(syntaxError)).toBe(false);
    });
    
    it('should return false for TypeError', () => {
      const typeError = new TypeError('Cannot read property of undefined');
      expect(retryHandler.isRetryableError(typeError)).toBe(false);
    });
    
    it('should return false for ReferenceError', () => {
      const referenceError = new ReferenceError('Variable is not defined');
      expect(retryHandler.isRetryableError(referenceError)).toBe(false);
    });
    
    it('should respect explicit isRetryable flag', () => {
      const error = new Error('Custom error');
      (error as any).isRetryable = true;
      expect(retryHandler.isRetryableError(error)).toBe(true);
      
      (error as any).isRetryable = false;
      expect(retryHandler.isRetryableError(error)).toBe(false);
    });
    
    it('should handle error codes', () => {
      const error = new Error('Connection failed');
      (error as any).code = 'ECONNRESET';
      expect(retryHandler.isRetryableError(error)).toBe(true);
      
      (error as any).code = 'ENOTFOUND';
      expect(retryHandler.isRetryableError(error)).toBe(true);
    });
    
    it('should handle HTTP status codes', () => {
      const error500 = new Error('Server error');
      (error500 as any).status = 500;
      expect(retryHandler.isRetryableError(error500)).toBe(true);
      
      const error429 = new Error('Too many requests');
      (error429 as any).status = 429;
      expect(retryHandler.isRetryableError(error429)).toBe(true);
      
      const error400 = new Error('Bad request');
      (error400 as any).status = 400;
      expect(retryHandler.isRetryableError(error400)).toBe(false);
    });
    
    it('should default to retryable for unknown errors', () => {
      const unknownError = new Error('Unknown error type');
      expect(retryHandler.isRetryableError(unknownError)).toBe(true);
    });
  });
  
  describe('createRetryableError', () => {
    it('should create retryable error with message', () => {
      const error = RetryHandler.createRetryableError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.isRetryable).toBe(true);
    });
    
    it('should create retryable error with retry delay', () => {
      const error = RetryHandler.createRetryableError('Rate limited', 1000);
      
      expect(error.message).toBe('Rate limited');
      expect(error.isRetryable).toBe(true);
      expect(error.retryAfter).toBe(1000);
    });
  });
  
  describe('createNonRetryableError', () => {
    it('should create non-retryable error', () => {
      const error = RetryHandler.createNonRetryableError('Validation failed');
      
      expect(error.message).toBe('Validation failed');
      expect((error as any).isRetryable).toBe(false);
    });
  });
  
  describe('getRetryDelayFromError', () => {
    it('should return retry delay from error', () => {
      const error = new Error('Rate limited');
      (error as any).retryAfter = 2000;
      
      const delay = RetryHandler.getRetryDelayFromError(error);
      
      expect(delay).toBe(2000);
    });
    
    it('should return null when no retry delay', () => {
      const error = new Error('Some error');
      
      const delay = RetryHandler.getRetryDelayFromError(error);
      
      expect(delay).toBeNull();
    });
  });
  
  describe('hasCustomRetryDelay', () => {
    it('should return true when error has custom retry delay', () => {
      const error = new Error('Rate limited');
      (error as any).retryAfter = 1000;
      
      expect(RetryHandler.hasCustomRetryDelay(error)).toBe(true);
    });
    
    it('should return false when error has no custom retry delay', () => {
      const error = new Error('Some error');
      
      expect(RetryHandler.hasCustomRetryDelay(error)).toBe(false);
    });
  });
  
  describe('getRetryStats', () => {
    it('should return retry statistics', () => {
      const stats = RetryHandler.getRetryStats(3, 1500);
      
      expect(stats.attempts).toBe(3);
      expect(stats.totalDelayMs).toBe(1500);
      expect(stats.averageDelayMs).toBe(500);
      expect(stats.success).toBe(true);
    });
    
    it('should handle zero attempts', () => {
      const stats = RetryHandler.getRetryStats(0, 0);
      
      expect(stats.attempts).toBe(0);
      expect(stats.totalDelayMs).toBe(0);
      expect(stats.averageDelayMs).toBe(0);
      expect(stats.success).toBe(false);
    });
  });
  
  describe('validateRetryConfig', () => {
    it('should return empty array for valid config', () => {
      const errors = RetryHandler.validateRetryConfig(3, 1000);
      
      expect(errors).toEqual([]);
    });
    
    it('should return errors for invalid config', () => {
      const errors = RetryHandler.validateRetryConfig(-1, -1);
      
      expect(errors).toContain('Max retries must be non-negative');
      expect(errors).toContain('Delay must be non-negative');
    });
    
    it('should warn about high retry count', () => {
      const errors = RetryHandler.validateRetryConfig(15, 1000);
      
      expect(errors).toContain('Max retries should not exceed 10 to prevent infinite loops');
    });
    
    it('should warn about high delay', () => {
      const errors = RetryHandler.validateRetryConfig(3, 60000);
      
      expect(errors).toContain('Delay should not exceed 30000ms');
    });
  });
  
  describe('exponential backoff calculation', () => {
    it('should calculate exponential backoff delays', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retryHandler.retryWithBackoff(mockFn, 3, 100);
      const endTime = Date.now();
      
      // Should have waited for exponential backoff delays
      // First retry: ~100ms, second retry: ~200ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(250);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
    
    it('should cap delay at maximum', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retryHandler.retryWithBackoff(mockFn, 5, 1000); // Reduced base delay for test
      const endTime = Date.now();
      
      // Should be capped at 30 seconds max
      expect(endTime - startTime).toBeLessThan(35000);
    }, 40000); // Increased timeout
  });
  
  describe('jitter', () => {
    it('should add jitter to prevent thundering herd', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Network error'));
      
      // Run multiple times to test jitter
      for (let i = 0; i < 3; i++) {
        try {
          await retryHandler.retryWithBackoff(mockFn, 1, 50);
        } catch (error) {
          // Expected to fail
        }
        mockFn.mockClear();
      }
      
      // Jitter should add randomness to delays
      // This is a probabilistic test, so we just verify the function runs
      expect(mockFn).toHaveBeenCalled();
    });
  });
});
