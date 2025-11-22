/**
 * Basic tests for client instantiation
 * Note: These tests only verify instantiation, not full functionality
 */

// Mock the signer module to avoid ESM issues
jest.mock('../utils/signer', () => ({
  generateKeypair: jest.fn(),
  publicKeyToHex: jest.fn(() => 'mock-public-key'),
  signMessage: jest.fn(),
  buildSignedRequest: jest.fn(),
}));

import { SignClient, ApiClient, WebSocketClient } from '../index';

describe('Client Instantiation', () => {
  const testPrivateKey = '0'.repeat(64); // 32 bytes in hex

  describe('SignClient', () => {
    it('should instantiate with private key', () => {
      const client = new SignClient(testPrivateKey);
      expect(client).toBeInstanceOf(SignClient);
    });

    it('should instantiate with configuration', () => {
      const client = new SignClient(testPrivateKey, {
        baseUrl: 'https://test.api',
        accountPublicKey: 'test-public-key',
        expiryWindow: 600,
      });
      expect(client).toBeInstanceOf(SignClient);
    });
  });

  describe('ApiClient', () => {
    it('should instantiate without parameters', () => {
      const client = new ApiClient();
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should instantiate with configuration', () => {
      const client = new ApiClient({
        baseUrl: 'https://test.api',
        timeout: 10000,
      });
      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('WebSocketClient', () => {
    it('should instantiate with configuration', () => {
      const client = new WebSocketClient({
        url: 'wss://test.ws',
        reconnect: true,
      });
      expect(client).toBeInstanceOf(WebSocketClient);
    });

    it('should instantiate with private key for signed operations', () => {
      const client = new WebSocketClient({
        privateKey: testPrivateKey,
        accountPublicKey: 'test-public-key',
      });
      expect(client).toBeInstanceOf(WebSocketClient);
    });
  });
});

