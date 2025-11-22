/**
 * Basic tests for signing utilities
 * Note: Tests requiring @noble/ed25519 may need ESM configuration
 */

// Mock @noble/ed25519 to avoid ESM issues
jest.mock('@noble/ed25519', () => ({
  getPublicKey: jest.fn(),
  sign: jest.fn(),
  verify: jest.fn(),
}));

import {
  sortJsonKeys,
  createCompactJson,
} from '../utils/signer';

describe('Signer Utilities', () => {
  describe('sortJsonKeys', () => {
    it('should sort object keys alphabetically', () => {
      const input = { c: 3, a: 1, b: 2 };
      const result = sortJsonKeys(input);
      expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
    });

    it('should handle nested objects', () => {
      const input = { z: { c: 3, a: 1 }, b: 2 };
      const result = sortJsonKeys(input);
      expect(Object.keys(result)).toEqual(['b', 'z']);
      expect(Object.keys(result.z)).toEqual(['a', 'c']);
    });

    it('should handle arrays', () => {
      const input = { items: [{ b: 2, a: 1 }] };
      const result = sortJsonKeys(input);
      expect(result.items[0]).toEqual({ a: 1, b: 2 });
    });
  });

  describe('createCompactJson', () => {
    it('should create compact JSON without whitespace', () => {
      const input = { a: 1, b: 2 };
      const result = createCompactJson(input);
      expect(result).toBe('{"a":1,"b":2}');
      expect(result).not.toContain(' ');
      expect(result).not.toContain('\n');
    });
  });

  // Note: Tests for generateKeypair, signMessage, and verifySignature
  // require @noble/ed25519 which is an ESM module.
  // These tests should be run with proper ESM configuration or integration tests.
});

