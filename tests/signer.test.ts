/**
 * Basic tests for signing utilities
 */

import {
  sortJsonKeys,
  createCompactJson,
  generateKeypair,
  publicKeyToHex,
  signMessage,
  verifySignature,
} from '../src/utils/signer';

describe('Signer Utilities', () => {
  describe('sortJsonKeys', () => {
    it('should sort object keys alphabetically', () => {
      const obj = { z: 1, a: 2, m: 3 };
      const sorted = sortJsonKeys(obj);
      expect(Object.keys(sorted)).toEqual(['a', 'm', 'z']);
    });

    it('should handle nested objects', () => {
      const obj = { z: { c: 1, a: 2 }, a: 3 };
      const sorted = sortJsonKeys(obj);
      expect(Object.keys(sorted)).toEqual(['a', 'z']);
      expect(Object.keys(sorted.z)).toEqual(['a', 'c']);
    });

    it('should handle arrays', () => {
      const obj = { items: [{ z: 1, a: 2 }] };
      const sorted = sortJsonKeys(obj);
      expect(Object.keys(sorted.items[0])).toEqual(['a', 'z']);
    });
  });

  describe('createCompactJson', () => {
    it('should create compact JSON without whitespace', () => {
      const obj = { a: 1, b: 2 };
      const compact = createCompactJson(obj);
      expect(compact).toBe('{"a":1,"b":2}');
      expect(compact).not.toContain(' ');
      expect(compact).not.toContain('\n');
    });

    it('should sort keys before creating JSON', () => {
      const obj = { z: 1, a: 2 };
      const compact = createCompactJson(obj);
      expect(compact).toBe('{"a":2,"z":1}');
    });
  });

  describe('generateKeypair', () => {
    it('should generate keypair from hex private key', async () => {
      // Generate a random 32-byte private key
      const privateKey = '0'.repeat(64); // 32 bytes in hex
      const keypair = await generateKeypair(privateKey);
      
      expect(keypair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keypair.privateKey.length).toBe(32);
      expect(keypair.publicKey.length).toBe(32);
    });

    it('should handle private key without 0x prefix', async () => {
      const privateKey = '0'.repeat(64);
      const keypair1 = await generateKeypair(privateKey);
      const keypair2 = await generateKeypair('0x' + privateKey);
      
      expect(keypair1.publicKey).toEqual(keypair2.publicKey);
    });
  });

  describe('signMessage and verifySignature', () => {
    it('should sign and verify a message', async () => {
      // Generate a test keypair
      const privateKeyHex = '1'.repeat(64); // Test private key
      const keypair = await generateKeypair(privateKeyHex);
      const publicKeyHex = publicKeyToHex(keypair.publicKey);

      const message = 'test message';
      const signature = await signMessage(message, keypair.privateKey);
      
      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');

      // Verify signature
      const isValid = await verifySignature(message, signature, publicKeyHex);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signatures', async () => {
      const privateKeyHex = '1'.repeat(64);
      const keypair = await generateKeypair(privateKeyHex);
      const publicKeyHex = publicKeyToHex(keypair.publicKey);

      const message = 'test message';
      const wrongSignature = '0'.repeat(128); // Invalid signature

      const isValid = await verifySignature(message, wrongSignature, publicKeyHex);
      expect(isValid).toBe(false);
    });
  });
});

