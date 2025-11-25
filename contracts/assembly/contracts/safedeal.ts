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
  deferredCallQuote,
  deferredCallRegister,
  generateEvent,
  Slot,
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

// Deferred call parameters for GUARANTEED autonomous execution
const MAX_GAS_FOR_EXECUTION: u64 = 20_000_000; // 20M gas for processDeal execution
const EXECUTION_RESERVE: u64 = 1_000_000_000; // 1.0 MAS reserved for deferred call booking (guaranteed execution)
const EXECUTION_BUFFER_PERIODS: u64 = 1; // Execute 1 period after deadline

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
  AutoRelease = 0,
  AutoRefund = 1,
}

// Asset type enum
export enum AssetType {
  MAS = 0,
  MRC20 = 1,
}

// ============================================================================
// DEAL STRUCTURE
// ============================================================================

export class Deal {
  id: u64;
  client: string;
  freelancer: string;
  assetType: u8;
  token: string;
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

export function createDealForMAS(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const freelancerAddress = args.nextString().unwrap();
  const deadlineSlot = args.nextU64().unwrap();
  const mode = args.nextU8().unwrap();
  const note = args.nextString().unwrap();

  assert(
    mode <= 1,
    "Invalid mode: must be 0 (auto-release) or 1 (auto-refund)"
  );

  // Diagnostic logging
  const contractCurrentPeriod = Context.currentPeriod();
  generateEvent(
    "CreateDealDebug: currentPeriod=" +
      contractCurrentPeriod.toString() +
      ", deadlineSlot=" +
      deadlineSlot.toString()
  );

  assert(
    deadlineSlot > contractCurrentPeriod,
    "Deadline must be in the future"
  );

  const totalCoins = Context.transferredCoins();
  assert(
    totalCoins > EXECUTION_RESERVE,
    "Must send more than execution reserve (1.0 MAS)"
  );

  // Amount for deal = total - execution reserve
  const amount = totalCoins - EXECUTION_RESERVE;

  const clientAddress = Context.caller().toString();
  assert(
    clientAddress != freelancerAddress,
    "Client and freelancer must be different"
  );

  const dealId = incrementDealId();

  const deal = new Deal(
    dealId,
    clientAddress,
    freelancerAddress,
    <u8>AssetType.MAS,
    "",
    amount,
    deadlineSlot,
    mode,
    <u8>DealStatus.Active,
    Context.currentPeriod(),
    note
  );

  saveDeal(deal);
  addDealToClientIndex(clientAddress, dealId);
  addDealToFreelancerIndex(freelancerAddress, dealId);

  // ========================================================================
  // GUARANTEED AUTONOMOUS EXECUTION via Deferred Calls
  // ========================================================================
  const currentPeriod = Context.currentPeriod();
  const currentThread = Context.currentThread();

  // Execute exactly 1 period after deadline for guaranteed execution
  const executionPeriod = deadlineSlot + EXECUTION_BUFFER_PERIODS;
  const targetSlot = new Slot(executionPeriod, currentThread);

  // Serialize dealId as parameter for processDeal
  const processDealParams = new Args().add(dealId).serialize();
  const paramsSize: u64 = processDealParams.length;

  // Step 1: Request quote for deferred call booking
  const bookingFee = deferredCallQuote(
    targetSlot,
    MAX_GAS_FOR_EXECUTION,
    paramsSize
  );

  generateEvent(
    "DeferredQuote: dealId=" +
      dealId.toString() +
      ", targetSlot=" +
      targetSlot.period.toString() +
      ", bookingFee=" +
      bookingFee.toString() +
      " nanoMAS, maxGas=" +
      MAX_GAS_FOR_EXECUTION.toString()
  );

  // Step 2: Register deferred call (GUARANTEED execution)
  const deferredCallId = deferredCallRegister(
    Context.callee().toString(), // This contract
    "processDeal", // Function to execute
    targetSlot, // Exact execution slot
    MAX_GAS_FOR_EXECUTION, // Max gas
    processDealParams, // Serialized parameters
    0 // Same contract, no coins needed
  );

  generateEvent(
    "DeferredScheduled: dealId=" +
      dealId.toString() +
      ", callId=" +
      deferredCallId +
      ", executionSlot=" +
      targetSlot.period.toString() +
      ", bookingFee=" +
      bookingFee.toString() +
      " nanoMAS (GUARANTEED)"
  );

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
      mode.toString() +
      ", autoExecution=scheduled" +
      ", executionPeriod=" +
      (deadlineSlot + 1).toString()
  );

  const response = new Args();
  response.add(dealId);
  return response.serialize();
}

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

  assert(amount > 0, "Amount must be greater than 0");
  assert(
    mode <= 1,
    "Invalid mode: must be 0 (auto-release) or 1 (auto-refund)"
  );
  assert(
    deadlineSlot > Context.currentPeriod(),
    "Deadline must be in the future"
  );
  assert(
    tokenAddress == USDCE_TOKEN_ADDRESS,
    "Only USDC.e token is supported in v1"
  );

  const clientAddress = Context.caller().toString();
  assert(
    clientAddress != freelancerAddress,
    "Client and freelancer must be different"
  );

  // Transfer tokens
  const transferArgs = new Args()
    .add(clientAddress)
    .add(Context.callee().toString())
    .add(amount);

  const transferResult = call(
    new Address(tokenAddress),
    "transferFrom",
    transferArgs,
    0
  );

  const resultArgs = new Args(transferResult);
  const success = resultArgs.nextBool().unwrap();
  assert(success, "Token transfer failed - ensure approval is set");

  // Validate MAS sent for execution reserve
  const executionCoins = Context.transferredCoins();
  assert(
    executionCoins >= EXECUTION_RESERVE,
    "Must send at least 1.0 MAS for guaranteed autonomous execution"
  );

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
    Context.currentPeriod(),
    note
  );

  saveDeal(deal);
  addDealToClientIndex(clientAddress, dealId);
  addDealToFreelancerIndex(freelancerAddress, dealId);

  // ========================================================================
  // GUARANTEED AUTONOMOUS EXECUTION via Deferred Calls
  // ========================================================================
  const currentPeriod = Context.currentPeriod();
  const currentThread = Context.currentThread();

  // Execute exactly 1 period after deadline for guaranteed execution
  const executionPeriod = deadlineSlot + EXECUTION_BUFFER_PERIODS;
  const targetSlot = new Slot(executionPeriod, currentThread);

  // Serialize dealId as parameter for processDeal
  const processDealParams = new Args().add(dealId).serialize();
  const paramsSize: u64 = processDealParams.length;

  // Step 1: Request quote for deferred call booking
  const bookingFee = deferredCallQuote(
    targetSlot,
    MAX_GAS_FOR_EXECUTION,
    paramsSize
  );

  generateEvent(
    "DeferredQuote: dealId=" +
      dealId.toString() +
      ", targetSlot=" +
      targetSlot.period.toString() +
      ", bookingFee=" +
      bookingFee.toString() +
      " nanoMAS, maxGas=" +
      MAX_GAS_FOR_EXECUTION.toString()
  );

  // Step 2: Register deferred call (GUARANTEED execution)
  const deferredCallId = deferredCallRegister(
    Context.callee().toString(), // This contract
    "processDeal", // Function to execute
    targetSlot, // Exact execution slot
    MAX_GAS_FOR_EXECUTION, // Max gas
    processDealParams, // Serialized parameters
    0 // Same contract, no coins needed
  );

  generateEvent(
    "DeferredScheduled: dealId=" +
      dealId.toString() +
      ", callId=" +
      deferredCallId +
      ", executionSlot=" +
      targetSlot.period.toString() +
      ", bookingFee=" +
      bookingFee.toString() +
      " nanoMAS (GUARANTEED)"
  );

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
      mode.toString() +
      ", autoExecution=scheduled" +
      ", executionPeriod=" +
      (deadlineSlot + 1).toString()
  );

  const response = new Args();
  response.add(dealId);
  return response.serialize();
}

export function approveAndRelease(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const dealId = args.nextU64().unwrap();

  const deal = loadDeal(dealId);
  const caller = Context.caller().toString();

  assert(caller == deal.client, "Only client can approve and release");
  assert(deal.status == DealStatus.Active, "Deal must be active");

  if (deal.assetType == AssetType.MAS) {
    transferCoins(new Address(deal.freelancer), deal.amount);
  } else {
    const transferArgs = new Args().add(deal.freelancer).add(deal.amount);
    call(new Address(deal.token), "transfer", transferArgs, 0);
  }

  deal.status = <u8>DealStatus.Completed;
  saveDeal(deal);

  generateEvent(
    "DealCompleted: id=" +
      dealId.toString() +
      ", freelancer=" +
      deal.freelancer +
      ", amount=" +
      deal.amount.toString()
  );
}

export function raiseDispute(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const dealId = args.nextU64().unwrap();

  const deal = loadDeal(dealId);
  const caller = Context.caller().toString();

  assert(
    caller == deal.client || caller == deal.freelancer,
    "Only client or freelancer can raise dispute"
  );
  assert(deal.status == DealStatus.Active, "Deal must be active");

  deal.status = <u8>DealStatus.Disputed;
  saveDeal(deal);

  generateEvent(
    "DealDisputed: id=" + dealId.toString() + ", disputedBy=" + caller
  );
}

export function processDeal(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const dealId = args.nextU64().unwrap();

  const currentPeriod = Context.currentPeriod();
  const caller = Context.caller().toString();

  generateEvent(
    "ProcessDealCalled: dealId=" +
      dealId.toString() +
      ", caller=" +
      caller +
      ", currentPeriod=" +
      currentPeriod.toString()
  );

  const deal = loadDeal(dealId);

  generateEvent(
    "DealState: id=" +
      dealId.toString() +
      ", status=" +
      deal.status.toString() +
      ", deadline=" +
      deal.deadlineSlot.toString() +
      ", mode=" +
      deal.mode.toString()
  );

  if (deal.status != DealStatus.Active) {
    generateEvent(
      "ProcessDealSkipped: dealId=" +
        dealId.toString() +
        ", reason=notActive, status=" +
        deal.status.toString()
    );
    return;
  }

  if (Context.currentPeriod() < deal.deadlineSlot) {
    generateEvent(
      "ProcessDealSkipped: dealId=" +
        dealId.toString() +
        ", reason=beforeDeadline, current=" +
        currentPeriod.toString() +
        ", deadline=" +
        deal.deadlineSlot.toString()
    );
    return;
  }

  if (deal.mode == DealMode.AutoRelease) {
    if (deal.assetType == AssetType.MAS) {
      transferCoins(new Address(deal.freelancer), deal.amount);
    } else {
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
    if (deal.assetType == AssetType.MAS) {
      transferCoins(new Address(deal.client), deal.amount);
    } else {
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

export function getDeal(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const dealId = args.nextU64().unwrap();
  const deal = loadDeal(dealId);
  return deal.serialize();
}

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

export function getNextDealIdView(_: StaticArray<u8>): StaticArray<u8> {
  const response = new Args();
  response.add(getNextDealId());
  return response.serialize();
}
