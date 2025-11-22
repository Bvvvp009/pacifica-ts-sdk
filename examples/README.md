# Examples

This directory contains comprehensive examples demonstrating how to use the Pacifica TypeScript SDK.

## Available Examples

### Basic Examples

- **`basic-usage.ts`** - Basic SDK usage, initialization, and error handling

### Order Management

- **`orders.ts`** - Create limit/market orders, query open orders, order history, and cancel orders

### Account Information

- **`account-info.ts`** - Query account information, balance, and account balance history

### Position Management

- **`positions.ts`** - Query positions and set take-profit/stop-loss

### TWAP Orders

- **`twap-orders.ts`** - Create, query, and cancel TWAP (Time-Weighted Average Price) orders

### WebSocket Examples

- **`websocket-market-data.ts`** - Subscribe to real-time market data (ticker, orderbook, trades)
- **`websocket-trading.ts`** - Place orders and manage positions via WebSocket

### Advanced Examples

- **`batch-orders.ts`** - Execute multiple order operations in a single request
- **`agent-wallet.ts`** - Use API Agent Keys (agent wallet) for trading

## Running Examples

All examples use environment variables for configuration. Create a `.env` file:

```env
PRIVATE_KEY=your-private-key-base58
API_PRIVATE_KEY=your-agent-wallet-private-key
PACIFICA_REST_URL=https://api.pacifica.fi
PACIFICA_WS_URL=wss://ws.pacifica.fi/ws
```

Run any example:

```bash
# Basic usage
npx ts-node examples/basic-usage.ts

# Order management
npx ts-node examples/orders.ts

# Account information
npx ts-node examples/account-info.ts

# Positions
npx ts-node examples/positions.ts

# TWAP orders
npx ts-node examples/twap-orders.ts

# WebSocket market data
npx ts-node examples/websocket-market-data.ts

# WebSocket trading
npx ts-node examples/websocket-trading.ts

# Batch orders
npx ts-node examples/batch-orders.ts

# Agent wallet
npx ts-node examples/agent-wallet.ts
```

## Note

Examples are configured to prevent accidental execution. Uncomment the function calls at the bottom of each file to run them.
