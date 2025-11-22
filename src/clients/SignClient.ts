/**
 * Pacifica SignClient
 * Handles all authenticated POST requests that require signing
 */

import {
  OperationType,
  SignedRequest,
  RequestOptions,
  CreateOrderParams,
  CreateStopOrderParams,
  CancelOrderParams,
  CreateTWAPOrderParams,
  CancelTWAPOrderParams,
  BatchOrderAction,
  UpdateLeverageParams,
  UpdateMarginModeParams,
  WithdrawParams,
  SetPositionTPSLParams,
  ClosePositionParams,
  ModifyPositionParams,
  SubaccountParams,
  SubaccountTransferParams,
  BindAgentWalletParams,
  RevokeAgentWalletParams,
  ListAgentIPWhitelistParams,
  AddAgentIPWhitelistParams,
  RemoveAgentIPWhitelistParams,
  ToggleAgentIPWhitelistParams,
  ApproveBuilderCodeParams,
  RevokeBuilderCodeParams,
  ApiResponse,
} from '../types';
import { buildSignedRequest, buildSignedRequestWithHardwareWallet } from '../utils/signer';
import { BaseClient } from './BaseClient';

export class SignClient extends BaseClient {
  private privateKey: string | Uint8Array;
  private accountPublicKey?: string;
  private agentWalletPublicKey?: string;
  private defaultExpiryWindow: number = 5000; // 5 seconds in milliseconds
  private builderCode?: string; // Optional builder code from env or config

  constructor(
    privateKey: string | Uint8Array,
    config?: {
      baseUrl?: string;
      accountPublicKey?: string;
      agentWalletPublicKey?: string;
      builderCode?: string; // Optional builder code
      expiryWindow?: number;
      timeout?: number;
      retryAttempts?: number;
      retryDelay?: number;
      logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
    }
  ) {
    super(config?.baseUrl, config?.timeout, config);
    this.privateKey = privateKey;
    this.accountPublicKey = config?.accountPublicKey;
    this.agentWalletPublicKey = config?.agentWalletPublicKey;
    // Set builder code from config or env (env takes precedence)
    this.builderCode = process.env.BUILDER_CODE || config?.builderCode;
    if (config?.expiryWindow !== undefined) {
      this.defaultExpiryWindow = config.expiryWindow;
    }
  }

  /**
   * Set agent wallet for API Agent Key usage
   */
  setAgentWallet(agentWalletPublicKey: string): void {
    this.agentWalletPublicKey = agentWalletPublicKey;
  }

  /**
   * Make a signed POST request
   */
  private async makeSignedRequest<T>(
    endpoint: string,
    operation: OperationType,
    data: Record<string, any>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    // Determine if using agent wallet
    const agentWalletPublicKey = options?.agent_wallet || this.agentWalletPublicKey;
    const isUsingAgentWallet = !!agentWalletPublicKey;

    // For agent wallet: use original account public key for 'account' field
    // For regular: use account public key (derived from private key if not provided)
    let accountPublicKey = this.accountPublicKey;
    
    if (!accountPublicKey) {
      const { generateKeypair, publicKeyToHex } = await import('../utils/signer');
      const keypair = await generateKeypair(this.privateKey);
      accountPublicKey = publicKeyToHex(keypair.publicKey);
    }

    // Check if using hardware wallet
    if (options?.hardware_wallet_path && accountPublicKey) {
      const signedRequest = await buildSignedRequestWithHardwareWallet(
        operation,
        data,
        accountPublicKey,
        options.hardware_wallet_path,
        this.defaultExpiryWindow
      );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add agent_wallet header if using agent wallet
      if (isUsingAgentWallet) {
        headers['agent_wallet'] = agentWalletPublicKey!;
      }

      return this.post<T>(endpoint, signedRequest, headers);
    }

    // Always sign with the provided private key (which should be agent wallet key if using agent)
    const signedRequest = await buildSignedRequest(
      operation,
      data,
      this.privateKey,
      accountPublicKey, // Use original account public key for 'account' field
      this.defaultExpiryWindow
    );

    // Flatten the request: { account, signature, timestamp, expiry_window, ...data }
    // Remove 'operation' and 'data' fields, flatten everything
    const requestBody = {
      account: signedRequest.account,
      signature: signedRequest.signature,
      timestamp: signedRequest.timestamp,
      ...(signedRequest.expiry_window !== undefined && { expiry_window: signedRequest.expiry_window }),
      ...data, // Flatten data fields to top level
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add agent_wallet header if using agent wallet
    if (isUsingAgentWallet) {
      headers['agent_wallet'] = agentWalletPublicKey!;
    }

    return await this.post<T>(endpoint, requestBody, headers);
  }

  /**
   * Helper method to merge builder_code into params if available
   */
  private mergeBuilderCode<T extends Record<string, any>>(params: T): T {
    if (this.builderCode && !params.builder_code) {
      return { ...params, builder_code: this.builderCode };
    }
    return params;
  }

  // Order Management Methods

  /**
   * Unified order creation method - routes to appropriate endpoint based on order_type
   * Supports limit, market, and TWAP orders with SL/TP
   */
  async createOrder(params: CreateOrderParams, options?: RequestOptions): Promise<ApiResponse> {
    const orderType = params.order_type || 'limit';

    switch (orderType) {
      case 'limit':
        return this.createLimitOrder(params, options);
      case 'market':
        return this.createMarketOrder(params, options);
      case 'twap':
        return this.createTWAPOrder(params as any, options);
      default:
        throw new Error(`Unsupported order type: ${orderType}. Use 'limit', 'market', or 'twap'`);
    }
  }

  /**
   * Create a limit order
   */
  async createLimitOrder(params: CreateOrderParams, options?: RequestOptions): Promise<ApiResponse> {
    if (!params.side) {
      throw new Error('Order side is required');
    }
    if (!params.amount && !params.size) {
      throw new Error('Order amount or size is required');
    }
    if (!params.price) {
      throw new Error('Price is required for limit orders');
    }
    if (parseFloat(params.price) <= 0) {
      throw new Error('Order price must be greater than 0');
    }

    const { order_type, ...limitParams } = params;
    const paramsWithBuilder = this.mergeBuilderCode(limitParams);
    return this.makeSignedRequest(
      '/orders/create',
      'create_order',
      paramsWithBuilder,
      options
    );
  }

  /**
   * Create a market order
   */
  async createMarketOrder(params: CreateOrderParams, options?: RequestOptions): Promise<ApiResponse> {
    if (!params.side) {
      throw new Error('Order side is required');
    }
    if (!params.amount && !params.size) {
      throw new Error('Order amount or size is required');
    }
    if (!params.slippage_percent) {
      throw new Error('slippage_percent is required for market orders');
    }

    const { order_type, ...marketParams } = params;
    const paramsWithBuilder = this.mergeBuilderCode(marketParams);
    return this.makeSignedRequest(
      '/orders/create_market',
      'create_market_order',
      paramsWithBuilder,
      options
    );
  }

  /**
   * Create a stop order
   */
  async createStopOrder(params: CreateStopOrderParams, options?: RequestOptions): Promise<ApiResponse> {
    const paramsWithBuilder = this.mergeBuilderCode(params);
    return this.makeSignedRequest(
      '/api/v1/orders/stop/create',
      'create_stop_order',
      paramsWithBuilder,
      options
    );
  }

  /**
   * Cancel an order
   */
  async cancelOrder(params: CancelOrderParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/orders/cancel',
      'cancel_order',
      params,
      options
    );
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(market?: string, options?: RequestOptions): Promise<ApiResponse> {
    const data = market ? { market } : {};
    return this.makeSignedRequest(
      '/orders/cancel_all',
      'cancel_all_orders',
      data,
      options
    );
  }

  /**
   * Cancel a stop order
   */
  async cancelStopOrder(params: CancelOrderParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/orders/stop/cancel',
      'cancel_stop_order',
      params,
      options
    );
  }

  /**
   * Create a TWAP (Time-Weighted Average Price) order
   */
  async createTWAPOrder(params: CreateTWAPOrderParams, options?: RequestOptions): Promise<ApiResponse> {
    if (!params.side) {
      throw new Error('Order side is required');
    }
    if (!params.amount) {
      throw new Error('Order amount is required');
    }
    if (!params.slippage_percent) {
      throw new Error('slippage_percent is required for TWAP orders');
    }
    if (!params.duration_in_seconds) {
      throw new Error('duration_in_seconds is required for TWAP orders');
    }

    const paramsWithBuilder = this.mergeBuilderCode(params);
    return this.makeSignedRequest(
      '/orders/twap/create',
      'create_twap_order',
      paramsWithBuilder,
      options
    );
  }

  /**
   * Cancel a TWAP order
   */
  async cancelTWAPOrder(params: CancelTWAPOrderParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/orders/twap/cancel',
      'cancel_twap_order',
      params,
      options
    );
  }

  /**
   * Batch orders - execute multiple order operations in a single request
   */
  async batchOrders(actions: BatchOrderAction[], options?: RequestOptions): Promise<ApiResponse> {
    // Batch endpoint doesn't use the standard signed request format
    // Each action needs to be individually signed with the same timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    const expiryWindow = this.defaultExpiryWindow;

    let accountPublicKey = this.accountPublicKey;
    if (!accountPublicKey) {
      const { generateKeypair, publicKeyToHex } = await import('../utils/signer');
      const keypair = await generateKeypair(this.privateKey);
      accountPublicKey = publicKeyToHex(keypair.publicKey);
    }

    const signedActions = await Promise.all(
      actions.map(async (action) => {
        const operation: OperationType = action.type === 'Create' 
          ? 'create_order' 
          : 'cancel_order';
        
        const signedRequest = await buildSignedRequest(
          operation,
          action.data,
          this.privateKey,
          accountPublicKey,
          expiryWindow
        );

        // Build the final request with proper structure (includes all fields from data)
        const request = {
          account: signedRequest.account,
          signature: signedRequest.signature,
          timestamp: signedRequest.timestamp,
          expiry_window: signedRequest.expiry_window,
          ...action.data,
        };

        return {
          type: action.type,
          data: request,
        };
      })
    );

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const agentWalletPublicKey = options?.agent_wallet || this.agentWalletPublicKey;
    if (agentWalletPublicKey) {
      headers['agent_wallet'] = agentWalletPublicKey;
    }

    return this.post('/orders/batch', { actions: signedActions }, headers);
  }

  // Account Management Methods

  /**
   * Update account leverage
   */
  async updateLeverage(params: UpdateLeverageParams, options?: RequestOptions): Promise<ApiResponse> {
    // API expects 'symbol' not 'market'
    const payload: any = {
      symbol: params.market,
      leverage: params.leverage,
    };
    return this.makeSignedRequest(
      '/account/leverage',
      'update_leverage',
      payload,
      options
    );
  }

  /**
   * Update margin mode
   */
  async updateMarginMode(params: UpdateMarginModeParams, options?: RequestOptions): Promise<ApiResponse> {
    // API expects 'symbol' not 'market'
    const payload: any = {
      symbol: params.market,
      margin_mode: params.margin_mode,
    };
    return this.makeSignedRequest(
      '/account/margin',
      'update_margin_mode',
      payload,
      options
    );
  }

  /**
   * Withdraw funds
   */
  async withdraw(params: WithdrawParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/account/withdraw',
      'withdraw',
      params,
      options
    );
  }

  /**
   * Create API key
   */
  async createApiKey(permissions?: string[], options?: RequestOptions): Promise<ApiResponse> {
    const data = permissions ? { permissions } : {};
    return this.makeSignedRequest(
      '/api/v1/account/api_keys/create',
      'create_api_key',
      data,
      options
    );
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(apiKeyId: string, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/account/api_keys/revoke',
      'revoke_api_key',
      { api_key_id: apiKeyId },
      options
    );
  }

  /**
   * List API keys
   */
  async listApiKeys(options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/account/api_keys',
      'list_api_keys',
      {},
      options
    );
  }

  // Position Management Methods

  /**
   * Set position take-profit/stop-loss
   */
  async setPositionTPSL(params: SetPositionTPSLParams, options?: RequestOptions): Promise<ApiResponse> {
    const payload: any = {};
    
    if (params.market || params.symbol) {
      payload.symbol = params.symbol || params.market;
    }
    
    if (params.side) {
      payload.side = params.side;
    }
    
    if (params.take_profit) {
      payload.take_profit = params.take_profit;
    } else if (params.take_profit_simple) {
      payload.take_profit = {
        stop_price: params.take_profit_simple,
      };
    }
    
    if (params.stop_loss) {
      payload.stop_loss = params.stop_loss;
    } else if (params.stop_loss_simple) {
      payload.stop_loss = {
        stop_price: params.stop_loss_simple,
      };
    }
    
    const payloadWithBuilder = this.mergeBuilderCode(payload);
    
    return this.makeSignedRequest(
      '/positions/tpsl',
      'set_position_tpsl',
      payloadWithBuilder,
      options
    );
  }

  /**
   * Close a position
   */
  async closePosition(params: ClosePositionParams, options?: RequestOptions): Promise<ApiResponse> {
    const closeOrderParams: CreateOrderParams = {
      symbol: params.market,
      side: 'ask',
      reduce_only: true,
      slippage_percent: '0.5',
    };

    if (params.size) {
      closeOrderParams.amount = params.size;
    }

    return this.createMarketOrder(closeOrderParams, options);
  }

  /**
   * Modify position (update leverage, margin mode, etc.)
   */
  async modifyPosition(params: ModifyPositionParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/positions/modify',
      'modify_position',
      params,
      options
    );
  }

  // Subaccount Management Methods

  /**
   * Initiate subaccount creation
   */
  async initiateSubaccount(options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/account/subaccount/create',
      'initiate_subaccount',
      {},
      options
    );
  }

  /**
   * Confirm subaccount creation
   */
  async confirmSubaccount(params: SubaccountParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/account/subaccount/create',
      'confirm_subaccount',
      params,
      options
    );
  }

  /**
   * Transfer funds between subaccounts
   */
  async subaccountTransfer(params: SubaccountTransferParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/account/subaccount/transfer',
      'subaccount_transfer',
      params,
      options
    );
  }

  // Agent Wallet Methods

  /**
   * Bind agent wallet to account
   */
  async bindAgentWallet(params: BindAgentWalletParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/agent/bind',
      'bind_agent_wallet',
      { agent_wallet: params.agent_wallet_public_key },
      options
    );
  }

  /**
   * List all bound agent wallets
   */
  async listAgentWallets(options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/agent/list',
      'list_agent_wallets',
      {},
      options
    );
  }

  /**
   * Revoke a specific agent wallet
   */
  async revokeAgentWallet(params: RevokeAgentWalletParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/agent/revoke',
      'revoke_agent_wallet',
      params,
      options
    );
  }

  /**
   * Revoke all agent wallets
   */
  async revokeAllAgentWallets(options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/agent/revoke_all',
      'revoke_all_agent_wallets',
      {},
      options
    );
  }

  /**
   * List IP addresses in whitelist for an agent wallet
   */
  async listAgentIPWhitelist(params: ListAgentIPWhitelistParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/agent/ip_whitelist/list',
      'list_agent_ip_whitelist',
      params,
      options
    );
  }

  /**
   * Add an IP address to the whitelist for an agent wallet
   */
  async addAgentIPWhitelist(params: AddAgentIPWhitelistParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/agent/ip_whitelist/add',
      'add_agent_whitelisted_ip',
      params,
      options
    );
  }

  /**
   * Remove an IP address from the whitelist for an agent wallet
   */
  async removeAgentIPWhitelist(params: RemoveAgentIPWhitelistParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/agent/ip_whitelist/remove',
      'remove_agent_whitelisted_ip',
      params,
      options
    );
  }

  /**
   * Enable or disable IP whitelist enforcement for an agent wallet
   */
  async toggleAgentIPWhitelist(params: ToggleAgentIPWhitelistParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/api/v1/agent/ip_whitelist/toggle',
      'set_agent_ip_whitelist_enabled',
      params,
      options
    );
  }

  // Builder Program Methods

  /**
   * Approve a builder code for use in orders
   * User signs approval with builder_code and max_fee_rate
   */
  async approveBuilderCode(params: ApproveBuilderCodeParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/account/builder_codes/approve',
      'approve_builder_code',
      params,
      options
    );
  }

  /**
   * Revoke a builder code authorization
   */
  async revokeBuilderCode(params: RevokeBuilderCodeParams, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/account/builder_codes/revoke',
      'revoke_builder_code',
      params,
      options
    );
  }

  /**
   * Get list of approved builder codes for the account
   * This is a GET request, not signed
   */
  async getBuilderCodeApprovals(account: string): Promise<ApiResponse> {
    // baseUrl already includes /api/v1, so just use /account/...
    return this.get(`/account/builder_codes/approvals?account=${account}`);
  }

  // Order Query Methods (using signed POST requests)

  /**
   * Get open orders (signed request)
   */
  async getOpenOrders(market?: string, options?: RequestOptions): Promise<ApiResponse> {
    const data = market ? { market } : {};
    return this.makeSignedRequest(
      '/orders/open',
      'get_open_orders',
      data,
      options
    );
  }

  /**
   * Get order history (signed request)
   */
  async getOrderHistory(market?: string, limit?: number, options?: RequestOptions): Promise<ApiResponse> {
    const data: Record<string, any> = {};
    if (market) data.market = market;
    if (limit) data.limit = limit.toString();
    return this.makeSignedRequest(
      '/orders/history',
      'get_order_history',
      data,
      options
    );
  }

  /**
   * Get order by ID (signed request)
   */
  async getOrder(orderId: string, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      `/orders/${orderId}`,
      'get_order',
      {},
      options
    );
  }

  // Position Query Methods (using signed POST requests)

  /**
   * Get positions (signed request)
   */
  async getPositions(market?: string, options?: RequestOptions): Promise<ApiResponse> {
    const data = market ? { market } : {};
    return this.makeSignedRequest(
      '/positions',
      'get_positions',
      data,
      options
    );
  }

  /**
   * Get position for a specific market (signed request)
   */
  async getPosition(market: string, options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      `/positions/${market}`,
      'get_position',
      {},
      options
    );
  }

  /**
   * Get account balance (signed request)
   */
  async getBalance(currency?: string, options?: RequestOptions): Promise<ApiResponse> {
    const data = currency ? { currency } : {};
    return this.makeSignedRequest(
      currency ? `/account/balance/${currency}` : '/account/balance',
      'get_balance',
      data,
      options
    );
  }

  /**
   * Get account info (signed request)
   * For GET requests, use ApiClient.getAccountInfo(account) instead
   */
  async getAccountInfo(options?: RequestOptions): Promise<ApiResponse> {
    return this.makeSignedRequest(
      '/account',
      'get_account_info',
      {},
      options
    );
  }
}

