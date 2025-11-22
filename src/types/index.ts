/**
 * Pacifica TypeScript SDK - Type Definitions
 */

// Base types
export type OperationType =
  | 'create_order'
  | 'create_market_order'
  | 'create_stop_order'
  | 'cancel_order'
  | 'cancel_all_orders'
  | 'cancel_stop_order'
  | 'create_twap_order'
  | 'cancel_twap_order'
  | 'update_leverage'
  | 'update_margin_mode'
  | 'withdraw'
  | 'create_api_key'
  | 'revoke_api_key'
  | 'list_api_keys'
  | 'set_position_tpsl'
  | 'close_position'
  | 'modify_position'
  | 'initiate_subaccount'
  | 'confirm_subaccount'
  | 'subaccount_transfer'
  | 'bind_agent_wallet'
  | 'list_agent_wallets'
  | 'revoke_agent_wallet'
  | 'revoke_all_agent_wallets'
  | 'list_agent_ip_whitelist'
  | 'add_agent_whitelisted_ip'
  | 'remove_agent_whitelisted_ip'
  | 'set_agent_ip_whitelist_enabled'
  | 'approve_builder_code'
  | 'revoke_builder_code'
  | 'get_open_orders'
  | 'get_order_history'
  | 'get_order'
  | 'get_positions'
  | 'get_position'
  | 'get_balance'
  | 'get_account_info';

export interface SignatureHeader {
  timestamp: number;
  expiry_window?: number;
}

export interface SignedRequest {
  account: string;
  signature: string;
  operation: OperationType;
  data: Record<string, any>;
  timestamp?: number;
  expiry_window?: number;
}

export interface RequestOptions {
  agent_wallet?: string;
  timeout?: number;
  hardware_wallet_path?: string;
}

// Order types
export interface CreateOrderParams {
  order_type?: 'limit' | 'market' | 'twap';  // Optional: routes to appropriate endpoint (defaults to 'limit')
  market?: string;  // Optional for compatibility
  symbol?: string;  // API uses "symbol"
  side: 'buy' | 'sell' | 'bid' | 'ask';
  size?: string;
  amount?: string;  // API uses "amount"
  price?: string;  // Required for limit orders
  time_in_force?: 'GTC' | 'IOC' | 'FOK';
  tif?: 'GTC' | 'IOC' | 'FOK';  // Time in force
  reduce_only?: boolean;
  post_only?: boolean;
  slippage_percent?: string;  // Required for market and TWAP orders
  duration_in_seconds?: number;  // Required for TWAP orders
  client_order_id?: string;  // Optional client order ID
  take_profit?: TPOrderParams;  // Optional take profit order (supported by all order types)
  stop_loss?: SLOrderParams;  // Optional stop loss order (supported by all order types)
  builder_code?: string;  // Optional builder code for builder program
}

export interface CreateStopOrderParams {
  market: string;
  side: 'buy' | 'sell';
  size: string;
  stop_price: string;
  price?: string;
  order_type?: 'limit' | 'market';
  builder_code?: string;  // Optional builder code for builder program
}

export interface CancelOrderParams {
  order_id: string | number;
  symbol?: string;
  client_order_id?: string;
}

export interface CreateTWAPOrderParams {
  symbol: string;
  side: 'bid' | 'ask' | 'buy' | 'sell';
  amount: string;
  slippage_percent: string;
  duration_in_seconds: number;
  reduce_only?: boolean;
  client_order_id?: string;
  take_profit?: TPOrderParams;  // Optional take profit order
  stop_loss?: SLOrderParams;  // Optional stop loss order
  builder_code?: string;  // Optional builder code for builder program
}

export interface CancelTWAPOrderParams {
  symbol: string;
  order_id: string | number;
  client_order_id?: string;
}

export interface TWAPOrder {
  id: string | number;
  symbol: string;
  side: string;
  amount: string;
  slippage_percent: string;
  duration_in_seconds: number;
  status: string;
  created_at: string;
  client_order_id?: string;
}

export interface BatchOrderAction {
  type: 'Create' | 'Cancel';
  data: Record<string, any>;
}

export interface Order {
  id: string;
  market: string;
  side: 'buy' | 'sell';
  size: string;
  price?: string;
  status: string;
  created_at: string;
  filled_size?: string;
  remaining_size?: string;
}

// Account types
export interface UpdateLeverageParams {
  market: string;
  leverage: number;
}

export interface UpdateMarginModeParams {
  market: string;
  margin_mode: 'isolated' | 'cross';
}

export interface WithdrawParams {
  amount: string;
  currency: string;
  address: string;
}

export interface ApiKey {
  id: string;
  public_key: string;
  created_at: string;
  permissions?: string[];
}

// Position types
export interface TPOrderParams {
  stop_price: string;
  limit_price?: string;
  amount?: string;
  client_order_id?: string;
}

export interface SLOrderParams {
  stop_price: string;
  limit_price?: string;
  amount?: string;
  client_order_id?: string;
}

export interface SetPositionTPSLParams {
  symbol: string;
  side: 'bid' | 'ask' | 'buy' | 'sell';
  take_profit?: TPOrderParams;
  stop_loss?: SLOrderParams;
  // Legacy support - simple string format
  market?: string;
  take_profit_simple?: string;
  stop_loss_simple?: string;
  builder_code?: string;  // Optional builder code for builder program
}

export interface ClosePositionParams {
  market: string;
  size?: string; // Optional: close specific size, otherwise closes entire position
}

export interface ModifyPositionParams {
  market: string;
  leverage?: number;
  margin_mode?: 'isolated' | 'cross';
}

export interface Position {
  market: string;
  side: 'long' | 'short';
  size: string;
  entry_price: string;
  mark_price: string;
  liquidation_price?: string;
  unrealized_pnl: string;
  leverage: number;
}

// Subaccount types
export interface SubaccountParams {
  subaccount_id: string;
}

export interface SubaccountTransferParams {
  subaccount_id: string;
  amount: string;
  currency: string;
}

// Agent wallet types
export interface BindAgentWalletParams {
  agent_wallet_public_key: string;
}

export interface RevokeAgentWalletParams {
  agent_wallet: string;
}

export interface ListAgentIPWhitelistParams {
  api_agent_key: string;
}

export interface AddAgentIPWhitelistParams {
  agent_wallet: string;
  ip_address: string;
}

export interface RemoveAgentIPWhitelistParams {
  agent_wallet: string;
  ip_address: string;
}

export interface ToggleAgentIPWhitelistParams {
  agent_wallet: string;
  enabled: boolean;
}

// Builder program types
export interface ApproveBuilderCodeParams {
  builder_code: string;
  max_fee_rate: string;  // User's maximum fee rate (must be >= builder's fee_rate)
}

export interface RevokeBuilderCodeParams {
  builder_code: string;
}

export interface BuilderCodeApproval {
  builder_code: string;
  description?: string;
  max_fee_rate: string;
  updated_at: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Market data types
export interface MarketInfo {
  id: string;
  base_currency: string;
  quote_currency: string;
  min_order_size: string;
  tick_size: string;
  status: string;
}

export interface Ticker {
  market: string;
  last_price: string;
  bid_price: string;
  ask_price: string;
  volume_24h: string;
  change_24h: string;
}

export interface OrderBook {
  market: string;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
}

export interface Trade {
  id: string;
  market: string;
  side: 'buy' | 'sell';
  size: string;
  price: string;
  timestamp: number;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: any;
  operation?: OperationType;
  account?: string;
  signature?: string;
}

export interface WebSocketConfig {
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// Client configuration
export interface PacificaConfig {
  baseUrl?: string;
  wsUrl?: string;
  timeout?: number;
  apiVersion?: string;
  retryAttempts?: number;
  retryDelay?: number;
  enableRateLimit?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
}

// Hardware wallet support
export interface HardwareWalletSigner {
  signMessage: (message: string, hardwareWalletPath: string) => Promise<string>;
}






