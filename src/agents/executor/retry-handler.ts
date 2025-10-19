// Retry handler with exponential backoff and retryable error detection

import { RetryableError } from './types';

export class RetryHandler {
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly DEFAULT_DELAY_MS = 1000;
  private static readonly MAX_DELAY_MS = 30000; // 30 seconds max delay
  
  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = RetryHandler.DEFAULT_MAX_RETRIES,
    delayMs: number = RetryHandler.DEFAULT_DELAY_MS
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const currentDelay = this.calculateDelay(delayMs, attempt);
        
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${currentDelay}ms delay`);
        
        // Wait before retry
        await this.sleep(currentDelay);
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Determine if error is retryable
   */
  isRetryableError(error: any): boolean {
    // Check if error explicitly marks itself as non-retryable
    if (error && typeof error === 'object' && error.isRetryable === false) {
      return false;
    }
    
    // Check if error explicitly marks itself as retryable
    if (error && typeof error === 'object' && error.isRetryable === true) {
      return true;
    }
    
    // Check error message for retryable patterns
    const errorMessage = error?.message || error?.toString() || '';
    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /temporary/i,
      /unavailable/i,
      /rate limit/i,
      /throttle/i,
      /server error/i,
      /5\d\d/i, // HTTP 5xx errors
      /ECONNRESET/i,
      /ENOTFOUND/i,
      /ETIMEDOUT/i,
      /ECONNREFUSED/i
    ];
    
    const nonRetryablePatterns = [
      /validation/i,
      /invalid/i,
      /not found/i,
      /unauthorized/i,
      /forbidden/i,
      /bad request/i,
      /4\d\d/i, // HTTP 4xx errors (except 429)
      /syntax error/i,
      /parse error/i,
      /malformed/i
    ];
    
    // Check for non-retryable patterns first
    for (const pattern of nonRetryablePatterns) {
      if (pattern.test(errorMessage)) {
        return false;
      }
    }
    
    // Check for retryable patterns
    for (const pattern of retryablePatterns) {
      if (pattern.test(errorMessage)) {
        return true;
      }
    }
    
    // Check error type
    if (error instanceof TypeError || error instanceof ReferenceError) {
      return false; // Programming errors are not retryable
    }
    
    // Check for specific error codes
    if (error?.code) {
      const retryableCodes = [
        'ECONNRESET',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'EADDRINUSE',
        'ENETUNREACH',
        'EHOSTUNREACH'
      ];
      
      if (retryableCodes.includes(error.code)) {
        return true;
      }
    }
    
    // Check HTTP status codes
    if (error?.status || error?.statusCode) {
      const status = error.status || error.statusCode;
      
      // 5xx errors are retryable
      if (status >= 500 && status < 600) {
        return true;
      }
      
      // 429 (Too Many Requests) is retryable
      if (status === 429) {
        return true;
      }
      
      // 4xx errors (except 429) are generally not retryable
      if (status >= 400 && status < 500) {
        return false;
      }
    }
    
    // Default to retryable for unknown errors (conservative approach)
    return true;
  }
  
  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(baseDelayMs: number, attempt: number): number {
    // Exponential backoff: delay * (2 ^ attempt)
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;
    const totalDelay = exponentialDelay + jitter;
    
    // Cap at maximum delay
    return Math.min(totalDelay, RetryHandler.MAX_DELAY_MS);
  }
  
  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Create a retryable error
   */
  static createRetryableError(message: string, retryAfter?: number): RetryableError {
    const error = new Error(message) as RetryableError;
    error.isRetryable = true;
    if (retryAfter) {
      error.retryAfter = retryAfter;
    }
    return error;
  }
  
  /**
   * Create a non-retryable error
   */
  static createNonRetryableError(message: string): Error {
    const error = new Error(message);
    (error as any).isRetryable = false;
    return error;
  }
  
  /**
   * Get retry delay from error (if specified)
   */
  static getRetryDelayFromError(error: any): number | null {
    if (error && typeof error === 'object' && typeof error.retryAfter === 'number') {
      return error.retryAfter;
    }
    return null;
  }
  
  /**
   * Check if error has custom retry delay
   */
  static hasCustomRetryDelay(error: any): boolean {
    return this.getRetryDelayFromError(error) !== null;
  }
  
  /**
   * Get retry statistics
   */
  static getRetryStats(attempts: number, totalDelay: number): {
    attempts: number;
    totalDelayMs: number;
    averageDelayMs: number;
    success: boolean;
  } {
    return {
      attempts,
      totalDelayMs: totalDelay,
      averageDelayMs: attempts > 0 ? totalDelay / attempts : 0,
      success: attempts > 0
    };
  }
  
  /**
   * Validate retry configuration
   */
  static validateRetryConfig(maxRetries: number, delayMs: number): string[] {
    const errors: string[] = [];
    
    if (maxRetries < 0) {
      errors.push('Max retries must be non-negative');
    }
    
    if (maxRetries > 10) {
      errors.push('Max retries should not exceed 10 to prevent infinite loops');
    }
    
    if (delayMs < 0) {
      errors.push('Delay must be non-negative');
    }
    
    if (delayMs > RetryHandler.MAX_DELAY_MS) {
      errors.push(`Delay should not exceed ${RetryHandler.MAX_DELAY_MS}ms`);
    }
    
    return errors;
  }
}
