# Examples

This directory contains comprehensive examples demonstrating how to use the Pacifica TypeScript SDK.

## Available Examples

### Basic Examples

- **`basic-usage.ts`** - Basic SDK usage, initialization, and error handling
- **`validation-helpers.ts`** - Input validation helpers for orders and parameters

### Order Management

- **`orders.ts`** - Create limit/market orders, query open orders, order history, and cancel orders
- **`edit-order.ts`** - Edit existing limit orders (update price and/or amount)
- **`close-orders.ts`** - Close open orders for specific symbols or all positions
- **`batch-orders.ts`** - Execute multiple order operations in a single request

### Account Information

- **`account-info.ts`** - Query account information, balance, and account balance history
- **`account-history.ts`** - Fetch trade history, funding payments, and account equity
- **`create-subaccount.ts`** - Create subaccounts for separate trading strategies
- **`subaccount-transfer.ts`** - Transfer funds between main account and subaccounts
- **`withdraw.ts`** - Withdraw funds from account

### Market Data

- **`market-data.ts`** - Fetch prices, candle data, mark price candles, and historical funding rates

### Position Management

- **`positions.ts`** - Query positions and set take-profit/stop-loss
- **`position-sl-tp-leverage.ts`** - Manage position stop-loss, take-profit, and leverage
- **`close-position.ts`** - Close existing positions

### TWAP Orders

- **`twap-orders.ts`** - Create, query, and cancel TWAP (Time-Weighted Average Price) orders

### WebSocket Examples

- **`websocket-market-data.ts`** - Subscribe to real-time market data (ticker, orderbook, trades)
- **`websocket-trading.ts`** - Place orders and manage positions via WebSocket
- **`heartbeat.ts`** - Test WebSocket heartbeat and connection health

### Advanced Examples

- **`agent-wallet.ts`** - Use API Agent Keys (agent wallet) for trading
- **`builder-code.ts`** - Use builder program codes for fee rebates

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

# Market data
npx ts-node examples/market-data.ts

# Account history
npx ts-node examples/account-history.ts

# Edit order
npx ts-node examples/edit-order.ts

# Close orders
npx ts-node examples/close-orders.ts

# Close position
npx ts-node examples/close-position.ts

# Position SL/TP/Leverage
npx ts-node examples/position-sl-tp-leverage.ts

# Validation helpers
npx ts-node examples/validation-helpers.ts

# Builder code
npx ts-node examples/builder-code.ts

# Create subaccount
npx ts-node examples/create-subaccount.ts

# Subaccount transfer
npx ts-node examples/subaccount-transfer.ts

# Withdraw
npx ts-node examples/withdraw.ts

# Heartbeat
npx ts-node examples/heartbeat.ts
```

## Note

Examples are configured to prevent accidental execution. Uncomment the function calls at the bottom of each file to run them.
