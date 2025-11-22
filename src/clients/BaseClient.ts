/**
 * Base Client for HTTP requests
 */

import { ApiResponse, PacificaConfig } from '../types';
import {
  NetworkError,
  TimeoutError,
  RateLimitError,
  APIError,
} from '../errors';
import { logger } from '../utils/logger';

export class BaseClient {
  protected baseUrl: string;
  protected timeout: number;
  protected retryAttempts: number;
  protected retryDelay: number;

  constructor(baseUrl?: string, timeout?: number, config?: PacificaConfig) {
    // baseUrl should include /api/v1, endpoints should not include it
    if (baseUrl) {
      // If baseUrl already ends with /api/v1, use as-is
      if (baseUrl.endsWith('/api/v1')) {
        this.baseUrl = baseUrl;
      } else if (baseUrl.endsWith('/api/v1/')) {
        this.baseUrl = baseUrl.slice(0, -1); // Remove trailing slash
      } else {
        // Append /api/v1 if not present
        this.baseUrl = `${baseUrl.replace(/\/$/, '')}/api/v1`;
      }
    } else {
      this.baseUrl = 'https://api.pacifica.fi/api/v1';
    }
    this.timeout = timeout || 30000;
    this.retryAttempts = config?.retryAttempts ?? 3;
    this.retryDelay = config?.retryDelay ?? 1000;

    if (config?.logLevel) {
      logger.setLevel(config.logLevel);
    }
  }

  /**
   * Sleep helper for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any, status?: number): boolean {
    // Network errors (fetch failures) are retryable
    if (error instanceof NetworkError) {
      return true;
    }
    // Generic errors from fetch (network issues) are retryable
    if (error instanceof Error && !(error instanceof APIError) && !(error instanceof RateLimitError) && !(error instanceof TimeoutError)) {
      // If it's a generic error and we don't have a status, it's likely a network error
      if (!status) {
        return true;
      }
    }
    // 5xx errors are retryable
    if (status && status >= 500) {
      return true;
    }
    // Rate limit errors are retryable (handled separately)
    if (status === 429) {
      return true;
    }
    return false;
  }

  /**
   * Make a GET request with retry logic
   */
  protected async get<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${endpoint}`;

    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    let lastError: any;
    let lastStatus: number | undefined;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.debug(`Retrying GET ${endpoint} (attempt ${attempt + 1}/${this.retryAttempts + 1}) after ${delay}ms`);
          await this.sleep(delay);
        }

        logger.debug(`GET ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        lastStatus = response.status;

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelay * Math.pow(2, attempt);
          throw new RateLimitError(
            `Rate limit exceeded. Retry after ${retryAfterMs}ms`,
            retryAfterMs
          );
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as any;
          const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          
          // Don't retry on 4xx errors (except 429 which is handled above)
          if (response.status >= 400 && response.status < 500) {
            throw new APIError(errorMessage, response.status, errorData);
          }
          
          // 5xx errors - throw but mark as retryable
          throw new APIError(errorMessage, response.status, errorData);
        }

        const data = await response.json();
        return data as ApiResponse<T>;
      } catch (error: any) {
        lastError = error;

        if (error instanceof RateLimitError && attempt < this.retryAttempts) {
          await this.sleep(error.retryAfter || this.retryDelay * Math.pow(2, attempt));
          continue;
        }

        if (error.name === 'AbortError') {
          if (attempt < this.retryAttempts) {
            continue;
          }
          throw new TimeoutError(`Request timeout after ${this.timeout}ms`);
        }

        if (this.isRetryableError(error, lastStatus) && attempt < this.retryAttempts) {
          continue;
        }

        // Non-retryable or max attempts reached
        if (error instanceof APIError || error instanceof RateLimitError || error instanceof TimeoutError) {
          throw error;
        }

        if (lastStatus) {
          throw new APIError(error.message || 'Request failed', lastStatus);
        }

        throw new NetworkError(error.message || 'Network request failed', error);
      }
    }

    throw lastError;
  }

  /**
   * Make a POST request with retry logic
   */
  protected async post<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    let lastError: any;
    let lastStatus: number | undefined;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.debug(`Retrying POST ${endpoint} (attempt ${attempt + 1}/${this.retryAttempts + 1}) after ${delay}ms`);
          await this.sleep(delay);
        }

        logger.debug(`POST ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        lastStatus = response.status;

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelay * Math.pow(2, attempt);
          throw new RateLimitError(
            `Rate limit exceeded. Retry after ${retryAfterMs}ms`,
            retryAfterMs
          );
        }

        if (!response.ok) {
          let errorData: any;
          let errorText: string = '';
          try {
            errorText = await response.text();
            errorData = errorText ? JSON.parse(errorText) : {};
          } catch {
            errorData = { error: { message: response.statusText } };
          }
          
          const errorMessage = errorData?.error?.message || errorData?.message || response.statusText;
          
          if (response.status === 401 || response.status === 403) {
            throw new APIError(errorMessage, response.status, errorData);
          }
          
          throw new APIError(errorMessage, response.status, errorData);
        }

        const data = await response.json();
        return data as ApiResponse<T>;
      } catch (error: any) {
        lastError = error;

        if (error instanceof RateLimitError && attempt < this.retryAttempts) {
          await this.sleep(error.retryAfter || this.retryDelay * Math.pow(2, attempt));
          continue;
        }

        if (error.name === 'AbortError') {
          if (attempt < this.retryAttempts) {
            continue;
          }
          throw new TimeoutError(`Request timeout after ${this.timeout}ms`);
        }

        if (this.isRetryableError(error, lastStatus) && attempt < this.retryAttempts) {
          continue;
        }

        // Non-retryable or max attempts reached
        if (error instanceof APIError || error instanceof RateLimitError || error instanceof TimeoutError) {
          throw error;
        }

        if (lastStatus) {
          throw new APIError(error.message || 'Request failed', lastStatus);
        }

        throw new NetworkError(error.message || 'Network request failed', error);
      }
    }

    throw lastError;
  }
}

