/**
 * Batch Orders Example
 * 
 * This example demonstrates how to execute multiple order
 * operations in a single request using batch orders.
 */

import { SignClient } from '../src/clients/SignClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

async function batchOrdersExample() {
  console.log('📦 Batch Orders Example\n');

  // Initialize client
  const privateKey = process.env.PRIVATE_KEY!;
  const keypair = await generateKeypair(privateKey);
  const publicKey = publicKeyToBase58(keypair.publicKey);

  const signClient = new SignClient(privateKey, {
    accountPublicKey: publicKey,
    baseUrl: process.env.PACIFICA_REST_URL || 'https://api.pacifica.fi',
  });

  try {
    // Create batch with multiple order actions
    console.log('1️⃣  Creating batch order with multiple actions...');
    
    const batchActions = [
      {
        type: 'Create' as const,
        data: {
          symbol: 'BTC',
          side: 'bid',
          amount: '0.0001',
          price: '50000',
          reduce_only: false,
          tif: 'GTC',
          client_order_id: randomUUID(),
        },
      },
      {
        type: 'Create' as const,
        data: {
          symbol: 'BTC',
          side: 'ask',
          amount: '0.0001',
          price: '51000',
          reduce_only: false,
          tif: 'GTC',
          client_order_id: randomUUID(),
        },
      },
    ];

    const batchResult = await signClient.batchOrders(batchActions);
    
    if (batchResult.success) {
      console.log('✅ Batch orders executed successfully');
      console.log('Result:', JSON.stringify(batchResult.data, null, 2));
    } else {
      console.error('❌ Batch order failed:', batchResult.error);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// Run example
batchOrdersExample().catch(console.error);

export default batchOrdersExample;

