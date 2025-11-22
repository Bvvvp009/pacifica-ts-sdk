# Pacifica TypeScript SDK

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Community-built TypeScript SDK for the Pacifica API by [@bvvvp009](https://github.com/bvvvp009).

This SDK provides a type-safe, modern interface for trading, account management, and real-time data streaming on Pacifica.

## Features

- 🔐 **Ed25519 Signing** - Secure request signing for authenticated operations
- 📡 **REST API Client** - Full coverage of Pacifica REST endpoints
- 🔌 **WebSocket Client** - Real-time market data and order updates
- 🎯 **TypeScript First** - Complete type definitions for all operations
- 🔑 **API Agent Keys** - Support for agent wallet authentication
- ⚡ **Async/Await** - Modern async patterns throughout
- 🛡️ **Error Handling** - Comprehensive error handling and validation

## Installation

```bash
npm install pacifica-ts-sdk
# or
yarn add pacifica-ts-sdk
# or
pnpm add pacifica-ts-sdk
```

## Quick Start

### Basic Usage

```typescript
import { SignClient, ApiClient } from 'pacifica-ts-sdk';
import { generateKeypair, publicKeyToBase58 } from 'pacifica-ts-sdk/utils/signer';

// Generate keypair from private key
const privateKey = process.env.PRIVATE_KEY!;
const keypair = await generateKeypair(privateKey);
const publicKey = publicKeyToBase58(keypair.publicKey);

// For authenticated operations
const signClient = new SignClient(privateKey, {
  accountPublicKey: publicKey,
});

// For read operations
const apiClient = new ApiClient();

// Get account information
const accountInfo = await apiClient.getAccountInfo(publicKey);
console.log('Balance:', accountInfo.data[0].balance);

// Create an order
const order = await signClient.createOrder({
  symbol: 'BTC',
  side: 'bid',
  amount: '0.1',
  price: '50000',
  reduce_only: false,
  tif: 'GTC',
  client_order_id: `order-${Date.now()}`,
});
console.log('Order created:', order.data);
```

### Using SignClient and ApiClient Separately

```typescript
import { SignClient, ApiClient } from 'pacifica-ts-sdk';

// For authenticated operations
const signClient = new SignClient('your-private-key-hex', {
  accountPublicKey: 'your-public-key-hex', // optional
  expiryWindow: 300, // 5 minutes
});

// For read-only operations
const apiClient = new ApiClient({
  baseUrl: 'https://api.pacifica.fi', // optional, defaults to this
});

// Create an order
const result = await signClient.createOrder({
  symbol: 'BTC',
  side: 'bid',
  amount: '0.1',
  price: '50000',
  reduce_only: false,
  tif: 'GTC',
  client_order_id: `order-${Date.now()}`,
});

// Get account information
const accountInfo = await apiClient.getAccountInfo(publicKey);

// Get positions
const positions = await apiClient.getPositions(publicKey);

// Get order history
const orderHistory = await apiClient.getOrderHistory(publicKey, 'BTC', 10);
```

### WebSocket Usage

```typescript
import { WebSocketClient } from 'pacifica-ts-sdk';

const wsClient = new WebSocketClient({
  url: 'wss://api.pacifica.fi/ws',
  privateKey: 'your-private-key-hex',
  accountPublicKey: 'your-public-key-hex',
  reconnect: true,
});

// Connect to WebSocket
await wsClient.connect();

// Subscribe to market data
wsClient.subscribeToPrices(); // All prices
wsClient.subscribeToTicker('BTC'); // BTC ticker
wsClient.subscribeToOrderbook('BTC'); // BTC orderbook
wsClient.subscribeToTrades('BTC'); // BTC trades

// Listen to events
wsClient.on('ticker', (data) => {
  console.log('Ticker update:', data);
});

wsClient.on('orderbook', (data) => {
  console.log('Orderbook update:', data);
});

wsClient.on('trade', (data) => {
  console.log('Trade:', data);
});

// Create orders via WebSocket
await wsClient.createMarketOrder('BTC', 'bid', '0.1');
await wsClient.createLimitOrder('BTC', 'bid', '0.1', '50000');
```

### Using API Agent Keys

```typescript
import { SignClient } from 'pacifica-ts-sdk';

// Initialize with agent wallet
const signClient = new SignClient('agent-wallet-private-key', {
  accountPublicKey: 'original-account-public-key',
  agentWalletPublicKey: 'agent-wallet-public-key',
});

// Or set agent wallet later
signClient.setAgentWallet('agent-wallet-public-key');

// Use agent wallet for operations
const order = await signClient.createOrder({
  symbol: 'BTC',
  side: 'bid',
  amount: '0.1',
  price: '50000',
  reduce_only: false,
  tif: 'GTC',
  client_order_id: `order-${Date.now()}`,
});
```

### Stop-Loss and Take-Profit with Orders

```typescript
// Create order with integrated SL/TP
const order = await signClient.createOrder({
  symbol: 'BTC',
  side: 'bid',
  amount: '0.1',
  price: '50000',
  take_profit: {
    stop_price: '55000',
    limit_price: '55100',
  },
  stop_loss: {
    stop_price: '45000',
  },
});

// Market order with SL/TP
const marketOrder = await signClient.createMarketOrder({
  symbol: 'BTC',
  side: 'bid',
  amount: '0.1',
  take_profit: {
    stop_price: '55000',
    limit_price: '55100',
  },
  stop_loss: {
    stop_price: '45000',
  },
});
```

### Builder Program

```typescript
// Set builder code in environment or config
const signClient = new SignClient(privateKey, {
  builderCode: 'your-builder-code', // Or set BUILDER_CODE in .env
});

// Builder code is automatically included in all orders
const order = await signClient.createOrder({
  symbol: 'BTC',
  side: 'bid',
  amount: '0.1',
  price: '50000',
  // builder_code is automatically added if configured
});

// Manage builder code approvals
await signClient.approveBuilderCode({
  builder_code: 'builder-code',
  max_fee_rate: '0.001', // 0.1%
});

await signClient.revokeBuilderCode({
  builder_code: 'builder-code',
});

const approvals = await signClient.getBuilderCodeApprovals(publicKey);
```

See [Builder Program Documentation](https://docs.pacifica.fi/builder-program) for details.

## API Reference

### SignClient

Handles all authenticated POST requests that require signing.

#### Order Management

```typescript
// Create limit order
await signClient.createOrder({
  symbol: 'BTC',
  side: 'bid',
  amount: '0.1',
  price: '50000',
  reduce_only: false,
  tif: 'GTC',
  client_order_id: `order-${Date.now()}`,
});

// Create market order
await signClient.createMarketOrder({
  symbol: 'BTC',
  side: 'bid',
  amount: '0.1',
});

// Create stop order
await signClient.createStopOrder({
  symbol: 'BTC',
  side: 'ask',
  amount: '0.1',
  stop_price: '45000',
  price: '44900',
});

// Cancel order
await signClient.cancelOrder({
  order_id: '1234567890',
  symbol: 'BTC',
});

// Cancel all orders
await signClient.cancelAllOrders('BTC'); // or without market param
```

#### Account Management

```typescript
// Update leverage
await signClient.updateLeverage({
  symbol: 'BTC',
  leverage: 10,
});

// Update margin mode
await signClient.updateMarginMode({
  symbol: 'BTC',
  margin_mode: 'isolated',
});

// Withdraw funds
await signClient.withdraw({
  amount: '1.0',
  currency: 'USDC',
  address: '0x...',
});

// API Key management
await signClient.createApiKey(['read', 'write']);
await signClient.revokeApiKey('api-key-id');
await signClient.listApiKeys();
```

#### Position Management

```typescript
// Set take-profit/stop-loss (simple format)
await signClient.setPositionTPSL({
  symbol: 'BTC',
  side: 'ask', // 'ask' for long positions, 'bid' for short positions
  take_profit_simple: '55000',
  stop_loss_simple: '45000',
});

// Set take-profit/stop-loss (complex format with full control)
await signClient.setPositionTPSL({
  symbol: 'BTC',
  side: 'ask',
  take_profit: {
    stop_price: '55000',
    limit_price: '55100',
    amount: '0.1', // Optional: partial close
  },
  stop_loss: {
    stop_price: '45000',
    // limit_price optional - market order if omitted
  },
});

// Close position
await signClient.closePosition({
  market: 'BTC',
  // size: '0.1', // Optional: partial close, omit for full close
});
```

### ApiClient

Handles all read-only GET requests.

```typescript
// Account data (requires account parameter)
import { generateKeypair, publicKeyToBase58 } from 'pacifica-ts-sdk/utils/signer';
const keypair = await generateKeypair('your-private-key');
const publicKey = publicKeyToBase58(keypair.publicKey);

const accountInfo = await apiClient.getAccountInfo(publicKey);
const balance = await apiClient.getBalance(publicKey);
const accountHistory = await apiClient.getAccountHistory(publicKey, 10);

// Orders (requires account parameter)
const openOrders = await apiClient.getOpenOrders(publicKey, 'BTC');
const orderHistory = await apiClient.getOrderHistory(publicKey, 'BTC', 100);

// Positions (requires account parameter)
const positions = await apiClient.getPositions(publicKey);
const position = await apiClient.getPosition('BTC', publicKey);

// TWAP Orders
const twapOrders = await apiClient.getOpenTWAPOrders(publicKey);
const twapHistory = await apiClient.getTWAPOrderHistory(publicKey);
```

### WebSocketClient

Real-time data streaming and WebSocket trading.

```typescript
// Connection management
await wsClient.connect();
wsClient.disconnect();
const state = wsClient.getState(); // 'connecting' | 'open' | 'closing' | 'closed'

// Subscriptions
wsClient.subscribe('ticker:BTC-USD');
wsClient.subscribe('orderbook:BTC-USD');
wsClient.subscribe('trades:BTC-USD');
wsClient.unsubscribe('ticker:BTC-USD');

// Events
wsClient.on('open', () => console.log('Connected'));
wsClient.on('close', () => console.log('Disconnected'));
wsClient.on('error', ({ error }) => console.error('Error:', error));
wsClient.on('ticker', (data) => console.log('Ticker:', data));
wsClient.on('orderbook', (data) => console.log('Orderbook:', data));
wsClient.on('order_update', (data) => console.log('Order update:', data));

// Trading via WebSocket
await wsClient.createMarketOrder('BTC', 'bid', '0.1');
await wsClient.createLimitOrder('BTC', 'bid', '0.1', '50000');
await wsClient.createStopOrder('BTC', 'ask', '0.1', '45000');
await wsClient.setPositionTPSL('BTC', '55000', '45000');
```

## Signing Implementation

The SDK implements Ed25519 signing as required by Pacifica API:

1. Generate keypair from private key
2. Create signature header with timestamp
3. Combine header and operation data
4. Recursively sort JSON keys
5. Create compact JSON string
6. Sign with Ed25519 private key
7. Build final request with signature

See [Pacifica Signing Documentation](https://docs.pacifica.fi/api-documentation/api/signing/implementation) for details.

## Configuration

```typescript
const sdk = new PacificaSDK('private-key', {
  baseUrl: 'https://api.pacifica.fi', // API base URL
  wsUrl: 'wss://api.pacifica.fi/ws',  // WebSocket URL
  timeout: 30000,                     // Request timeout (ms)
  accountPublicKey: 'public-key',     // Your account public key
  agentWalletPublicKey: 'agent-key',  // Agent wallet public key (optional)
  expiryWindow: 300,                  // Signature expiry (seconds)
  wsReconnect: true,                  // Auto-reconnect WebSocket
});
```

## Error Handling

```typescript
try {
  const result = await signClient.createOrder({...});
  if (result.success) {
    console.log('Order created:', result.data);
  } else {
    console.error('Error:', result.error);
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

## TypeScript Support

Full TypeScript definitions are included. All types are exported:

```typescript
import {
  CreateOrderParams,
  Order,
  Position,
  Ticker,
  OrderBook,
  ApiResponse,
  // ... and more
} from 'pacifica-ts-sdk';
```

## Examples

The SDK includes comprehensive examples in the `examples/` directory. Run them with npm scripts:

```bash
# Basic usage
npm run example:basic

# Account information
npm run example:account

# Order management
npm run example:orders

# Position management
npm run example:positions

# Position SL/TP and leverage
npm run example:position-sl-tp

# Close position
npm run example:close-position

# TWAP orders
npm run example:twap

# Builder program
npm run example:builder

# Batch orders
npm run example:batch

# Agent wallet
npm run example:agent

# WebSocket market data
npm run example:ws-market

# WebSocket trading
npm run example:ws-trading
```

Or run directly with ts-node:

```bash
npx ts-node examples/basic-usage.ts
```

See [examples/README.md](examples/README.md) for detailed documentation.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Test
npm test

# Test with real API (requires .env with PRIVATE_KEY)
npm run test:all
```

## Contributing

This is a community-built SDK. Contributions are welcome! 🎉

1. Fork the [repository](https://github.com/bvvvp009/pacifica-ts-sdk)
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Roadmap

- [ ] Additional WebSocket channels
- [ ] Rate limiting
- [ ] Request retry logic
- [ ] More comprehensive tests
- [ ] Browser support (with fetch polyfill)
- [ ] Documentation site

## About

This SDK is built by the community, for the community. It's an open-source project created to make Pacifica API integration easier for developers.

**Repository:** [bvvvp009/pacifica-ts-sdk](https://github.com/bvvvp009/pacifica-ts-sdk)

**Contributions welcome!** This is a community project, and we'd love your help making it better.

## Resources

- [Pacifica API Documentation](https://docs.pacifica.fi/api-documentation/api)
- [Signing Implementation Guide](https://docs.pacifica.fi/api-documentation/api/signing/implementation)
- [Operation Types](https://docs.pacifica.fi/api-documentation/api/signing/operation-types)

## License

MIT

## Disclaimer

This SDK is community-built and not officially supported by Pacifica. Built for the community by [@bvvvp009](https://github.com/bvvvp009). Use at your own risk. Always test thoroughly before using in production.











