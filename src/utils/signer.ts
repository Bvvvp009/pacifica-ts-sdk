/**
 * Pacifica Signing Utilities
 * Implements Ed25519 signing for Pacifica API requests
 */

import * as ed25519 from '@noble/ed25519';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { OperationType, SignatureHeader, SignedRequest } from '../types';

const execAsync = promisify(exec);

// Configure @noble/ed25519 to use Node.js crypto for SHA-512
// This is required for Node.js environments
try {
  const crypto = require('crypto');
  // @noble/ed25519 requires etc.sha512Sync to be set for Node.js
  const ed25519Any = ed25519 as any;
  if (crypto && ed25519Any.etc) {
    // Check if sha512Sync is not set or not a function
    if (!ed25519Any.etc.sha512Sync || typeof ed25519Any.etc.sha512Sync !== 'function') {
      ed25519Any.etc.sha512Sync = (...m: any[]) => {
        const h = crypto.createHash('sha512');
        m.forEach((x) => {
          if (typeof x === 'string') {
            h.update(Buffer.from(x, 'utf8'));
          } else {
            h.update(Buffer.from(x));
          }
        });
        return new Uint8Array(h.digest());
      };
    }
  }
} catch {
  // Browser environment or crypto not available
}

try {
  const crypto = require('crypto');
  if (crypto && typeof (bs58 as any).__crypto === 'undefined') {
    (bs58 as any).__crypto = crypto;
  }
} catch {
  // Browser environment or crypto not available
}

/**
 * Recursively sort JSON keys alphabetically
 */
export function sortJsonKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortJsonKeys);
  }

  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = sortJsonKeys(obj[key]);
  }

  return sorted;
}

/**
 * Create compact JSON string without whitespace
 */
export function createCompactJson(obj: any): string {
  return JSON.stringify(sortJsonKeys(obj));
}

/**
 * Generate Ed25519 keypair from private key
 * Supports: hex string (128 chars), base58 string (Solana format), or Uint8Array
 */
export async function generateKeypair(privateKey: string | Uint8Array): Promise<{
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}> {
  let privateKeyBytes: Uint8Array;

  if (typeof privateKey === 'string') {
    const cleanKey = privateKey.trim();
    
    // Try hex format first (128 chars, or 130 with 0x prefix)
    if (cleanKey.length === 128 || (cleanKey.startsWith('0x') && cleanKey.length === 130)) {
      try {
        const cleanHex = cleanKey.startsWith('0x') ? cleanKey.slice(2) : cleanKey;
        privateKeyBytes = Uint8Array.from(Buffer.from(cleanHex, 'hex'));
        if (privateKeyBytes.length === 32) {
          const publicKey = await ed25519.getPublicKey(privateKeyBytes);
          return { publicKey, privateKey: privateKeyBytes };
        }
      } catch {
        // Not hex, try base58
      }
    }
    
    // Try base58 format (Solana format)
    // Check if it looks like base58 (contains only base58 characters)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (base58Regex.test(cleanKey)) {
      try {
        // Use bs58 to decode base58 string (Solana format)
        const decoded = bs58.decode(cleanKey);
        
        if (decoded.length === 64) {
          // Full Solana keypair (64 bytes) - extract first 32 bytes (private key)
          privateKeyBytes = Uint8Array.from(decoded.slice(0, 32));
        } else if (decoded.length === 32) {
          // Just the private key (32 bytes)
          privateKeyBytes = Uint8Array.from(decoded);
        } else if (decoded.length > 32) {
          // Unexpected length > 32, use first 32 bytes
          privateKeyBytes = Uint8Array.from(decoded.slice(0, 32));
        } else {
          // Length < 32, not valid - skip base58 and try base64
          throw new Error(`Decoded length ${decoded.length} too short for base58`);
        }
        
        // Verify we have 32 bytes and generate keypair
        if (privateKeyBytes.length === 32) {
          const publicKey = await ed25519.getPublicKey(privateKeyBytes);
          return { publicKey, privateKey: privateKeyBytes };
        }
      } catch (error: any) {
        // Base58 decode or key generation failed - only skip if it's a decode error
        // If it's a different error, we should try base64 anyway
        // Continue to try base64 format
      }
    }
    
    // Try base64 format
    try {
      privateKeyBytes = Uint8Array.from(Buffer.from(cleanKey, 'base64'));
      if (privateKeyBytes.length === 32) {
        const publicKey = await ed25519.getPublicKey(privateKeyBytes);
        return { publicKey, privateKey: privateKeyBytes };
      }
    } catch {
      // Not base64
    }
    
    throw new Error(
      'Invalid private key format. Expected:\n' +
      '- Hex string (128 chars) or 0x-prefixed\n' +
      '- Base58 string (Solana format)\n' +
      '- Base64 string\n' +
      '- Uint8Array (32 bytes)'
    );
  } else {
    privateKeyBytes = privateKey;
  }

  // Ed25519 private key should be 32 bytes
  if (privateKeyBytes.length !== 32) {
    throw new Error(`Invalid private key length. Expected 32 bytes, got ${privateKeyBytes.length}.`);
  }

  const publicKey = await ed25519.getPublicKey(privateKeyBytes);

  return {
    publicKey,
    privateKey: privateKeyBytes,
  };
}

/**
 * Convert public key to hex string
 */
export function publicKeyToHex(publicKey: Uint8Array): string {
  return Buffer.from(publicKey).toString('hex');
}

/**
 * Convert public key to base58 string (Solana format)
 */
export function publicKeyToBase58(publicKey: Uint8Array): string {
  return bs58.encode(publicKey);
}

/**
 * Sign a message using Ed25519
 */
export async function signMessage(
  message: string,
  privateKey: Uint8Array
): Promise<string> {
  const messageBytes = new TextEncoder().encode(message);
  const signature = await ed25519.sign(messageBytes, privateKey);
  // Use base58 encoding for signatures (Pacifica API standard)
  return bs58.encode(signature);
}

/**
 * Create signature header with timestamp
 */
export function createSignatureHeader(expiryWindow?: number): SignatureHeader {
  const header: SignatureHeader = {
    timestamp: Math.floor(Date.now()), // Use milliseconds timestamp
  };

  if (expiryWindow !== undefined) {
    header.expiry_window = expiryWindow;
  }

  return header;
}

/**
 * Build and sign a request for Pacifica API
 */
export async function buildSignedRequest(
  operation: OperationType,
  data: Record<string, any>,
  privateKey: string | Uint8Array,
  accountPublicKey?: string,
  expiryWindow?: number
): Promise<SignedRequest> {
  // Generate keypair if account public key not provided
  let publicKeyHex: string;
  let privateKeyBytes: Uint8Array;

  let accountAddress: string;
  if (accountPublicKey) {
    // Account public key can be in hex (64 chars) or base58 (44 chars) format
    if (accountPublicKey.startsWith('0x')) {
      // Remove 0x prefix and convert hex to base58
      const hexKey = accountPublicKey.slice(2);
      if (hexKey.length === 64) {
        const publicKeyBytes = Uint8Array.from(Buffer.from(hexKey, 'hex'));
        accountAddress = bs58.encode(publicKeyBytes);
      } else {
        accountAddress = accountPublicKey; // Use as-is
      }
    } else if (accountPublicKey.length === 64) {
      // Hex format (no 0x prefix) - convert to base58
      const publicKeyBytes = Uint8Array.from(Buffer.from(accountPublicKey, 'hex'));
      accountAddress = bs58.encode(publicKeyBytes);
    } else {
      // Assume base58 format (Solana public key)
      accountAddress = accountPublicKey;
    }
    const keypair = await generateKeypair(privateKey);
    privateKeyBytes = keypair.privateKey;
  } else {
    // Generate from private key and use base58 format
    const keypair = await generateKeypair(privateKey);
    accountAddress = bs58.encode(keypair.publicKey);
    privateKeyBytes = keypair.privateKey;
  }

  // Create signature header
  const header = createSignatureHeader(expiryWindow);

  // Sign message structure: { type, timestamp, expiry_window, data: { ...payload } }
  // The payload is nested under "data" for signing
  const messagePayload = {
    type: operation,
    timestamp: header.timestamp,
    ...(header.expiry_window !== undefined && { expiry_window: header.expiry_window }),
    data: data,
  };

  // Create compact JSON (no spaces, sorted keys)
  const compactJson = createCompactJson(messagePayload);

  // Sign the message
  const signature = await signMessage(compactJson, privateKeyBytes);

  // Build final request
  const request: SignedRequest = {
    account: accountAddress, // Use base58 encoded Solana address
    signature,
    operation,
    data,
    timestamp: header.timestamp,
  };

  if (expiryWindow !== undefined) {
    request.expiry_window = expiryWindow;
  }

  return request;
}

/**
 * Verify a signature (for testing purposes)
 */
export async function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Uint8Array.from(Buffer.from(signature, 'hex'));
    const publicKeyBytes = Uint8Array.from(
      Buffer.from(publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey, 'hex')
    );

    return await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
  } catch (error) {
    return false;
  }
}

/**
 * Sign a message using hardware wallet (Ledger) via Solana CLI
 * Requires Solana CLI to be installed and hardware wallet connected
 * 
 * @param message - The message to sign (compact JSON string)
 * @param hardwareWalletPath - Path to hardware wallet (e.g., "usb://ledger?key=1")
 * @returns Promise resolving to base58-encoded signature
 */
export async function signWithHardwareWallet(
  message: string,
  hardwareWalletPath: string
): Promise<string> {
  try {
    // Construct the solana CLI command
    const cmd = `solana sign-offchain-message -k "${hardwareWalletPath}" "${message}"`;
    
    // Execute the command
    const { stdout, stderr } = await execAsync(cmd);
    
    if (stderr && !stderr.includes('Please approve')) {
      throw new Error(`Hardware wallet signing failed: ${stderr}`);
    }

    // The output contains both the approval message and the signature
    // We need to extract just the signature (the last line)
    const outputLines = stdout.trim().split('\n');
    const signature = outputLines[outputLines.length - 1].trim();
    
    if (!signature) {
      throw new Error('No signature returned from hardware wallet');
    }

    return signature; // Already in base58 format from Solana CLI
  } catch (error: any) {
    throw new Error(`Error signing with hardware wallet: ${error.message}`);
  }
}

/**
 * Build a signed request using hardware wallet
 */
export async function buildSignedRequestWithHardwareWallet(
  operation: OperationType,
  data: Record<string, any>,
  accountPublicKey: string,
  hardwareWalletPath: string,
  expiryWindow?: number
): Promise<SignedRequest & { signature: { type: 'hardware'; value: string } }> {
  // Create signature header
  const header = createSignatureHeader(expiryWindow);

  // Sign message structure: { type, timestamp, expiry_window, data: { ...payload } }
  const messagePayload = {
    type: operation,
    timestamp: header.timestamp,
    ...(header.expiry_window !== undefined && { expiry_window: header.expiry_window }),
    data: data,
  };

  // Create compact JSON (sorted and no whitespace)
  const compactJson = createCompactJson(messagePayload);

  // Sign with hardware wallet
  const signature = await signWithHardwareWallet(compactJson, hardwareWalletPath);

  // Build final request - flatten: { account, signature, timestamp, expiry_window, ...data }
  const request = {
    account: accountPublicKey.startsWith('0x') ? accountPublicKey.slice(2) : accountPublicKey,
    signature: signature, // Hardware wallet signature is already base58
    timestamp: header.timestamp,
    ...(header.expiry_window !== undefined && { expiry_window: header.expiry_window }),
    ...data, // Flatten data fields
  };

  return request as any;
}

