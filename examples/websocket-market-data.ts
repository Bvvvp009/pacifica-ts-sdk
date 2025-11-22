/**
 * WebSocket Market Data Examples
 * 
 * This example demonstrates how to connect to WebSocket and
 * subscribe to real-time market data using the Pacifica TypeScript SDK.
 */

import { WebSocketClient } from '../src/clients/WebSocketClient';
import * as dotenv from 'dotenv';

dotenv.config();

async function websocketMarketDataExamples() {
  console.log('🔌 WebSocket Market Data Examples\n');

  // Initialize WebSocket client
  const privateKey = process.env.PRIVATE_KEY!;
  const wsClient = new WebSocketClient({
    url: process.env.PACIFICA_WS_URL || 'wss://ws.pacifica.fi/ws',
    privateKey: privateKey,
    reconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
  });

  // Set up event handlers
  wsClient.on('open', () => {
    console.log('✅ Connected to WebSocket');
    console.log('\n📊 Subscribing to market data...\n');

    // Subscribe to all prices
    wsClient.subscribeToPrices();
    console.log('✅ Subscribed to: prices (all market prices)');

    // Subscribe to specific market ticker
    wsClient.subscribeToTicker('BTC');
    console.log('✅ Subscribed to: ticker:BTC');

    // Subscribe to orderbook
    wsClient.subscribeToOrderbook('BTC');
    console.log('✅ Subscribed to: orderbook:BTC');

    // Subscribe to trades
    wsClient.subscribeToTrades('BTC');
    console.log('✅ Subscribed to: trades:BTC');

    console.log('\n⏳ Listening for market data updates...\n');
  });

  // Handle ticker updates
  wsClient.on('ticker', (data) => {
    console.log('📈 Ticker Update:', JSON.stringify(data, null, 2));
  });

  // Handle orderbook updates
  wsClient.on('orderbook', (data) => {
    console.log('📖 Orderbook Update:', JSON.stringify(data, null, 2));
  });

  // Handle trade updates
  wsClient.on('trade', (data) => {
    console.log('💱 Trade:', JSON.stringify(data, null, 2));
  });

  // Handle other messages
  wsClient.on('message', (data) => {
    if (data.type && !['ticker', 'orderbook', 'trade'].includes(data.type)) {
      console.log('📨 Message:', JSON.stringify(data, null, 2));
    }
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

    // Keep running for 60 seconds to receive data
    console.log('⏳ Running for 60 seconds to receive market data...\n');
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Disconnect
    wsClient.disconnect();
    console.log('\n✅ Example completed');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    wsClient.disconnect();
  }
}

// Run example
websocketMarketDataExamples().catch(console.error);

export default websocketMarketDataExamples;

