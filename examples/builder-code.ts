/**
 * Builder Program Examples
 * 
 * This example demonstrates how to use the Builder Program:
 * 1. Approve builder codes
 * 2. Use builder codes in orders (automatic via env or manual)
 * 3. Revoke builder codes
 * 4. Query approved builder codes
 */

import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

async function builderCodeExamples() {
  console.log('🏗️  Builder Program Examples\n');

  // Initialize clients
  const privateKey = process.env.PRIVATE_KEY!;
  const keypair = await generateKeypair(privateKey);
  const publicKey = publicKeyToBase58(keypair.publicKey);

  const signClient = new SignClient(privateKey, {
    accountPublicKey: publicKey,
    baseUrl: process.env.PACIFICA_REST_URL || 'https://api.pacifica.fi',
    // Builder code can be set here or via BUILDER_CODE env variable
    builderCode: process.env.BUILDER_CODE,
  });

  const apiClient = new ApiClient({
    baseUrl: process.env.PACIFICA_REST_URL || 'https://api.pacifica.fi',
  });

  try {
    // 1. Query approved builder codes
    console.log('1️⃣  Querying approved builder codes...\n');
    const approvals = await signClient.getBuilderCodeApprovals(publicKey);
    
    if (approvals.success && approvals.data) {
      const codes = Array.isArray(approvals.data) ? approvals.data : [];
      console.log(`✅ Found ${codes.length} approved builder codes:`);
      codes.forEach((code: any, idx: number) => {
        console.log(`\n   Code ${idx + 1}:`);
        console.log(`   Builder Code: ${code.builder_code}`);
        console.log(`   Description: ${code.description || 'N/A'}`);
        console.log(`   Max Fee Rate: ${code.max_fee_rate}`);
        console.log(`   Updated At: ${new Date(code.updated_at).toISOString()}`);
      });
    } else {
      console.log('⚠️  No approved builder codes found.');
      console.log('💡 Approve a builder code first to use it in orders.\n');
    }

    // 2. Approve a builder code (example - requires actual builder code)
    console.log('\n2️⃣  Approving a builder code...\n');
    console.log('   To approve a builder code, use:');
    console.log('   await signClient.approveBuilderCode({');
    console.log('     builder_code: "YOUR_CODE",');
    console.log('     max_fee_rate: "0.001",  // User\'s max fee rate');
    console.log('   });\n');
    
    // Uncomment and provide actual builder code to test:
    /*
    const approveResult = await signClient.approveBuilderCode({
      builder_code: 'YOUR_BUILDER_CODE',
      max_fee_rate: '0.001', // Must be >= builder's fee_rate
    });
    
    if (approveResult.success) {
      console.log('✅ Builder code approved successfully!');
      console.log('Result:', JSON.stringify(approveResult.data, null, 2));
    } else {
      console.error('❌ Failed to approve builder code:', approveResult.error);
    }
    */

    // 3. Create order with builder code (automatic if BUILDER_CODE env is set)
    console.log('\n3️⃣  Creating order with builder code...\n');
    
    if (process.env.BUILDER_CODE) {
      console.log(`   Using builder code from env: ${process.env.BUILDER_CODE}`);
      console.log('   Builder code will be automatically included in order.\n');
    } else {
      console.log('   ⚠️  No BUILDER_CODE in environment.');
      console.log('   💡 Set BUILDER_CODE in .env or pass builder_code manually.\n');
    }

    const orderResult = await signClient.createOrder({
      order_type: 'limit',
      symbol: 'BTC',
      side: 'bid',
      amount: '0.0001',
      price: '50000',
      reduce_only: false,
      tif: 'GTC',
      client_order_id: randomUUID(),
      // Builder code can also be passed manually (overrides env/config)
      // builder_code: 'MANUAL_CODE',
    });

    if (orderResult.success) {
      console.log('✅ Order created successfully!');
      console.log('   Builder code was automatically included if set in env/config.');
      console.log('Result:', JSON.stringify(orderResult.data, null, 2));
    } else {
      console.error('❌ Failed to create order:', orderResult.error);
    }

    // 4. Create market order with builder code
    console.log('\n4️⃣  Creating market order with builder code...\n');
    
    const marketOrderResult = await signClient.createMarketOrder({
      symbol: 'BTC',
      side: 'bid',
      amount: '0.0001',
      // Builder code automatically included if set
    });

    if (marketOrderResult.success) {
      console.log('✅ Market order created with builder code!');
    } else {
      console.error('❌ Failed to create market order:', marketOrderResult.error);
    }

    // 5. Set position TPSL with builder code
    console.log('\n5️⃣  Setting position TPSL with builder code...\n');
    
    const positions = await apiClient.getPositions(publicKey);
    if (positions.success && positions.data && Array.isArray(positions.data) && positions.data.length > 0) {
      const pos = positions.data[0] as any;
      const symbol = pos.symbol || pos.market || 'BTC';
      const side = pos.side === 'long' ? 'ask' : 'bid';
      
      const tpslResult = await signClient.setPositionTPSL({
        symbol: symbol,
        side: side,
        take_profit_simple: '55000',
        stop_loss_simple: '45000',
        // Builder code automatically included if set
      });

      if (tpslResult.success) {
        console.log('✅ Position TPSL set with builder code!');
      } else {
        console.error('❌ Failed to set TPSL:', tpslResult.error);
      }
    } else {
      console.log('⚠️  No positions found to set TPSL.');
    }

    // 6. Revoke builder code (example)
    console.log('\n6️⃣  Revoking a builder code...\n');
    console.log('   To revoke a builder code, use:');
    console.log('   await signClient.revokeBuilderCode({');
    console.log('     builder_code: "YOUR_CODE",');
    console.log('   });\n');
    
    // Uncomment to test revocation:
    /*
    const revokeResult = await signClient.revokeBuilderCode({
      builder_code: 'YOUR_BUILDER_CODE',
    });
    
    if (revokeResult.success) {
      console.log('✅ Builder code revoked successfully!');
    } else {
      console.error('❌ Failed to revoke builder code:', revokeResult.error);
    }
    */

    // 7. Important notes
    console.log('\n📝 Important Notes:\n');
    console.log('   ✅ Builder code is automatically included if BUILDER_CODE env is set');
    console.log('   ✅ Builder code can be set via constructor config');
    console.log('   ✅ Builder code can be manually passed per order (overrides auto)');
    console.log('   ✅ Builder code must be approved by user before use');
    console.log('   ✅ User\'s max_fee_rate must be >= builder\'s fee_rate');
    console.log('   ✅ Builder code works with: limit, market, stop orders, and TPSL\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.responseData) {
      console.error('Response:', JSON.stringify(error.responseData, null, 2));
    }
  }
}

// Run example
builderCodeExamples().catch(console.error);

export default builderCodeExamples;




