/**
 * Custom error classes for Pacifica SDK
 */

export class PacificaError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'PacificaError';
    Object.setPrototypeOf(this, PacificaError.prototype);
  }
}

export class NetworkError extends PacificaError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends PacificaError {
  constructor(message: string = 'Request timeout') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class RateLimitError extends PacificaError {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class AuthenticationError extends PacificaError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class APIError extends PacificaError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseData?: any
  ) {
    super(message, 'API_ERROR');
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class ValidationError extends PacificaError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

