/**
 * Pacifica TypeScript SDK
 * Community-built TypeScript SDK for Pacifica API
 * 
 * @packageDocumentation
 */

// Export clients
export { SignClient } from './clients/SignClient';
export { ApiClient } from './clients/ApiClient';
export { WebSocketClient } from './clients/WebSocketClient';
export { BaseClient } from './clients/BaseClient';
export { SolanaClient } from './clients/SolanaClient';

// Export types
export * from './types';

// Export errors
export {
  PacificaError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  AuthenticationError,
  APIError,
  ValidationError,
} from './errors';

// Export utilities
export {
  sortJsonKeys,
  createCompactJson,
  generateKeypair,
  publicKeyToHex,
  publicKeyToBase58,
  signMessage,
  createSignatureHeader,
  buildSignedRequest,
  verifySignature,
  signWithHardwareWallet,
  buildSignedRequestWithHardwareWallet,
} from './utils/signer';

// Export logger
export { logger } from './utils/logger';

// Export deposit utilities
export {
  createDepositTransaction,
  sendDepositTransaction,
  createKeypairFromPrivateKey,
  PACIFICA_PROGRAM_ID,
  CENTRAL_STATE,
  PACIFICA_VAULT,
  USDC_MINT,
} from './utils/deposit';

// Main SDK class for convenience
import { SignClient } from './clients/SignClient';
import { ApiClient } from './clients/ApiClient';
import { WebSocketClient } from './clients/WebSocketClient';
import { SolanaClient } from './clients/SolanaClient';
import { PacificaConfig } from './types';

export class PacificaSDK {
  public signClient: SignClient;
  public apiClient: ApiClient;
  public wsClient: WebSocketClient;
  public solanaClient: SolanaClient;

  constructor(
    privateKey: string | Uint8Array,
    config?: PacificaConfig & {
      accountPublicKey?: string;
      agentWalletPublicKey?: string;
      builderCode?: string; // Optional builder code
      expiryWindow?: number;
      wsUrl?: string;
      wsReconnect?: boolean;
      solanaRpcUrl?: string;
    }
  ) {
    // Initialize SignClient
    this.signClient = new SignClient(privateKey, {
      baseUrl: config?.baseUrl,
      accountPublicKey: config?.accountPublicKey,
      agentWalletPublicKey: config?.agentWalletPublicKey,
      builderCode: config?.builderCode,
      expiryWindow: config?.expiryWindow,
      timeout: config?.timeout,
      retryAttempts: config?.retryAttempts,
      retryDelay: config?.retryDelay,
      logLevel: config?.logLevel,
    });

    // Initialize ApiClient
    this.apiClient = new ApiClient({
      baseUrl: config?.baseUrl,
      timeout: config?.timeout,
      retryAttempts: config?.retryAttempts,
      retryDelay: config?.retryDelay,
      logLevel: config?.logLevel,
    });

    // Initialize WebSocketClient
    this.wsClient = new WebSocketClient({
      url: config?.wsUrl,
      reconnect: config?.wsReconnect,
      privateKey,
      accountPublicKey: config?.accountPublicKey,
      agentWalletPublicKey: config?.agentWalletPublicKey,
      builderCode: config?.builderCode,
    });

    // Initialize SolanaClient
    this.solanaClient = new SolanaClient(privateKey, {
      rpcUrl: config?.solanaRpcUrl,
    });
  }
}

// Default export
export default PacificaSDK;

