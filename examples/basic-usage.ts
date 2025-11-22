/**
 * Basic Usage Examples for Pacifica TypeScript SDK
 */

import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';
import { WebSocketClient } from '../src/clients/WebSocketClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';

// Example 1: Basic usage with SignClient and ApiClient
async function example1() {
  const privateKey = 'your-private-key-hex';
  const keypair = await generateKeypair(privateKey);
  const publicKey = publicKeyToBase58(keypair.publicKey);

  // For authenticated operations
  const signClient = new SignClient(privateKey, {
    accountPublicKey: publicKey,
  });

  // For read operations
  const apiClient = new ApiClient();

  // Get account info
  const accountInfo = await apiClient.getAccountInfo(publicKey);
  console.log('Account Info:', accountInfo.data);

  // Create an order (unified method - defaults to limit order)
  const order = await signClient.createOrder({
    order_type: 'limit',
    symbol: 'BTC',
    side: 'bid',
    amount: '0.1',
    price: '50000',
    reduce_only: false,
    tif: 'GTC',
    client_order_id: `order-${Date.now()}`,
  });
  console.log('Order created:', order);
}

// Example 2: Using clients separately
async function example2() {
  // SignClient for authenticated operations
  const signClient = new SignClient('your-private-key-hex');
  
  // ApiClient for read operations
  const apiClient = new ApiClient();

  // Get market data
  const ticker = await apiClient.getTicker('BTC-USD');
  console.log('Ticker:', ticker);

  // Create an order
  const result = await signClient.createMarketOrder({
    market: 'ETH-USD',
    side: 'buy',
    size: '1.0',
  });
  console.log('Market order result:', result);
}

// Example 3: WebSocket usage
async function example3() {
  const wsClient = new WebSocketClient({
    url: 'wss://api.pacifica.fi/ws',
    privateKey: 'your-private-key-hex',
    accountPublicKey: 'your-public-key-hex',
    reconnect: true,
  });

  // Connect
  await wsClient.connect();

  // Subscribe to channels
  wsClient.subscribe('ticker:BTC-USD');
  wsClient.subscribe('orderbook:BTC-USD');

  // Listen to events
  wsClient.on('ticker', (data) => {
    console.log('Ticker update:', data);
  });

  wsClient.on('order_update', (data) => {
    console.log('Order update:', data);
  });

  // Create order via WebSocket
  await wsClient.createMarketOrder('BTC-USD', 'buy', '0.1');
}

// Example 4: Using API Agent Keys
async function example4() {
  const signClient = new SignClient('agent-wallet-private-key', {
    accountPublicKey: 'original-account-public-key',
    agentWalletPublicKey: 'agent-wallet-public-key',
  });

  // All operations will use the agent wallet
  const order = await signClient.createOrder({
    order_type: 'limit',
    symbol: 'BTC',
    side: 'bid',
    amount: '0.1',
    price: '50000',
  });
  console.log('Order with agent wallet:', order);
}

// Example 5: Error handling
async function example5() {
  const apiClient = new ApiClient();

  try {
    const result = await apiClient.getTicker('BTC-USD');
    if (result.success && result.data) {
      console.log('Ticker:', result.data);
    } else {
      console.error('API Error:', result.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Run examples
async function runExamples() {
  console.log('🚀 Running Basic Usage Examples\n');
  
  try {
    await example1();
  } catch (error) {
    console.error('Example 1 error:', error);
  }
  
  try {
    await example2();
  } catch (error) {
    console.error('Example 2 error:', error);
  }
  
  try {
    await example3();
  } catch (error) {
    console.error('Example 3 error:', error);
  }
  
  try {
    await example4();
  } catch (error) {
    console.error('Example 4 error:', error);
  }
  
  try {
    await example5();
  } catch (error) {
    console.error('Example 5 error:', error);
  }
}

runExamples().catch(console.error);







