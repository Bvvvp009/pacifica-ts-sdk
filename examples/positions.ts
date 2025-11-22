/**
 * Position Management Examples
 * 
 * This example demonstrates how to query positions and set
 * take-profit/stop-loss using the Pacifica TypeScript SDK.
 */

import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';

dotenv.config();

async function positionExamples() {
  console.log('👤 Position Management Examples\n');

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
    // 1. Get all positions
    console.log('1️⃣  Fetching all positions...');
    const positions = await apiClient.getPositions(publicKey);
    
    if (positions.success && positions.data) {
      const posList = Array.isArray(positions.data) ? positions.data : [];
      console.log(`✅ Found ${posList.length} positions:`);
      
      posList.forEach((pos: any, idx: number) => {
        console.log(`\n   Position ${idx + 1}:`);
        console.log(`   Symbol: ${pos.symbol}`);
        console.log(`   Side: ${pos.side}`);
        console.log(`   Amount: ${pos.amount}`);
        console.log(`   Entry Price: ${pos.entry_price}`);
        console.log(`   Funding: ${pos.funding}`);
        console.log(`   Isolated: ${pos.isolated}`);
      });
    }

    // 2. Get position for a specific market
    console.log('\n2️⃣  Fetching BTC position...');
    const btcPosition = await apiClient.getPosition('BTC', publicKey);
    
    if (btcPosition.success && btcPosition.data) {
      const pos = btcPosition.data as any;
      console.log('✅ BTC Position:');
      console.log(`   Amount: ${pos.amount || 'N/A'}`);
      console.log(`   Entry Price: ${pos.entry_price || 'N/A'}`);
    }

    // 3. Set take-profit and stop-loss for a position
    console.log('\n3️⃣  Setting take-profit and stop-loss...');
    
    // Get BTC position to determine side
    const btcPos = await apiClient.getPosition('BTC', publicKey);
    let positionSide: 'bid' | 'ask' = 'ask'; // Default to ask (sell) for long positions
    
    if (btcPos.success && btcPos.data) {
      const pos = btcPos.data as any;
      positionSide = pos.side === 'long' ? 'ask' : 'bid';
    }
    
    const tpslResult = await signClient.setPositionTPSL({
      symbol: 'BTC',
      side: positionSide,
      take_profit_simple: '55000',
      stop_loss_simple: '45000',
    });
    
    if (tpslResult.success) {
      console.log('✅ TP/SL set:', tpslResult.data);
    } else {
      console.error('❌ Failed to set TP/SL:', tpslResult.error);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// Run example
positionExamples().catch(console.error);

export default positionExamples;

