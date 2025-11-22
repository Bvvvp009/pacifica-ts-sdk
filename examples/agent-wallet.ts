/**
 * Agent Wallet (API Agent Keys) Examples
 * 
 * This example demonstrates how to use API Agent Keys for
 * agent wallet authentication and management.
 */

import { SignClient } from '../src/clients/SignClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';

dotenv.config();

async function agentWalletExamples() {
  console.log('🔑 Agent Wallet (API Agent Keys) Examples\n');

  // Initialize with agent wallet
  const privateKey = process.env.PRIVATE_KEY!; // Main account private key
  const agentPrivateKey = process.env.API_PRIVATE_KEY!; // Agent wallet private key

  const mainKeypair = await generateKeypair(privateKey);
  const mainPublicKey = publicKeyToBase58(mainKeypair.publicKey);

  const agentKeypair = await generateKeypair(agentPrivateKey);
  const agentPublicKey = publicKeyToBase58(agentKeypair.publicKey);

  // SignClient with agent wallet
  const signClient = new SignClient(agentPrivateKey, {
    accountPublicKey: mainPublicKey, // Original account public key
    agentWalletPublicKey: agentPublicKey, // Agent wallet public key
    baseUrl: process.env.PACIFICA_REST_URL || 'https://api.pacifica.fi',
  });

  try {
    // 1. List agent wallets
    console.log('1️⃣  Listing agent wallets...');
    const agentWallets = await signClient.listAgentWallets();
    console.log('✅ Agent wallets:', agentWallets.data);

    // 2. Create order with agent wallet
    console.log('\n2️⃣  Creating order with agent wallet...');
    const order = await signClient.createOrder({
      order_type: 'limit',
      symbol: 'BTC',
      side: 'bid',
      amount: '0.0001',
      price: '50000',
      reduce_only: false,
      tif: 'GTC',
      client_order_id: `agent-${Date.now()}`,
    });
    console.log('✅ Order created with agent wallet:', order.data);

    // 3. List agent IP whitelist
    console.log('\n3️⃣  Listing agent IP whitelist...');
    try {
      const ipWhitelist = await signClient.listAgentIPWhitelist({
        api_agent_key: agentPublicKey,
      });
      console.log('✅ IP whitelist:', ipWhitelist.data);
    } catch (error: any) {
      console.log('⚠️  IP whitelist query:', error.message);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// Run example
agentWalletExamples().catch(console.error);

export default agentWalletExamples;

