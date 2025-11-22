/**
 * WebSocket Trading Examples
 * 
 * This example demonstrates how to place orders and manage
 * positions via WebSocket using the Pacifica TypeScript SDK.
 */

import { WebSocketClient } from '../src/clients/WebSocketClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';

dotenv.config();

async function websocketTradingExamples() {
  console.log('🔌 WebSocket Trading Examples\n');

  // Initialize
  const privateKey = process.env.PRIVATE_KEY!;
  const keypair = await generateKeypair(privateKey);
  const publicKey = publicKeyToBase58(keypair.publicKey);

  // Initialize WebSocket client with authentication
  const wsClient = new WebSocketClient({
    url: process.env.PACIFICA_WS_URL || 'wss://ws.pacifica.fi/ws',
    privateKey: privateKey,
    accountPublicKey: publicKey,
    reconnect: true,
  });

  // Set up event handlers
  wsClient.on('open', async () => {
    console.log('✅ Connected to WebSocket');
    console.log(`📝 Account: ${publicKey}\n`);

    try {
      // Subscribe to order updates
      wsClient.subscribe('order_updates');
      console.log('✅ Subscribed to order updates\n');

      // 1. Create market order via WebSocket
      console.log('1️⃣  Creating market order via WebSocket...');
      await wsClient.createMarketOrder('BTC', 'buy', '0.0001');
      console.log('✅ Market order request sent\n');

      // 2. Create limit order via WebSocket
      console.log('2️⃣  Creating limit order via WebSocket...');
      await wsClient.createLimitOrder('BTC', 'buy', '0.0001', '50000');
      console.log('✅ Limit order request sent\n');

      // 3. Set position TP/SL via WebSocket
      console.log('3️⃣  Setting position TP/SL via WebSocket...');
      await wsClient.setPositionTPSL('BTC', '55000', '45000');
      console.log('✅ TP/SL request sent\n');

    } catch (error: any) {
      console.error('❌ Error:', error.message);
    }
  });

  // Handle order updates
  wsClient.on('order_update', (data) => {
    console.log('📝 Order Update:', JSON.stringify(data, null, 2));
  });

  // Handle errors
  wsClient.on('error', (error) => {
    console.error('❌ WebSocket Error:', error);
  });

  // Handle disconnect
  wsClient.on('close', () => {
    console.log('\n🔌 WebSocket disconnected');
  });

  try {
    // Connect to WebSocket
    await wsClient.connect();

    // Keep running for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Disconnect
    wsClient.disconnect();
    console.log('\n✅ Example completed');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    wsClient.disconnect();
  }
}

// Run example
websocketTradingExamples().catch(console.error);

export default websocketTradingExamples;

