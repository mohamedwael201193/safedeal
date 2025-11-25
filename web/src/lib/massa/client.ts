import { JsonRpcPublicProvider, Mas } from "@massalabs/massa-web3";
import { Wallet } from "@massalabs/wallet-provider";

/**
 * Massa Web3 client configuration and helpers for SafeDeal
 */

// Get network configuration from environment
export const MASSA_NETWORK = import.meta.env.VITE_MASSA_NETWORK || "MainNet";
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_SAFEDEAL_CONTRACT_ADDRESS || "";
export const USDCE_TOKEN_ADDRESS =
  import.meta.env.VITE_USDCE_TOKEN_ADDRESS ||
  "AS1hCJXjndR4c9vekLWsXGnrdigp4AaZ7uYG3UKFzzKnWVsrNLPJ";

/**
 * Create a public provider for read-only operations
 */
export function createPublicProvider(): JsonRpcPublicProvider {
  // Use mainnet public RPC by default
  return JsonRpcPublicProvider.mainnet();
}

/**
 * Create a provider from wallet for transactions
 * Note: For wallet integration, we'll use the wallet provider directly
 * and wrap it in our contract calls
 */
export async function getWalletAddress(provider: Wallet): Promise<string> {
  const accounts = await provider.accounts();
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found in wallet");
  }
  // address is a property, not a function
  return accounts[0].address;
}

/**
 * Validate Massa address format
 */
export function isValidMassaAddress(address: string): boolean {
  // Massa addresses start with "AU" (user) or "AS" (smart contract)
  // Followed by 48-50 base58 characters (variable length due to checksum)
  return /^(AU|AS)[1-9A-HJ-NP-Za-km-z]{48,51}$/.test(address);
}

/**
 * Convert MAS to smallest unit (nanoMAS)
 */
export function masToNano(mas: string | number): bigint {
  return Mas.fromString(mas.toString());
}

/**
 * Convert nanoMAS to MAS string
 */
export function nanoToMas(nanoMas: bigint | string): string {
  const value = typeof nanoMas === "string" ? BigInt(nanoMas) : nanoMas;
  return Mas.toString(value);
}

/**
 * Format MAS amount for display
 */
export function formatMasAmount(nanoMas: bigint | string): string {
  const mas = nanoToMas(nanoMas);
  const num = parseFloat(mas);

  if (num === 0) return "0 MAS";
  if (num < 0.001) return `${num.toFixed(9)} MAS`;
  if (num < 1) return `${num.toFixed(6)} MAS`;
  return `${num.toFixed(3)} MAS`;
}

/**
 * Format token amount (6 decimals for USDC.e)
 */
export function formatTokenAmount(
  amount: bigint | string,
  decimals: number = 6
): string {
  const value = typeof amount === "string" ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  if (fractionalPart === 0n) {
    return integerPart.toString();
  }

  const fractionalStr = fractionalPart
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return `${integerPart}.${fractionalStr}`;
}

/**
 * Parse token amount with decimals
 */
export function parseTokenAmount(amount: string, decimals: number = 6): bigint {
  const parts = amount.split(".");
  const integerPart = parts[0] || "0";
  const fractionalPart = (parts[1] || "")
    .padEnd(decimals, "0")
    .slice(0, decimals);
  return BigInt(integerPart + fractionalPart);
}

/**
 * Get network info display
 */
export function getNetworkDisplay(): string {
  return MASSA_NETWORK === "MainNet" ? "Massa Mainnet" : "Massa Buildnet";
}

/**
 * Check if contract is configured
 */
export function isContractConfigured(): boolean {
  return CONTRACT_ADDRESS.length > 0 && isValidMassaAddress(CONTRACT_ADDRESS);
}
