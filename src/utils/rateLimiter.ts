/**
 * Simple rate limiter for API requests
 */

export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed and record it
   */
  async checkLimit(): Promise<void> {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    // Remove old requests - more efficient than filter for large arrays
    let writeIndex = 0;
    for (let i = 0; i < this.requests.length; i++) {
      if (this.requests[i] >= cutoff) {
        this.requests[writeIndex++] = this.requests[i];
      }
    }
    this.requests.length = writeIndex;

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`);
    }

    this.requests.push(now);
  }

  /**
   * Get current request count in window
   */
  getCurrentCount(): number {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    
    let count = 0;
    for (let i = this.requests.length - 1; i >= 0; i--) {
      if (this.requests[i] >= cutoff) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}

