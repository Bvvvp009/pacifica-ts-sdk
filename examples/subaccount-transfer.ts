/**
 * Subaccount Transfer Example
 * 
 * This example demonstrates how to transfer funds between your main account
 * and subaccounts, or between subaccounts.
 * 
 * You can transfer:
 * - From main account to subaccount
 * - From subaccount to main account
 * - From subaccount to another subaccount
 */

import 'dotenv/config';
import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';

async function subaccountTransferExample() {
  console.log('🔄 Subaccount Transfer Example\n');

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
    
    console.log('Main Account:', account);
    console.log('Current Balance:', accountInfo.data?.equity || 'N/A');
    console.log('Available:', accountInfo.data?.available_balance || 'N/A');
    console.log();

    // ⚠️ CONFIGURE TRANSFER PARAMETERS HERE
    const SUBACCOUNT_ID = 'YOUR_SUBACCOUNT_PUBLIC_KEY_HERE'; // Subaccount public key
    const TRANSFER_AMOUNT = '1.0'; // Amount to transfer (USDC)
    const CURRENCY = 'USDC'; // Currency to transfer

    if (SUBACCOUNT_ID === 'YOUR_SUBACCOUNT_PUBLIC_KEY_HERE') {
      console.log('⚠️  PLEASE UPDATE THE SUBACCOUNT_ID IN THIS FILE BEFORE RUNNING');
      console.log('   Edit examples/subaccount-transfer.ts and set your subaccount public key');
      console.log();
      console.log('💡 Transfer Parameters:');
      console.log('   Amount:', TRANSFER_AMOUNT, CURRENCY);
      console.log('   From: Main Account');
      console.log('   To: [NOT SET]');
      console.log();
      console.log('❌ Example stopped to prevent accidental transfer');
      return;
    }

    console.log('🔄 Initiating transfer...');
    console.log('   From: Main Account', account);
    console.log('   To: Subaccount', SUBACCOUNT_ID);
    console.log('   Amount:', TRANSFER_AMOUNT, CURRENCY);
    console.log();

    const transferResult = await signClient.subaccountTransfer({
      subaccount_id: SUBACCOUNT_ID,
      amount: TRANSFER_AMOUNT,
      currency: CURRENCY,
    });

    if (transferResult.success) {
      console.log('✅ Transfer completed successfully!');
      console.log();
      console.log('Response:', JSON.stringify(transferResult.data, null, 2));
      console.log();

      // Check updated balance
      console.log('📊 Checking updated balance...\n');
      const updatedInfo = await apiClient.getAccountInfo(account);
      console.log('Updated Balance:', updatedInfo.data?.equity || 'N/A');
      console.log('Updated Available:', updatedInfo.data?.available_balance || 'N/A');
    } else {
      console.log('❌ Transfer failed');
      console.log('Error:', transferResult.error?.message || 'Unknown error');
      console.log('Full response:', JSON.stringify(transferResult, null, 2));
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run example
subaccountTransferExample().catch(console.error);

export default subaccountTransferExample;
