/**
 * TWAP Order Examples
 * 
 * This example demonstrates how to create, query, and cancel
 * TWAP (Time-Weighted Average Price) orders using the Pacifica TypeScript SDK.
 */

import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

async function twapOrderExamples() {
  console.log('📊 TWAP Order Examples\n');

  // Initialize clients
  const privateKey = process.env.PRIVATE_KEY!;
  const keypair = await generateKeypair(privateKey);
  const publicKey = publicKeyToBase58(keypair.publicKey);

  const signClient = new SignClient(privateKey, {
    accountPublicKey: publicKey,
    baseUrl: process.env.PACIFICA_REST_URL || 'https://api.pacifica.fi',
  });

  const apiClient = new ApiClient({
    baseUrl: process.env.PACIFICA_REST_URL || 'https://api.pacifica.fi',
  });

  try {
    // 1. Create a TWAP order
    console.log('1️⃣  Creating a TWAP order...');
    const twapOrder = await signClient.createTWAPOrder({
      symbol: 'BTC',
      side: 'bid',
      amount: '0.001',
      slippage_percent: '0.1', // 0.1% slippage
      duration_in_seconds: 3600, // 1 hour
      reduce_only: false,
      client_order_id: randomUUID(),
    });
    console.log('✅ TWAP order created:', twapOrder.data);

    // 1b. Create a TWAP order with SL/TP (if supported by API)
    console.log('\n1b️⃣  Creating a TWAP order with Stop-Loss and Take-Profit...');
    const twapOrderWithSLTP = await signClient.createTWAPOrder({
      symbol: 'BTC',
      side: 'bid',
      amount: '0.001',
      slippage_percent: '0.1',
      duration_in_seconds: 3600,
      reduce_only: false,
      client_order_id: randomUUID(),
      take_profit: {
        stop_price: '55000',
        limit_price: '55100',
      },
      stop_loss: {
        stop_price: '45000',
      },
    });
    console.log('✅ TWAP order with SL/TP created:', twapOrderWithSLTP.data);

    // 2. Get open TWAP orders
    console.log('\n2️⃣  Fetching open TWAP orders...');
    const openTWAPOrders = await apiClient.getOpenTWAPOrders(publicKey);
    
    if (openTWAPOrders.success && openTWAPOrders.data) {
      const orders = Array.isArray(openTWAPOrders.data) ? openTWAPOrders.data : [];
      console.log(`✅ Found ${orders.length} open TWAP orders:`);
      orders.forEach((order: any, idx: number) => {
        console.log(`\n   TWAP Order ${idx + 1}:`);
        console.log(`   Order ID: ${order.order_id || order.id}`);
        console.log(`   Symbol: ${order.symbol}`);
        console.log(`   Total Amount: ${order.amount || 'N/A'}`);
        console.log(`   Remaining Amount: ${order.remaining_amount || 'N/A'}`);
        console.log(`   Duration: ${order.duration_seconds} seconds`);
      });
    }

    // 3. Get TWAP order history
    console.log('\n3️⃣  Fetching TWAP order history...');
    const twapHistory = await apiClient.getTWAPOrderHistory(publicKey);
    
    if (twapHistory.success && twapHistory.data) {
      const orders = Array.isArray(twapHistory.data) ? twapHistory.data : [];
      console.log(`✅ Found ${orders.length} TWAP orders in history`);
    }

    // 4. Get TWAP order by ID
    if (openTWAPOrders.data && Array.isArray(openTWAPOrders.data) && openTWAPOrders.data.length > 0) {
      const firstOrder = openTWAPOrders.data[0] as any;
      const orderId = firstOrder.order_id || firstOrder.id;
      
      console.log(`\n4️⃣  Fetching TWAP order by ID: ${orderId}...`);
      const orderById = await apiClient.getTWAPOrderHistoryById(orderId);
      console.log('✅ TWAP order details:', orderById.data);
    }

    // 5. Cancel a TWAP order
    if (openTWAPOrders.data && Array.isArray(openTWAPOrders.data) && openTWAPOrders.data.length > 0) {
      const firstOrder = openTWAPOrders.data[0] as any;
      const orderId = firstOrder.order_id || firstOrder.id;
      
      console.log(`\n5️⃣  Canceling TWAP order: ${orderId}...`);
      const cancelResult = await signClient.cancelTWAPOrder({
        symbol: 'BTC',
        order_id: orderId.toString(),
      });
      console.log('✅ TWAP order canceled:', cancelResult.data);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// Run example
twapOrderExamples().catch(console.error);

export default twapOrderExamples;

