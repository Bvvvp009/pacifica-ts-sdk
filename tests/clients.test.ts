/**
 * Basic tests for API clients
 */

import { ApiClient } from '../src/clients/ApiClient';
import { SignClient } from '../src/clients/SignClient';

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseUrl: 'https://api.pacifica.fi',
    });
  });

  it('should be instantiated', () => {
    expect(apiClient).toBeInstanceOf(ApiClient);
  });

  it('should have all expected methods', () => {
    expect(typeof apiClient.getMarketInfo).toBe('function');
    expect(typeof apiClient.getTicker).toBe('function');
    expect(typeof apiClient.getTickers).toBe('function');
    expect(typeof apiClient.getOrderBook).toBe('function');
    expect(typeof apiClient.getTrades).toBe('function');
    expect(typeof apiClient.getBalance).toBe('function');
    expect(typeof apiClient.getOpenOrders).toBe('function');
    expect(typeof apiClient.getOrderHistory).toBe('function');
    expect(typeof apiClient.getOrder).toBe('function');
    expect(typeof apiClient.getPositions).toBe('function');
    expect(typeof apiClient.getPosition).toBe('function');
    expect(typeof apiClient.getAccountInfo).toBe('function');
    expect(typeof apiClient.getAccountHistory).toBe('function');
  });
});

describe('SignClient', () => {
  let signClient: SignClient;
  const testPrivateKey = '0'.repeat(64); // 32 bytes in hex

  beforeEach(() => {
    signClient = new SignClient(testPrivateKey, {
      baseUrl: 'https://api.pacifica.fi',
    });
  });

  it('should be instantiated', () => {
    expect(signClient).toBeInstanceOf(SignClient);
  });

  it('should have all expected order methods', () => {
    expect(typeof signClient.createOrder).toBe('function');
    expect(typeof signClient.createMarketOrder).toBe('function');
    expect(typeof signClient.createStopOrder).toBe('function');
    expect(typeof signClient.cancelOrder).toBe('function');
    expect(typeof signClient.cancelAllOrders).toBe('function');
    expect(typeof signClient.cancelStopOrder).toBe('function');
  });

  it('should have all expected account methods', () => {
    expect(typeof signClient.updateLeverage).toBe('function');
    expect(typeof signClient.updateMarginMode).toBe('function');
    expect(typeof signClient.withdraw).toBe('function');
    expect(typeof signClient.createApiKey).toBe('function');
    expect(typeof signClient.revokeApiKey).toBe('function');
    expect(typeof signClient.listApiKeys).toBe('function');
  });

  it('should have position and subaccount methods', () => {
    expect(typeof signClient.setPositionTPSL).toBe('function');
    expect(typeof signClient.initiateSubaccount).toBe('function');
    expect(typeof signClient.confirmSubaccount).toBe('function');
    expect(typeof signClient.subaccountTransfer).toBe('function');
  });

  it('should support agent wallet', () => {
    const agentWalletPublicKey = '1'.repeat(64);
    signClient.setAgentWallet(agentWalletPublicKey);
    // If no error thrown, method exists and works
    expect(signClient).toBeInstanceOf(SignClient);
  });
});

