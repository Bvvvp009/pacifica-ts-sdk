/**
 * Test WebSocket Heartbeat Mechanism
 * 
 * This example tests that the WebSocket connection stays alive
 * beyond the 60-second timeout by using ping/pong heartbeat.
 */

import 'dotenv/config';
import { WebSocketClient } from '../src/clients/WebSocketClient';

async function testHeartbeat() {
  console.log('🔌 Testing WebSocket Heartbeat\n');

  const wsClient = new WebSocketClient({
    url: 'wss://ws.pacifica.fi/ws',
  });

  // Track connection duration
  let startTime: number = 0;
  let connectionDuration = 0;
  let statusInterval: NodeJS.Timeout | null = null;

  wsClient.on('open', () => {
    console.log('✅ Connected to WebSocket');
    startTime = Date.now();

    // Show connection status every 15 seconds
    statusInterval = setInterval(() => {
      connectionDuration = Math.floor((Date.now() - startTime) / 1000);
      console.log(`⏱️  Connection alive: ${connectionDuration} seconds`);
      
      // Test passed if we stay connected for more than 90 seconds
      if (connectionDuration >= 90) {
        console.log('\n✅ SUCCESS: Connection stayed alive beyond 60 seconds!');
        console.log('   Heartbeat mechanism is working correctly.');
        if (statusInterval) clearInterval(statusInterval);
        wsClient.disconnect();
        process.exit(0);
      }
    }, 15000);
  });

  wsClient.on('close', () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.log(`\n❌ Connection closed after ${duration} seconds`);
    if (statusInterval) clearInterval(statusInterval);
    process.exit(1);
  });

  wsClient.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    if (statusInterval) clearInterval(statusInterval);
    process.exit(1);
  });

  try {
    await wsClient.connect();
    
    // Subscribe to something to keep data flowing
    wsClient.subscribe('prices');
    console.log('📊 Subscribed to market prices\n');
    console.log('⏳ Testing if connection stays alive beyond 60 seconds...\n');
  } catch (error) {
    console.error('Failed to connect:', error);
    process.exit(1);
  }
}

testHeartbeat().catch(console.error);
