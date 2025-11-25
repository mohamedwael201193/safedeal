import type { PublicProvider } from "@massalabs/massa-web3";
import { Args, SmartContract } from "@massalabs/massa-web3";
import { Wallet } from "@massalabs/wallet-provider";
import { AssetType, Deal, DealMode, DealStatus } from "../../types/deal";
import {
  CONTRACT_ADDRESS,
  createPublicProvider,
  getWalletAddress,
  isContractConfigured,
} from "./client";

/**
 * SafeDeal Smart Contract Interactions
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fetch real chain time from the node (never estimate from genesis)
 * This ensures deadlines are always calculated correctly
 */
async function getNetworkTime(provider: PublicProvider): Promise<{
  currentPeriod: number;
  t0Ms: number;
}> {
  const nodeStatus = await provider.getNodeStatus();

  // Get current period from last executed slot
  const currentPeriod = nodeStatus.lastSlot?.period ?? 0;

  // Get t0 (milliseconds per period) from node config
  // Default is 16000ms (16 seconds) on mainnet
  const t0Ms = nodeStatus.config?.t0 ?? 16000;

  console.log("📡 Network time fetched:", {
    currentPeriod,
    t0Ms,
    timestamp: new Date().toISOString(),
  });

  return { currentPeriod, t0Ms };
}

/**
 * Convert human duration (milliseconds) to periods using chain's t0
 */
function millisecondsToPeriods(durationMs: number, t0Ms: number): number {
  return Math.ceil(durationMs / t0Ms);
}

// ============================================================================
// READ OPERATIONS (No wallet required)
// ============================================================================

/**
 * Fetch a deal by ID from the smart contract
 */
export async function getDeal(dealId: number): Promise<Deal | null> {
  if (!isContractConfigured()) {
    throw new Error(
      "Contract not configured. Please set VITE_SAFEDEAL_CONTRACT_ADDRESS"
    );
  }

  try {
    const provider = createPublicProvider();
    const contract = new SmartContract(provider, CONTRACT_ADDRESS);

    const args = new Args().addU64(BigInt(dealId));
    const result = await contract.read("getDeal", args, {
      maxGas: 10000000n, // 10M gas
    });

    const responseArgs = new Args(result.value);
    return await parseDeal(responseArgs, provider);
  } catch (error) {
    console.error("Error fetching deal:", error);
    return null;
  }
}

/**
 * Get all deal IDs for a client address
 */
export async function getDealsByClient(
  clientAddress: string
): Promise<number[]> {
  if (!isContractConfigured()) {
    throw new Error("Contract not configured");
  }

  try {
    const provider = createPublicProvider();
    const contract = new SmartContract(provider, CONTRACT_ADDRESS);

    const args = new Args().addString(clientAddress);
    const result = await contract.read("getDealsByClient", args, {
      maxGas: 20000000n, // 20M gas
    });

    return parseDealIds(result.value);
  } catch (error) {
    console.error("Error fetching client deals:", error);
    return [];
  }
}

/**
 * Get all deal IDs for a freelancer address
 */
export async function getDealsByFreelancer(
  freelancerAddress: string
): Promise<number[]> {
  if (!isContractConfigured()) {
    throw new Error("Contract not configured");
  }

  try {
    const provider = createPublicProvider();
    const contract = new SmartContract(provider, CONTRACT_ADDRESS);

    const args = new Args().addString(freelancerAddress);
    const result = await contract.read("getDealsByFreelancer", args, {
      maxGas: 20000000n, // 20M gas
    });

    return parseDealIds(result.value);
  } catch (error) {
    console.error("Error fetching freelancer deals:", error);
    return [];
  }
}

/**
 * Get all deals for a user (both as client and freelancer)
 */
export async function getUserDeals(userAddress: string): Promise<Deal[]> {
  const [clientDealIds, freelancerDealIds] = await Promise.all([
    getDealsByClient(userAddress),
    getDealsByFreelancer(userAddress),
  ]);

  // Combine and deduplicate deal IDs
  const allDealIds = [...new Set([...clientDealIds, ...freelancerDealIds])];

  // Fetch all deals
  const deals = await Promise.all(allDealIds.map((id) => getDeal(id)));

  return deals.filter((deal): deal is Deal => deal !== null);
}

// ============================================================================
// WRITE OPERATIONS (Require wallet)
// ============================================================================

/**
 * Create a new escrow deal with MAS
 */
export async function createDealForMAS(
  provider: Wallet,
  params: {
    freelancerAddress: string;
    amountMAS: bigint; // Amount in nanoMAS
    deadlineMs: number; // Unix timestamp in milliseconds (will be converted to slot)
    mode: DealMode;
    note?: string;
  }
): Promise<{
  success: boolean;
  dealId?: number;
  operationId?: string;
  error?: string;
}> {
  if (!isContractConfigured()) {
    return { success: false, error: "Contract not configured" };
  }

  try {
    const accounts = await provider.accounts();
    const walletAddress = await getWalletAddress(provider);

    // ✅ VERIFY RPC VERSION (must be MAIN.4.0+ for deferred calls)
    try {
      const nodeStatus = await accounts[0].getNodeStatus();
      console.log("🔍 RPC Info:", {
        version: nodeStatus.version,
        chainId: nodeStatus.chainId,
        nodeId: nodeStatus.nodeId,
      });

      // Warn if version is not MAIN.4.0+
      if (!nodeStatus.version?.includes("MAIN.4")) {
        console.warn(
          "⚠️ Warning: RPC version",
          nodeStatus.version,
          "may not support deferred calls. Recommended: MAIN.4.0+"
        );
      }
    } catch (versionError) {
      console.warn("Could not check RPC version:", versionError);
    }

    // ✅ FETCH REAL CHAIN TIME FROM NODE (never estimate from genesis)
    const publicProvider = createPublicProvider();
    const { currentPeriod, t0Ms } = await getNetworkTime(publicProvider);

    // Calculate user-requested duration in periods
    const deadlineDurationMs = params.deadlineMs - Date.now();
    const userDurationPeriods = millisecondsToPeriods(deadlineDurationMs, t0Ms);

    // Add safety buffer (minimum 8 periods ≈ 128 seconds)
    // This accounts for transaction propagation and inclusion time
    const safetyBuffer = 8;
    const deadlineSlot = currentPeriod + userDurationPeriods + safetyBuffer;

    console.log("✅ Deal creation params:", {
      networkPeriod: currentPeriod,
      t0Ms,
      userDurationPeriods,
      safetyBuffer,
      deadlineSlot,
      freelancer: params.freelancerAddress,
      amountNanoMAS: params.amountMAS.toString(),
      mode: params.mode,
      caller: walletAddress,
    });

    // Build arguments for smart contract
    const args = new Args()
      .addString(params.freelancerAddress)
      .addU64(BigInt(deadlineSlot))
      .addU8(BigInt(params.mode))
      .addString(params.note || "");

    // Note: Simulation skipped because deferredCallRegister cannot run in read-only mode.
    // The contract will validate all parameters during execution.
    console.log(
      "⏭️ Skipping simulation (deferred calls not supported in read-only mode)"
    );

    // Execute transaction with proper options
    const result = await accounts[0].callSC({
      target: CONTRACT_ADDRESS,
      func: "createDealForMAS",
      parameter: args.serialize(),
      coins: params.amountMAS,
      maxGas: 150000000n, // 150M gas
      fee: 10000000n, // 0.01 MAS
      periodToLive: 128, // Operation expires in 128 periods (~34 minutes)
    });

    console.log("📤 Transaction submitted:", result.id);

    // Wait for final execution
    try {
      const finalStatus = await result.waitFinalExecution();

      // Check execution status
      console.log("📊 Final execution status:", finalStatus);

      // Parse deal ID from events
      const events = await result.getFinalEvents();
      console.log("📋 Events received:", events);

      // Check for error in events
      if (events && events.length > 0 && events[0].data) {
        try {
          const eventData = events[0].data;
          console.log("📝 Raw event data:", eventData);

          // Check if it's an error event
          if (
            typeof eventData === "string" &&
            eventData.includes("massa_execution_error")
          ) {
            const errorMatch = eventData.match(
              /massa_execution_error['":\s]*(.+?)["'}]/
            );
            if (errorMatch) {
              const errorMsg = errorMatch[1];
              console.error("❌ Contract execution error:", errorMsg);
              return {
                success: false,
                error: `Contract execution failed: ${errorMsg}`,
              };
            }
          }
        } catch (e) {
          console.warn("Failed to parse event data:", e);
        }
      }

      let dealId: number | undefined;
      if (events && events.length > 0) {
        const eventData = events[0].data;
        const match = eventData.match(/id[=:]?\s*(\d+)/i);
        if (match) {
          dealId = parseInt(match[1]);
        }
      }

      console.log("✅ Transaction finalized. Deal ID:", dealId);

      // Check if transaction actually succeeded
      if (!dealId && (!events || events.length === 0)) {
        return {
          success: false,
          operationId: result.id,
          error:
            "Transaction executed but no DealCreated event found. Check blockchain explorer for details.",
        };
      }

      return {
        success: true,
        dealId,
        operationId: result.id,
      };
    } catch (statusError: any) {
      // Network error fetching status - transaction might still succeed
      console.error("❌ Transaction execution error:", statusError);

      // Return partial success - transaction was submitted
      return {
        success: true,
        operationId: result.id,
        error:
          "Transaction submitted but status unavailable. Check blockchain explorer.",
      };
    }
  } catch (error: any) {
    console.error("Error creating MAS deal:", error);
    return {
      success: false,
      error: error.message || "Failed to create MAS deal",
    };
  }
}

/**
 * Create a new escrow deal with USDC.e (or other MRC20 token)
 */
export async function createDealForToken(
  provider: Wallet,
  params: {
    freelancerAddress: string;
    tokenAddress: string;
    amount: bigint; // Amount in token's smallest unit
    deadlineMs: number; // Unix timestamp in milliseconds (will be converted to slot)
    mode: DealMode;
    note?: string;
  }
): Promise<{
  success: boolean;
  dealId?: number;
  operationId?: string;
  error?: string;
}> {
  if (!isContractConfigured()) {
    return { success: false, error: "Contract not configured" };
  }

  try {
    const walletAddress = await getWalletAddress(provider);
    const accounts = await provider.accounts();

    // ✅ FETCH REAL CHAIN TIME FROM NODE (never estimate from genesis)
    const publicProvider = createPublicProvider();
    const { currentPeriod, t0Ms } = await getNetworkTime(publicProvider);

    // Calculate user-requested duration in periods
    const deadlineDurationMs = params.deadlineMs - Date.now();
    const userDurationPeriods = millisecondsToPeriods(deadlineDurationMs, t0Ms);

    // Add safety buffer (minimum 8 periods)
    const safetyBuffer = 8;
    const deadlineSlot = currentPeriod + userDurationPeriods + safetyBuffer;

    console.log("✅ Token deal creation params:", {
      networkPeriod: currentPeriod,
      t0Ms,
      userDurationPeriods,
      safetyBuffer,
      deadlineSlot,
      freelancer: params.freelancerAddress,
      tokenAddress: params.tokenAddress,
      amount: params.amount.toString(),
      mode: params.mode,
      caller: walletAddress,
    });

    const args = new Args()
      .addString(params.freelancerAddress)
      .addString(params.tokenAddress)
      .addU64(params.amount)
      .addU64(BigInt(deadlineSlot))
      .addU8(BigInt(params.mode))
      .addString(params.note || "");

    // Note: Skipping simulation - read-only calls can fail on some nodes
    console.log("⏭️ Skipping simulation, proceeding to transaction...");

    // Note: User must approve token transfer first!
    const result = await accounts[0].callSC({
      target: CONTRACT_ADDRESS,
      func: "createDealForToken",
      parameter: args.serialize(),
      maxGas: 200000000n, // 200M gas for token operations
      fee: 10000000n, // 0.01 MAS
      periodToLive: 64, // Operation expires in 64 periods
    });

    console.log("📤 Token transaction submitted:", result.id);

    // Wait for final execution
    await result.waitFinalExecution();

    // Parse deal ID from events
    const events = await result.getFinalEvents();
    let dealId: number | undefined;
    if (events && events.length > 0) {
      const eventData = events[0].data;
      const match = eventData.match(/id[=:]?\s*(\d+)/i);
      if (match) {
        dealId = parseInt(match[1]);
      }
    }

    console.log("✅ Token transaction finalized. Deal ID:", dealId);

    return {
      success: true,
      dealId,
      operationId: result.id,
    };
  } catch (error: any) {
    console.error("Error creating token deal:", error);
    return {
      success: false,
      error: error.message || "Failed to create token deal",
    };
  }
}

/**
 * Approve a deal and release funds to freelancer
 */
export async function approveAndRelease(
  provider: Wallet,
  dealId: number
): Promise<{ success: boolean; operationId?: string; error?: string }> {
  if (!isContractConfigured()) {
    return { success: false, error: "Contract not configured" };
  }

  try {
    const accounts = await provider.accounts();
    const args = new Args().addU64(BigInt(dealId));

    const result = await accounts[0].callSC({
      target: CONTRACT_ADDRESS,
      func: "approveAndRelease",
      parameter: args.serialize(),
      maxGas: 150000000n,
    });

    await result.waitFinalExecution();

    return {
      success: true,
      operationId: result.id,
    };
  } catch (error: any) {
    console.error("Error approving deal:", error);
    return {
      success: false,
      error: error.message || "Failed to approve deal",
    };
  }
}

/**
 * Process a deal after deadline (trigger auto-release or auto-refund)
 * This needs to be called manually after the deadline passes
 */
export async function processDeal(
  provider: Wallet,
  dealId: number
): Promise<{ success: boolean; operationId?: string; error?: string }> {
  if (!isContractConfigured()) {
    return { success: false, error: "Contract not configured" };
  }

  try {
    const accounts = await provider.accounts();
    const args = new Args().addU64(BigInt(dealId));

    const result = await accounts[0].callSC({
      target: CONTRACT_ADDRESS,
      func: "processDeal",
      parameter: args.serialize(),
      maxGas: 150000000n,
      fee: 10000000n, // 0.01 MAS
    });

    await result.waitFinalExecution();

    return {
      success: true,
      operationId: result.id,
    };
  } catch (error: any) {
    console.error("Error processing deal:", error);
    return {
      success: false,
      error: error.message || "Failed to process deal",
    };
  }
}

/**
 * Raise a dispute for a deal
 */
export async function raiseDispute(
  provider: Wallet,
  dealId: number
): Promise<{ success: boolean; operationId?: string; error?: string }> {
  if (!isContractConfigured()) {
    return { success: false, error: "Contract not configured" };
  }

  try {
    const accounts = await provider.accounts();
    const args = new Args().addU64(BigInt(dealId));

    const result = await accounts[0].callSC({
      target: CONTRACT_ADDRESS,
      func: "raiseDispute",
      parameter: args.serialize(),
      maxGas: 150000000n,
    });

    await result.waitFinalExecution();

    return {
      success: true,
      operationId: result.id,
    };
  } catch (error: any) {
    console.error("Error raising dispute:", error);
    return {
      success: false,
      error: error.message || "Failed to raise dispute",
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse deal from contract response
 * Contract returns: id, client, freelancer, assetType, token, amount, deadlineSlot, mode, status, createdSlot, note
 * Note: deadlineSlot and createdSlot are Massa periods, not milliseconds
 */
async function parseDeal(args: Args, provider: PublicProvider): Promise<Deal> {
  const id = Number(args.nextU64());
  const client = args.nextString();
  const freelancer = args.nextString();
  const assetType = Number(args.nextU8()) as AssetType;
  const token = args.nextString();
  const amount = args.nextU64();
  const deadlineSlot = Number(args.nextU64()); // This is a slot/period number
  const mode = Number(args.nextU8()) as DealMode;
  const status = Number(args.nextU8()) as DealStatus;
  const createdSlot = Number(args.nextU64()); // This is a slot/period number
  const note = args.nextString();

  // Convert nanoMAS to MAS (divide by 1 billion)
  const amountInMAS = Number(amount) / 1_000_000_000;

  // Fetch real network time to calculate accurate timestamps
  const { currentPeriod, t0Ms } = await getNetworkTime(provider);

  // Calculate how many periods ago the deal was created
  const periodsSinceCreation = currentPeriod - createdSlot;
  const periodsUntilDeadline = deadlineSlot - currentPeriod;

  // Convert periods to milliseconds
  const msSinceCreation = periodsSinceCreation * t0Ms;
  const msUntilDeadline = periodsUntilDeadline * t0Ms;

  // Calculate absolute timestamps
  const now = Date.now();
  const createdMs = now - msSinceCreation;
  const deadlineMs = now + msUntilDeadline;

  return {
    id: id.toString(),
    clientAddress: client,
    freelancerAddress: freelancer,
    assetType,
    token: token || "",
    amount: amountInMAS.toFixed(2), // Convert to MAS with 2 decimals
    deadline: deadlineMs,
    mode,
    status,
    note,
    createdAt: createdMs,
  };
}

/**
 * Parse deal IDs from contract response
 */
function parseDealIds(data: Uint8Array): number[] {
  try {
    // Check if data is empty or too small
    if (!data || data.length < 4) {
      return []; // No deals
    }

    const args = new Args(data);
    const count = args.nextU32();
    const ids: number[] = [];

    for (let i = 0; i < count; i++) {
      ids.push(Number(args.nextU64()));
    }

    return ids;
  } catch (error) {
    console.warn("Error parsing deal IDs:", error);
    return []; // Return empty array on parse error
  }
}

/**
 * Check if user is client in deal
 */
export function isClient(deal: Deal, userAddress: string): boolean {
  return deal.clientAddress.toLowerCase() === userAddress.toLowerCase();
}

/**
 * Check if user is freelancer in deal
 */
export function isFreelancer(deal: Deal, userAddress: string): boolean {
  return deal.freelancerAddress.toLowerCase() === userAddress.toLowerCase();
}

/**
 * Get user's role in deal
 */
export function getUserRole(
  deal: Deal,
  userAddress: string
): "client" | "freelancer" | null {
  if (isClient(deal, userAddress)) return "client";
  if (isFreelancer(deal, userAddress)) return "freelancer";
  return null;
}
