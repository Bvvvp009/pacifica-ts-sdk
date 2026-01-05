/**
 * Withdraw Example
 * 
 * This example demonstrates how to withdraw funds from your Pacifica account
 * to an external Solana address.
 * 
 * ⚠️ WARNING: This moves real money! Test with small amounts first.
 */

import 'dotenv/config';
import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';

async function withdrawExample() {
  console.log('💸 Withdraw Example\n');

  const privateKey = process.env.PRIVATE_KEY!;
  if (!privateKey) {
    console.error('❌ PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  const signClient = new SignClient(privateKey);
  const apiClient = new ApiClient();

  // Get account public key
  const { generateKeypair, publicKeyToBase58 } = await import('../src/utils/signer');
  const keypair = await generateKeypair(privateKey);
  const account = publicKeyToBase58(keypair.publicKey);

  try {
    // First, check account balance
    console.log('📊 Checking account balance...\n');
    
    const accountInfo = await apiClient.getAccountInfo(account);
    
    console.log('Account:', account);
    console.log('Current Balance:', accountInfo.data?.equity || 'N/A');
    console.log('Available:', accountInfo.data?.available_balance || 'N/A');
    console.log();

    // ⚠️ CONFIGURE WITHDRAW PARAMETERS HERE
    const WITHDRAW_AMOUNT = '0.1'; // Amount to withdraw (USDC)
    const DESTINATION_ADDRESS = 'YOUR_SOLANA_WALLET_ADDRESS_HERE'; // Your Solana wallet address
    const CURRENCY = 'USDC'; // Currency to withdraw

    if (DESTINATION_ADDRESS === 'YOUR_SOLANA_WALLET_ADDRESS_HERE') {
      console.log('⚠️  PLEASE UPDATE THE DESTINATION_ADDRESS IN THIS FILE BEFORE RUNNING');
      console.log('   Edit examples/withdraw.ts and set your Solana wallet address');
      console.log();
      console.log('💡 Withdraw Parameters:');
      console.log('   Amount:', WITHDRAW_AMOUNT, CURRENCY);
      console.log('   Destination: [NOT SET]');
      console.log();
      console.log('❌ Example stopped to prevent accidental withdrawal');
      return;
    }

    console.log('💸 Initiating withdrawal...');
    console.log('   Amount:', WITHDRAW_AMOUNT, CURRENCY);
    console.log('   Destination:', DESTINATION_ADDRESS);
    console.log();

    const withdrawResult = await signClient.withdraw({
      amount: WITHDRAW_AMOUNT,
      currency: CURRENCY,
      address: DESTINATION_ADDRESS,
    });

    if (withdrawResult.success) {
      console.log('✅ Withdrawal initiated successfully!');
      console.log();
      console.log('Response:', JSON.stringify(withdrawResult.data, null, 2));
      console.log();
      console.log('⏳ Withdrawal is being processed. Check your wallet in a few minutes.');
    } else {
      console.log('❌ Withdrawal failed');
      console.log('Error:', withdrawResult.error?.message || 'Unknown error');
      console.log('Full response:', JSON.stringify(withdrawResult, null, 2));
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run example
withdrawExample().catch(console.error);

export default withdrawExample;
