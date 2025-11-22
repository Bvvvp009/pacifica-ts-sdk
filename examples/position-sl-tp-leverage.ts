/**
 * Position Management: SL/TP and Leverage Examples
 * 
 * This example demonstrates:
 * 1. Setting stop-loss and take-profit on positions
 * 2. Modifying leverage (increase/decrease)
 * 3. Changing margin mode (isolated/cross)
 */

import { SignClient } from '../src/clients/SignClient';
import { ApiClient } from '../src/clients/ApiClient';
import { generateKeypair, publicKeyToBase58 } from '../src/utils/signer';
import * as dotenv from 'dotenv';

dotenv.config();

async function positionManagementExamples() {
  console.log('🎯 Position Management: SL/TP & Leverage Examples\n');

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
    // 1. Check current positions
    console.log('1️⃣  Checking current positions...\n');
    const positions = await apiClient.getPositions(publicKey);
    
    if (!positions.success || !positions.data || (Array.isArray(positions.data) && positions.data.length === 0)) {
      console.log('⚠️  No open positions found.');
      console.log('💡 Open a position first with a market or limit order.\n');
      return;
    }

    const posList = Array.isArray(positions.data) ? positions.data : [];
    const firstPos = posList[0] as any;
    const symbol = firstPos.symbol || firstPos.market || 'BTC';

    console.log(`✅ Found position: ${symbol}`);
    console.log(`   Amount: ${firstPos.amount || firstPos.size}`);
    console.log(`   Entry Price: ${firstPos.entry_price}`);
    console.log(`   Current Leverage: ${firstPos.leverage || 'N/A'}`);
    console.log(`   Margin Mode: ${firstPos.margin_mode || firstPos.isolated ? 'isolated' : 'cross'}\n`);

    // 2. Set Stop-Loss and Take-Profit
    console.log('2️⃣  Setting Stop-Loss and Take-Profit...\n');
    
    const entryPrice = parseFloat(firstPos.entry_price || '0');
    const takeProfit = (entryPrice * 1.05).toFixed(0); // 5% above entry
    const stopLoss = (entryPrice * 0.95).toFixed(0);  // 5% below entry

    console.log(`   Entry Price: ${entryPrice}`);
    console.log(`   Take Profit: ${takeProfit} (+5%)`);
    console.log(`   Stop Loss: ${stopLoss} (-5%)\n`);

    // Set TPSL using simple format (legacy support)
    // Determine side from position
    const positionSide = firstPos.side === 'long' ? 'ask' : 'bid';
    
    const tpslResult = await signClient.setPositionTPSL({
      symbol: symbol,
      side: positionSide,
      take_profit_simple: takeProfit,
      stop_loss_simple: stopLoss,
    });

    if (tpslResult.success) {
      console.log('✅ TP/SL set successfully!');
      console.log('Result:', JSON.stringify(tpslResult.data, null, 2));
    } else {
      console.error('❌ Failed to set TP/SL:', tpslResult.error);
    }

    // 3. Update Leverage
    console.log('\n3️⃣  Updating Leverage...\n');
    
    const currentLeverage = firstPos.leverage || 1;
    const newLeverage = currentLeverage < 10 ? 10 : 5; // Increase or decrease

    console.log(`   Current Leverage: ${currentLeverage}x`);
    console.log(`   New Leverage: ${newLeverage}x\n`);

    const leverageResult = await signClient.updateLeverage({
      market: symbol,
      leverage: newLeverage,
    });

    if (leverageResult.success) {
      console.log('✅ Leverage updated successfully!');
      console.log('Result:', JSON.stringify(leverageResult.data, null, 2));
    } else {
      console.error('❌ Failed to update leverage:', leverageResult.error);
    }

    // 4. Change Margin Mode
    console.log('\n4️⃣  Changing Margin Mode...\n');
    
    const currentMode = firstPos.isolated ? 'isolated' : 'cross';
    const newMode = currentMode === 'isolated' ? 'cross' : 'isolated';

    console.log(`   Current Mode: ${currentMode}`);
    console.log(`   New Mode: ${newMode}\n`);

    const marginResult = await signClient.updateMarginMode({
      market: symbol,
      margin_mode: newMode,
    });

    if (marginResult.success) {
      console.log('✅ Margin mode updated successfully!');
      console.log('Result:', JSON.stringify(marginResult.data, null, 2));
    } else {
      console.error('❌ Failed to update margin mode:', marginResult.error);
    }

    // 5. Modify Position (combined leverage + margin mode)
    console.log('\n5️⃣  Modifying Position (Leverage + Margin Mode)...\n');
    
    const modifyResult = await signClient.modifyPosition({
      market: symbol,
      leverage: 15,
      margin_mode: 'isolated',
    });

    if (modifyResult.success) {
      console.log('✅ Position modified successfully!');
      console.log('Result:', JSON.stringify(modifyResult.data, null, 2));
    } else {
      console.error('❌ Failed to modify position:', modifyResult.error);
    }

    // 6. Verify changes
    console.log('\n6️⃣  Verifying changes...\n');
    const positionAfter = await apiClient.getPosition(symbol, publicKey);
    
    if (positionAfter.success && positionAfter.data) {
      const pos = positionAfter.data as any;
      console.log('Updated Position:');
      console.log(`   Leverage: ${pos.leverage || 'N/A'}`);
      console.log(`   Margin Mode: ${pos.margin_mode || (pos.isolated ? 'isolated' : 'cross')}`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.responseData) {
      console.error('Response:', JSON.stringify(error.responseData, null, 2));
    }
  }
}

// Run example
positionManagementExamples().catch(console.error);

export default positionManagementExamples;


