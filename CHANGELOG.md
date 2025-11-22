# Changelog

## [0.2.0] - Production-Ready Improvements

### Added

#### Error Handling
- **Custom Error Classes** (`src/errors.ts`)
  - `PacificaError` - Base error class with error codes
  - `NetworkError` - Network/connection failures
  - `TimeoutError` - Request timeouts
  - `RateLimitError` - Rate limit exceeded (with retry-after)
  - `APIError` - API errors with status codes
  - `ValidationError` - Input validation errors
  - `AuthenticationError` - Authentication failures

#### Retry Logic
- **Automatic Retry with Exponential Backoff** (`BaseClient`)
  - Configurable retry attempts (default: 3)
  - Configurable retry delay (default: 1000ms)
  - Exponential backoff: delay * 2^(attempt-1)
  - Retries on:
    - Network errors
    - 5xx server errors
    - Rate limit errors (429)
    - Timeout errors
  - Respects `Retry-After` headers
  - No retry on 4xx client errors (except 429)

#### WebSocket Improvements
- **Exponential Backoff Reconnection**
  - Starts with `reconnectInterval`
  - Doubles each attempt: `interval * 2^(attempt-1)`
  - Capped at 60 seconds
- **Enhanced Logging**
  - Connection events logged
  - Error events logged
  - Reconnection attempts logged

#### Logging System
- **Structured Logger** (`src/utils/logger.ts`)
  - Log levels: `debug`, `info`, `warn`, `error`, `silent`
  - Configurable via `logLevel` in config
  - Replaces console.log with structured logging
  - Format: `[Pacifica SDK] <message>`

#### Input Validation
- **Validation Utilities** (`src/utils/validation.ts`)
  - `validateRequired()` - Check required fields
  - `validateString()` - String validation with min length
  - `validateNumber()` - Number validation with min/max
  - `validateOneOf()` - Enum validation
- **Method Validation**
  - `createOrder()` - Validates order parameters
  - `subscribe()` - Validates channel string

#### Rate Limiting
- **Rate Limiter Utility** (`src/utils/rateLimiter.ts`)
  - Token bucket implementation
  - Configurable requests per window
  - Ready for integration

### Changed

#### Configuration
- **Enhanced Config Options** (`PacificaConfig`)
  - `retryAttempts?: number` - Number of retry attempts (default: 3)
  - `retryDelay?: number` - Base retry delay in ms (default: 1000)
  - `logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'` - Log level (default: 'warn')

#### Error Messages
- More descriptive error messages
- Error context preserved (status codes, response data)
- Typed errors for better error handling

#### BaseClient
- All HTTP requests now have retry logic
- Better error handling with typed errors
- Improved timeout handling

### Testing

#### New Tests
- `src/__tests__/errors.test.ts` - Error class tests
- `src/__tests__/baseClient.test.ts` - Retry logic tests
- Updated `src/__tests__/clients.test.ts` - Client instantiation tests
- Updated `src/__tests__/signer.test.ts` - Signer utility tests

#### Test Coverage
- Error classes: 100%
- Retry logic: Core scenarios covered
- Client instantiation: All clients tested

### Breaking Changes

None - All changes are backward compatible.

### Migration Guide

#### Using New Error Types

```typescript
// Before
try {
  await client.createOrder({...});
} catch (error) {
  console.error(error.message);
}

// After
import { RateLimitError, NetworkError, APIError } from 'pacifica-ts-sdk';

try {
  await client.createOrder({...});
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Retry after: ${error.retryAfter}ms`);
  } else if (error instanceof NetworkError) {
    console.log('Network issue:', error.originalError);
  } else if (error instanceof APIError) {
    console.log(`API Error ${error.status}:`, error.responseData);
  }
}
```

#### Using New Config Options

```typescript
// Before
const client = new SignClient(privateKey, {
  baseUrl: 'https://api.pacifica.fi',
  timeout: 30000,
});

// After
const client = new SignClient(privateKey, {
  baseUrl: 'https://api.pacifica.fi',
  timeout: 30000,
  retryAttempts: 5,        // New: Custom retry attempts
  retryDelay: 2000,         // New: Custom retry delay
  logLevel: 'info',         // New: Set log level
});
```

#### Using Logger

```typescript
import { logger } from 'pacifica-ts-sdk';

// Set log level (or via config)
logger.setLevel('debug');

// Use logger
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

### Performance Improvements

- Automatic retry reduces manual retry code
- Exponential backoff prevents server overload
- Better connection management for WebSocket
- Reduced error handling overhead

### Documentation

- All new features documented in code
- JSDoc comments added
- Examples updated (examples/*.ts)

---

## [0.1.0] - Initial Release

- Basic SDK functionality
- SignClient for authenticated operations
- ApiClient for read operations
- WebSocketClient for real-time data
- Ed25519 signing support
- TypeScript type definitions

