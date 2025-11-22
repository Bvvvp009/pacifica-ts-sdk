/**
 * Close/Cancel Orders Examples
 * 
 * This example demonstrates how to cancel/close different types of orders:
 * - Limit orders (can be canceled if not filled)
 * - TWAP orders (can be canceled if not completed)
 * - Market orders (cannot be canceled - fill immediately)
 */

import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';

dotenv.config();

async function closeOrdersExamples() {
  console.log('❌ Close/Cancel Orders Examples\n');

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
    // 1. Cancel a limit order
    console.log('1️⃣  Canceling a limit order...\n');
    
    const openOrders = await apiClient.getOpenOrders(publicKey);
    
    if (openOrders.success && openOrders.data) {
      const orders = Array.isArray(openOrders.data) ? openOrders.data : [];
      const limitOrders = orders.filter((o: any) => o.order_type === 'limit' || o.price);
      
      if (limitOrders.length > 0) {
        const order = limitOrders[0] as any;
        const orderId = order.order_id || order.id;
        const symbol = order.symbol || order.market;
        
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Type: Limit Order`);
        console.log(`   Price: ${order.price}`);
        console.log(`   Amount: ${order.amount || order.size}\n`);

        const cancelResult = await signClient.cancelOrder({
          order_id: orderId,
          symbol: symbol,
        });

        if (cancelResult.success) {
          console.log('✅ Limit order canceled successfully!');
          console.log('Result:', JSON.stringify(cancelResult.data, null, 2));
        } else {
          console.error('❌ Failed to cancel order:', cancelResult.error);
        }
      } else {
        console.log('⚠️  No open limit orders found.');
        console.log('💡 Create a limit order first to test cancellation.\n');
      }
    }

    // 2. Cancel a TWAP order
    console.log('\n2️⃣  Canceling a TWAP order...\n');
    
    const twapOrders = await apiClient.getOpenTWAPOrders(publicKey);
    
    if (twapOrders.success && twapOrders.data) {
      const orders = Array.isArray(twapOrders.data) ? twapOrders.data : [];
      
      if (orders.length > 0) {
        const order = orders[0] as any;
        const orderId = order.id || order.order_id;
        
        console.log(`   TWAP Order ID: ${orderId}`);
        console.log(`   Symbol: ${order.symbol}`);
        console.log(`   Amount: ${order.amount}`);
        console.log(`   Status: ${order.status}\n`);

        const cancelResult = await signClient.cancelTWAPOrder({
          symbol: order.symbol,
          order_id: orderId,
        });

        if (cancelResult.success) {
          console.log('✅ TWAP order canceled successfully!');
          console.log('Result:', JSON.stringify(cancelResult.data, null, 2));
        } else {
          console.error('❌ Failed to cancel TWAP order:', cancelResult.error);
        }
      } else {
        console.log('⚠️  No open TWAP orders found.\n');
      }
    }

    // 3. Cancel all orders for a market
    console.log('\n3️⃣  Cancel all orders for a market...\n');
    console.log('   await signClient.cancelAllOrders("BTC");\n');
    
    // Uncomment to actually cancel all orders:
    // const cancelAllResult = await signClient.cancelAllOrders('BTC');
    // console.log('Result:', cancelAllResult);

    // 4. Cancel all orders (all markets)
    console.log('4️⃣  Cancel all orders (all markets)...\n');
    console.log('   await signClient.cancelAllOrders();\n');
    
    // Uncomment to actually cancel all orders:
    // const cancelAllResult = await signClient.cancelAllOrders();
    // console.log('Result:', cancelAllResult);

    // 5. Important notes
    console.log('📝 Important Notes:\n');
    console.log('   ✅ Limit Orders: Can be canceled if not filled');
    console.log('   ✅ TWAP Orders: Can be canceled if not completed');
    console.log('   ❌ Market Orders: Cannot be canceled (fill immediately)');
    console.log('   ❌ Filled Orders: Cannot be canceled (already executed)');
    console.log('   ✅ Open Positions: Can be closed with closePosition()\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.responseData) {
      console.error('Response:', JSON.stringify(error.responseData, null, 2));
    }
  }
}

// Run example
closeOrdersExamples().catch(console.error);

export default closeOrdersExamples;


