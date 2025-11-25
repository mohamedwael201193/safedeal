import {
  Args,
  bytesToU64,
  stringToBytes,
  u64ToBytes,
} from "@massalabs/as-types";
import {
  Address,
  call,
  Context,
  currentPeriod,
  generateEvent,
  Storage,
  transferCoins,
} from "@massalabs/massa-as-sdk";

// ============================================================================
// CONSTANTS
// ============================================================================

const DEAL_ID_KEY = stringToBytes("nextDealId");

// USDC.e Token Address on Massa Mainnet
const USDCE_TOKEN_ADDRESS =
  "AS1hCJXjndR4c9vekLWsXGnrdigp4AaZ7uYG3UKFzzKnWVsrNLPJ";

// Deal status enum
export enum DealStatus {
  Pending = 0,
  Active = 1,
  Completed = 2,
  Refunded = 3,
  Disputed = 4,
  Expired = 5,
}

// Deal mode enum
export enum DealMode {
  AutoRelease = 0, // Auto-release to freelancer if silent
  AutoRefund = 1, // Auto-refund to client if silent
}

// Asset type enum
export enum AssetType {
  MAS = 0, // Native MAS token
  MRC20 = 1, // MRC20 token (USDC.e)
}

// ============================================================================
// DEAL STRUCTURE
// ============================================================================

export class Deal {
  id: u64;
  client: string;
  freelancer: string;
  assetType: u8; // 0 = MAS, 1 = MRC20
  token: string; // Token address (only for MRC20)
  amount: u64;
  deadlineSlot: u64;
  mode: u8;
  status: u8;
  createdSlot: u64;
  note: string;

  constructor(
    id: u64,
    client: string,
    freelancer: string,
    assetType: u8,
    token: string,
    amount: u64,
    deadlineSlot: u64,
    mode: u8,
    status: u8,
    createdSlot: u64,
    note: string
  ) {
    this.id = id;
    this.client = client;
    this.freelancer = freelancer;
    this.assetType = assetType;
    this.token = token;
    this.amount = amount;
    this.deadlineSlot = deadlineSlot;
    this.mode = mode;
    this.status = status;
    this.createdSlot = createdSlot;
    this.note = note;
  }

  serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.id);
    args.add(this.client);
    args.add(this.freelancer);
    args.add(this.assetType);
    args.add(this.token);
    args.add(this.amount);
    args.add(this.deadlineSlot);
    args.add(this.mode);
    args.add(this.status);
    args.add(this.createdSlot);
    args.add(this.note);
    return args.serialize();
  }

  static deserialize(data: StaticArray<u8>): Deal {
    const args = new Args(data);
    return new Deal(
      args.nextU64().unwrap(),
      args.nextString().unwrap(),
      args.nextString().unwrap(),
      args.nextU8().unwrap(),
      args.nextString().unwrap(),
      args.nextU64().unwrap(),
      args.nextU64().unwrap(),
      args.nextU8().unwrap(),
      args.nextU8().unwrap(),
      args.nextU64().unwrap(),
      args.nextString().unwrap()
    );
  }
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function getDealKey(id: u64): StaticArray<u8> {
  return stringToBytes("deal_" + id.toString());
}

function getClientDealsKey(address: string): StaticArray<u8> {
  return stringToBytes("client_" + address);
}

function getFreelancerDealsKey(address: string): StaticArray<u8> {
  return stringToBytes("freelancer_" + address);
}

function getNextDealId(): u64 {
  if (Storage.has(DEAL_ID_KEY)) {
    return bytesToU64(Storage.get(DEAL_ID_KEY));
  }
  return 1;
}

function incrementDealId(): u64 {
  const nextId = getNextDealId();
  Storage.set(DEAL_ID_KEY, u64ToBytes(nextId + 1));
  return nextId;
}

function saveDeal(deal: Deal): void {
  Storage.set(getDealKey(deal.id), deal.serialize());
}

function loadDeal(id: u64): Deal {
  assert(Storage.has(getDealKey(id)), "Deal does not exist");
  return Deal.deserialize(Storage.get(getDealKey(id)));
}

function addDealToClientIndex(clientAddress: string, dealId: u64): void {
  const key = getClientDealsKey(clientAddress);
  let deals: u64[] = [];

  if (Storage.has(key)) {
    const args = new Args(Storage.get(key));
    const count = args.nextU32().unwrap();
    for (let i: u32 = 0; i < count; i++) {
      deals.push(args.nextU64().unwrap());
    }
  }

  deals.push(dealId);

  const argsOut = new Args();
  argsOut.add(<u32>deals.length);
  for (let i = 0; i < deals.length; i++) {
    argsOut.add(deals[i]);
  }
  Storage.set(key, argsOut.serialize());
}

function addDealToFreelancerIndex(
  freelancerAddress: string,
  dealId: u64
): void {
  const key = getFreelancerDealsKey(freelancerAddress);
  let deals: u64[] = [];

  if (Storage.has(key)) {
    const args = new Args(Storage.get(key));
    const count = args.nextU32().unwrap();
    for (let i: u32 = 0; i < count; i++) {
      deals.push(args.nextU64().unwrap());
    }
  }

  deals.push(dealId);

  const argsOut = new Args();
  argsOut.add(<u32>deals.length);
  for (let i = 0; i < deals.length; i++) {
    argsOut.add(deals[i]);
  }
  Storage.set(key, argsOut.serialize());
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Create a new escrow deal with MAS.
 * Client must send MAS as transferred coins.
 *
 * @param binaryArgs - Serialized Args containing:
 *   - freelancerAddress: string
 *   - deadlineSlot: u64
 *   - mode: u8 (0 = auto-release, 1 = auto-refund)
 *   - note: string (optional)
 */
export function createDealForMAS(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const freelancerAddress = args.nextString().unwrap();
  const deadlineSlot = args.nextU64().unwrap();
  const mode = args.nextU8().unwrap();
  const note = args.nextString().unwrap();

  // Validate inputs
  assert(
    mode <= 1,
    "Invalid mode: must be 0 (auto-release) or 1 (auto-refund)"
  );
  assert(deadlineSlot > currentPeriod(), "Deadline must be in the future");

  // Get transferred amount
  const amount = Context.transferredCoins();
  assert(amount > 0, "Must send MAS to create deal");

  // Get client address
  const clientAddress = Context.caller().toString();

  // Validate addresses
  assert(
    clientAddress != freelancerAddress,
    "Client and freelancer must be different"
  );

  // Create deal
  const dealId = incrementDealId();

  const deal = new Deal(
    dealId,
    clientAddress,
    freelancerAddress,
    <u8>AssetType.MAS,
    "", // No token address for MAS
    amount,
    deadlineSlot,
    mode,
    <u8>DealStatus.Active,
    currentPeriod(),
    note
  );

  // Save deal
  saveDeal(deal);
  addDealToClientIndex(clientAddress, dealId);
  addDealToFreelancerIndex(freelancerAddress, dealId);

  // Note: Autonomous execution via asyncCall/deferredCall is not available in MAIN.4.0
  // processDeal() can be called manually after deadline via keeper or UI button

  // Emit event
  generateEvent(
    "DealCreated: id=" +
      dealId.toString() +
      ", client=" +
      clientAddress +
      ", freelancer=" +
      freelancerAddress +
      ", assetType=MAS" +
      ", amount=" +
      amount.toString() +
      ", deadline=" +
      deadlineSlot.toString() +
      ", mode=" +
      mode.toString()
  );

  const response = new Args();
  response.add(dealId);
  return response.serialize();
}

/**
 * Create a new escrow deal with an MRC20 token (USDC.e).
 * Client must have already approved SafeDeal contract to spend tokens.
 *
 * @param binaryArgs - Serialized Args containing:
 *   - freelancerAddress: string
 *   - tokenAddress: string (must be USDC.e for v1)
 *   - amount: u64
 *   - deadlineSlot: u64
 *   - mode: u8 (0 = auto-release, 1 = auto-refund)
 *   - note: string (optional)
 */
export function createDealForToken(
  binaryArgs: StaticArray<u8>
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const freelancerAddress = args.nextString().unwrap();
  const tokenAddress = args.nextString().unwrap();
  const amount = args.nextU64().unwrap();
  const deadlineSlot = args.nextU64().unwrap();
  const mode = args.nextU8().unwrap();
  const note = args.nextString().unwrap();

  // Validate inputs
  assert(amount > 0, "Amount must be greater than 0");
  assert(
    mode <= 1,
    "Invalid mode: must be 0 (auto-release) or 1 (auto-refund)"
  );
  assert(deadlineSlot > currentPeriod(), "Deadline must be in the future");

  // V1: Only support USDC.e
  assert(
    tokenAddress == USDCE_TOKEN_ADDRESS,
    "Only USDC.e token is supported in v1"
  );

  // Get client address
  const clientAddress = Context.caller().toString();

  // Validate addresses
  assert(
    clientAddress != freelancerAddress,
    "Client and freelancer must be different"
  );

  // Transfer tokens from client to this contract using MRC20 transferFrom
  // Client must have approved this contract beforehand
  const transferArgs = new Args()
    .add(clientAddress)
    .add(Context.callee().toString())
    .add(amount);

  const transferResult = call(
    new Address(tokenAddress),
    "transferFrom",
    transferArgs,
    0 // No coins with this call
  );

  // Check if transfer succeeded
  const resultArgs = new Args(transferResult);
  const success = resultArgs.nextBool().unwrap();
  assert(success, "Token transfer failed - ensure approval is set");

  // Create deal
  const dealId = incrementDealId();

  const deal = new Deal(
    dealId,
    clientAddress,
    freelancerAddress,
    <u8>AssetType.MRC20,
    tokenAddress,
    amount,
    deadlineSlot,
    mode,
    <u8>DealStatus.Active,
    currentPeriod(),
    note
  );

  // Save deal
  saveDeal(deal);
  addDealToClientIndex(clientAddress, dealId);
  addDealToFreelancerIndex(freelancerAddress, dealId);

  // Note: Autonomous execution via asyncCall/deferredCall is not available in MAIN.4.0
  // processDeal() can be called manually after deadline via keeper or UI button

  // Emit event
  generateEvent(
    "DealCreated: id=" +
      dealId.toString() +
      ", client=" +
      clientAddress +
      ", freelancer=" +
      freelancerAddress +
      ", assetType=MRC20" +
      ", token=" +
      tokenAddress +
      ", amount=" +
      amount.toString() +
      ", deadline=" +
      deadlineSlot.toString() +
      ", mode=" +
      mode.toString()
  );

  const response = new Args();
  response.add(dealId);
  return response.serialize();
}

/**
 * Client approves the deal and releases funds to freelancer.
 * Handles both MAS and MRC20 tokens.
 *
 * @param binaryArgs - Serialized Args containing:
 *   - dealId: u64
 */
export function approveAndRelease(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const dealId = args.nextU64().unwrap();

  const deal = loadDeal(dealId);
  const caller = Context.caller().toString();

  // Validate caller is client
  assert(caller == deal.client, "Only client can approve and release");

  // Validate deal status
  assert(deal.status == DealStatus.Active, "Deal must be active");

  // Transfer funds based on asset type
  if (deal.assetType == AssetType.MAS) {
    // Transfer MAS to freelancer
    transferCoins(new Address(deal.freelancer), deal.amount);
  } else {
    // Transfer MRC20 tokens to freelancer
    const transferArgs = new Args().add(deal.freelancer).add(deal.amount);

    call(
      new Address(deal.token),
      "transfer",
      transferArgs,
      0 // No coins with this call
    );
  }

  // Update deal status
  deal.status = <u8>DealStatus.Completed;
  saveDeal(deal);

  // Emit event
  generateEvent(
    "DealCompleted: id=" +
      dealId.toString() +
      ", freelancer=" +
      deal.freelancer +
      ", amount=" +
      deal.amount.toString()
  );
}

/**
 * Either party can raise a dispute.
 * This freezes the funds until manual intervention.
 *
 * @param binaryArgs - Serialized Args containing:
 *   - dealId: u64
 */
export function raiseDispute(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const dealId = args.nextU64().unwrap();

  const deal = loadDeal(dealId);
  const caller = Context.caller().toString();

  // Validate caller is involved in deal
  assert(
    caller == deal.client || caller == deal.freelancer,
    "Only client or freelancer can raise dispute"
  );

  // Validate deal status
  assert(deal.status == DealStatus.Active, "Deal must be active");

  // Update deal status
  deal.status = <u8>DealStatus.Disputed;
  saveDeal(deal);

  // Emit event
  generateEvent(
    "DealDisputed: id=" + dealId.toString() + ", disputedBy=" + caller
  );
}

/**
 * Autonomous function called at deadline by deferred call.
 * Executes auto-release or auto-refund based on deal mode.
 * Handles both MAS and MRC20 tokens.
 *
 * @param binaryArgs - Serialized Args containing:
 *   - dealId: u64
 */
export function processDeal(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const dealId = args.nextU64().unwrap();

  const deal = loadDeal(dealId);

  // Only process if deal is still active
  if (deal.status != DealStatus.Active) {
    return;
  }

  // Check if deadline has passed
  if (currentPeriod() < deal.deadlineSlot) {
    return;
  }

  if (deal.mode == DealMode.AutoRelease) {
    // Auto-release to freelancer
    if (deal.assetType == AssetType.MAS) {
      transferCoins(new Address(deal.freelancer), deal.amount);
    } else {
      // Transfer MRC20 tokens
      const transferArgs = new Args().add(deal.freelancer).add(deal.amount);

      call(new Address(deal.token), "transfer", transferArgs, 0);
    }
    deal.status = <u8>DealStatus.Completed;

    generateEvent(
      "DealAutoReleased: id=" +
        dealId.toString() +
        ", freelancer=" +
        deal.freelancer +
        ", amount=" +
        deal.amount.toString()
    );
  } else {
    // Auto-refund to client
    if (deal.assetType == AssetType.MAS) {
      transferCoins(new Address(deal.client), deal.amount);
    } else {
      // Transfer MRC20 tokens
      const transferArgs = new Args().add(deal.client).add(deal.amount);

      call(new Address(deal.token), "transfer", transferArgs, 0);
    }
    deal.status = <u8>DealStatus.Refunded;

    generateEvent(
      "DealAutoRefunded: id=" +
        dealId.toString() +
        ", client=" +
        deal.client +
        ", amount=" +
        deal.amount.toString()
    );
  }

  saveDeal(deal);
}

// ============================================================================
// READ FUNCTIONS
// ============================================================================

/**
 * Get deal details by ID.
 *
 * @param binaryArgs - Serialized Args containing:
 *   - dealId: u64
 */
export function getDeal(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const dealId = args.nextU64().unwrap();

  const deal = loadDeal(dealId);
  return deal.serialize();
}

/**
 * Get all deal IDs for a client address.
 *
 * @param binaryArgs - Serialized Args containing:
 *   - clientAddress: string
 */
export function getDealsByClient(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const clientAddress = args.nextString().unwrap();

  const key = getClientDealsKey(clientAddress);

  if (!Storage.has(key)) {
    const response = new Args();
    response.add(<u32>0);
    return response.serialize();
  }

  return Storage.get(key);
}

/**
 * Get all deal IDs for a freelancer address.
 *
 * @param binaryArgs - Serialized Args containing:
 *   - freelancerAddress: string
 */
export function getDealsByFreelancer(
  binaryArgs: StaticArray<u8>
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const freelancerAddress = args.nextString().unwrap();

  const key = getFreelancerDealsKey(freelancerAddress);

  if (!Storage.has(key)) {
    const response = new Args();
    response.add(<u32>0);
    return response.serialize();
  }

  return Storage.get(key);
}

/**
 * Get the current next deal ID (for informational purposes).
 */
export function getNextDealIdView(_: StaticArray<u8>): StaticArray<u8> {
  const response = new Args();
  response.add(getNextDealId());
  return response.serialize();
}
