/**
 * Account Information Examples
 * 
 * This example demonstrates how to query account information,
 * balance, and account history using the Pacifica TypeScript SDK.
 */

import { ApiClient } from '../src/clients/ApiClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';

dotenv.config();

async function accountInfoExamples() {
  console.log('💼 Account Information Examples\n');

  // Initialize client
  const privateKey = process.env.PRIVATE_KEY!;
  const keypair = await generateKeypair(privateKey);
  const publicKey = publicKeyToBase58(keypair.publicKey);

  const apiClient = new ApiClient({
    baseUrl: process.env.PACIFICA_REST_URL || 'https://api.pacifica.fi',
  });

  try {
    // 1. Get account info (includes balance, equity, etc.)
    console.log('1️⃣  Fetching account information...');
    const accountInfo = await apiClient.getAccountInfo(publicKey);
    
    if (accountInfo.success && accountInfo.data) {
      const data = Array.isArray(accountInfo.data) ? accountInfo.data[0] : accountInfo.data;
      console.log('✅ Account Information:');
      console.log(`   Balance: ${data.balance}`);
      console.log(`   Account Equity: ${data.account_equity}`);
      console.log(`   Available to Spend: ${data.available_to_spend}`);
      console.log(`   Available to Withdraw: ${data.available_to_withdraw}`);
      console.log(`   Fee Level: ${data.fee_level}`);
      console.log(`   Positions Count: ${data.positions_count}`);
      console.log(`   Orders Count: ${data.orders_count}`);
    }

    // 2. Get balance (uses account info endpoint)
    console.log('\n2️⃣  Fetching balance...');
    const balance = await apiClient.getBalance(publicKey);
    if (balance.success && balance.data) {
      const data = Array.isArray(balance.data) ? balance.data[0] : balance.data;
      console.log('✅ Balance:', data.balance);
    }

    // 3. Get account balance history
    console.log('\n3️⃣  Fetching account balance history...');
    const history = await apiClient.getAccountHistory(publicKey, 10);
    
    if (history.success && history.data) {
      const records = Array.isArray(history.data) ? history.data : [];
      console.log(`✅ Found ${records.length} balance history records:`);
      records.slice(0, 5).forEach((record: any, idx: number) => {
        console.log(`   ${idx + 1}. ${record.event_type}: ${record.amount} at ${new Date(record.created_at).toISOString()}`);
      });
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// Run example
accountInfoExamples().catch(console.error);

export default accountInfoExamples;

