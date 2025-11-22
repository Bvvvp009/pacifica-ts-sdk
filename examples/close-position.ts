/**
 * Close Position Examples
 * 
 * This example demonstrates how to close positions that were opened
 * from filled orders (market/limit orders).
 */

import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';

dotenv.config();

async function closePositionExamples() {
  console.log('🚪 Close Position Examples\n');

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
    // 1. Get all open positions
    console.log('1️⃣  Checking open positions...\n');
    const positions = await apiClient.getPositions(publicKey);
    
    if (!positions.success || !positions.data || (Array.isArray(positions.data) && positions.data.length === 0)) {
      console.log('⚠️  No open positions found.');
      console.log('💡 To test closing positions, first open a position with a market or limit order.\n');
      return;
    }

    const posList = Array.isArray(positions.data) ? positions.data : [];
    console.log(`✅ Found ${posList.length} open positions:\n`);
    
    posList.forEach((pos: any, idx: number) => {
      console.log(`   Position ${idx + 1}:`);
      console.log(`   Symbol: ${pos.symbol || pos.market}`);
      console.log(`   Side: ${pos.side}`);
      console.log(`   Amount: ${pos.amount || pos.size}`);
      console.log(`   Entry Price: ${pos.entry_price}`);
      console.log(`   Unrealized PnL: ${pos.unrealized_pnl || 'N/A'}\n`);
    });

    // 2. Close entire position (market order - fills immediately)
    if (posList.length > 0) {
      const firstPos = posList[0] as any;
      const symbol = firstPos.symbol || firstPos.market;
      const amount = firstPos.amount || firstPos.size;
      
      console.log(`2️⃣  Closing entire position (Market Order)...\n`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Amount: ${amount} (full position)\n`);

      // Close entire position - no size specified = close all
      const closeResult = await signClient.closePosition({
        market: symbol,
        // size not specified = close entire position
      });

      if (closeResult.success) {
        console.log('✅ Position closed successfully!');
        console.log('Result:', JSON.stringify(closeResult.data, null, 2));
      } else {
        console.error('❌ Failed to close position:', closeResult.error);
      }
    }

    // 3. Close partial position (if you have a large position)
    console.log('\n3️⃣  Example: Close partial position...\n');
    console.log('   To close a partial position, specify the size:');
    console.log('   await signClient.closePosition({');
    console.log('     market: "BTC",');
    console.log('     size: "0.05",  // Close only 0.05 BTC');
    console.log('   });\n');

    // 4. Close position via market order (explicit)
    console.log('4️⃣  Close position with market order (explicit)...\n');
    console.log('   The closePosition() method uses a market order by default.');
    console.log('   It will execute immediately to close the position.\n');

    // 5. Check positions after closing
    console.log('5️⃣  Checking positions after close...\n');
    const positionsAfter = await apiClient.getPositions(publicKey);
    
    if (positionsAfter.success && positionsAfter.data) {
      const remainingPos = Array.isArray(positionsAfter.data) ? positionsAfter.data : [];
      console.log(`✅ Remaining positions: ${remainingPos.length}`);
      
      if (remainingPos.length === 0) {
        console.log('   All positions closed! ✅\n');
      } else {
        remainingPos.forEach((pos: any, idx: number) => {
          console.log(`   Position ${idx + 1}: ${pos.symbol || pos.market} - ${pos.amount || pos.size}`);
        });
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.responseData) {
      console.error('Response:', JSON.stringify(error.responseData, null, 2));
    }
  }
}

// Run example
closePositionExamples().catch(console.error);

export default closePositionExamples;


