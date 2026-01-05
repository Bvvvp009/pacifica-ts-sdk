/**
 * Example: Edit Order
 * Demonstrates how to edit existing limit orders
 */

import { SignClient, ApiClient } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Initialize clients
  const privateKey = process.env.PRIVATE_KEY || 'your-private-key-here';
  const signClient = new SignClient(privateKey);
  const apiClient = new ApiClient({ baseUrl: 'https://api.pacifica.fi' });

  console.log('=== Edit Order Examples ===\n');

  // Example 1: Create a limit order first
  console.log('1. Creating initial limit order...');
  try {
    const createResponse = await signClient.createLimitOrder({
      symbol: 'BTC',
      side: 'buy',
      amount: '0.1',
      price: '45000',
      post_only: true,
      client_order_id: 'example-order-001',
    });

    if (createResponse.success) {
      console.log('  ✓ Order created successfully');
      console.log(`  Order ID: ${(createResponse as any).order_id}`);
      console.log('  Details: Buy 0.1 BTC @ $45,000');

      // Get the order ID for editing
      const orderId = (createResponse as any).order_id;

      // Wait a moment before editing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Example 2: Edit order by order_id - update price
      console.log('\n2. Editing order - updating price...');
      const editResponse1 = await signClient.editOrder({
        order_id: orderId,
        symbol: 'BTC',
        price: '44500', // New price
        amount: '0.1', // Keep same amount
      });

      if (editResponse1.success) {
        console.log('  ✓ Order edited successfully');
        console.log(`  New Order ID: ${(editResponse1 as any).order_id}`);
        console.log('  Updated Details: Buy 0.1 BTC @ $44,500');
      }
    }
  } catch (error: any) {
    console.error('  ✗ Error:', error.message);
  }

  // Example 3: Edit order using client_order_id
  console.log('\n3. Creating and editing order using client_order_id...');
  try {
    const createResponse = await signClient.createLimitOrder({
      symbol: 'ETH',
      side: 'sell',
      amount: '2',
      price: '3200',
      post_only: true,
      client_order_id: 'my-eth-order-123',
    });

    if (createResponse.success) {
      console.log('  ✓ Order created: Sell 2 ETH @ $3,200');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Edit using client_order_id instead of order_id
      const editResponse = await signClient.editOrder({
        client_order_id: 'my-eth-order-123',
        symbol: 'ETH',
        price: '3250', // New higher price
        amount: '2',
      });

      if (editResponse.success) {
        console.log('  ✓ Order edited successfully');
        console.log('  Updated Details: Sell 2 ETH @ $3,250');
      }
    }
  } catch (error: any) {
    console.error('  ✗ Error:', error.message);
  }

  // Example 4: Edit order - update both price and amount
  console.log('\n4. Editing order - updating both price and amount...');
  try {
    const createResponse = await signClient.createLimitOrder({
      symbol: 'SOL',
      side: 'buy',
      amount: '10',
      price: '100',
      client_order_id: 'sol-order-456',
    });

    if (createResponse.success) {
      console.log('  ✓ Order created: Buy 10 SOL @ $100');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const editResponse = await signClient.editOrder({
        client_order_id: 'sol-order-456',
        symbol: 'SOL',
        price: '98', // Lower price
        amount: '15', // Increase amount
      });

      if (editResponse.success) {
        console.log('  ✓ Order edited successfully');
        console.log('  Updated Details: Buy 15 SOL @ $98');
      }
    }
  } catch (error: any) {
    console.error('  ✗ Error:', error.message);
  }

  // Example 5: Demonstrate validation errors
  console.log('\n5. Demonstrating validation...');
  
  try {
    // This should fail - no order_id or client_order_id
    await signClient.editOrder({
      symbol: 'BTC',
      price: '45000',
    });
  } catch (error: any) {
    console.log('  ✓ Validation works: ' + error.message);
  }

  try {
    // This should fail - no price or amount to update
    await signClient.editOrder({
      order_id: 123456,
      symbol: 'BTC',
    });
  } catch (error: any) {
    console.log('  ✓ Validation works: ' + error.message);
  }

  try {
    // This should fail - no symbol
    await signClient.editOrder({
      order_id: 123456,
      price: '45000',
    } as any);
  } catch (error: any) {
    console.log('  ✓ Validation works: ' + error.message);
  }

  // Example 6: Edit order with agent wallet
  console.log('\n6. Editing order with agent wallet...');
  try {
    // First, set up agent wallet (assuming it's already bound)
    const agentWalletPublicKey = 'your-agent-wallet-public-key';
    signClient.setAgentWallet(agentWalletPublicKey);

    const editResponse = await signClient.editOrder(
      {
        order_id: 123456,
        symbol: 'BTC',
        price: '46000',
        amount: '0.2',
      },
      {
        agent_wallet: agentWalletPublicKey,
      }
    );

    console.log('  ✓ Order edited using agent wallet');
  } catch (error: any) {
    console.log('  Note: Agent wallet example requires setup');
  }

  console.log('\n=== Important Notes ===');
  console.log('• editOrder() cancels the original order and creates a new one');
  console.log('• The new order maintains the same side and reduce_only status');
  console.log('• The new order is created with TIF = ALO (Post Only)');
  console.log('• A new system-assigned order_id is returned');
  console.log('• Edit order is not subject to the taker speedbump');
  console.log('• You must provide either order_id OR client_order_id (not both)');
}

// Run the example
main().catch(console.error);
