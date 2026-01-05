/**
 * Create Subaccount Example
 * 
 * This example demonstrates how to create a subaccount under your main account.
 * Subaccounts allow you to separate funds and positions for different strategies.
 */

import 'dotenv/config';
import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';

async function createSubaccountExample() {
  console.log('➕ Create Subaccount Example\n');

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
    console.log('Main Account:', account);
    console.log();

    // Create new subaccount (two-step process: initiate then confirm)
    console.log('➕ Creating new subaccount...\n');
    console.log('   Step 1: Initiating subaccount creation...\n');
    const initiateResult = await signClient.initiateSubaccount();
    
    if (!initiateResult.success) {
      console.log('❌ Failed to initiate subaccount creation');
      console.log('Error:', initiateResult.error?.message || 'Unknown error');
      console.log('Full response:', JSON.stringify(initiateResult, null, 2));
      return;
    }
    
    console.log('✅ Subaccount initiated!');
    console.log('Response:', JSON.stringify(initiateResult.data, null, 2));
    console.log();
    
    // Extract subaccount_id from response
    const subaccountId = initiateResult.data?.subaccount_id || initiateResult.data?.id;
    if (!subaccountId) {
      console.log('❌ No subaccount_id in response');
      return;
    }
    
    console.log('   Step 2: Confirming subaccount creation...\n');
    const createResult = await signClient.confirmSubaccount({ subaccount_id: subaccountId });

    if (createResult.success) {
      console.log('✅ Subaccount created successfully!');
      console.log();
      console.log('Subaccount ID:', subaccountId);
      console.log('Response:', JSON.stringify(createResult.data, null, 2));
      console.log();
      console.log('📊 You can now use this subaccount ID in subaccount-transfer.ts');
    } else {
      console.log('❌ Failed to create subaccount');
      console.log('Error:', createResult.error?.message || 'Unknown error');
      console.log('Full response:', JSON.stringify(createResult, null, 2));
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run example
createSubaccountExample().catch(console.error);

export default createSubaccountExample;
