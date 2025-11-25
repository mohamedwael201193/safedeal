/**
 * SafeDeal domain types
 */

export enum DealStatus {
  PENDING = 0,
  ACTIVE = 1,
  COMPLETED = 2,
  REFUNDED = 3,
  DISPUTED = 4,
  EXPIRED = 5,
}

export enum DealMode {
  AUTO_RELEASE = 0, // Auto-release to freelancer if nobody acts
  AUTO_REFUND = 1, // Auto-refund to client if nobody acts
}

export enum AssetType {
  MAS = 0,
  MRC20 = 1,
}

export enum DealRole {
  CLIENT = "CLIENT",
  FREELANCER = "FREELANCER",
}

export interface Deal {
  id: string;
  clientAddress: string;
  freelancerAddress: string;
  assetType: AssetType; // MAS or MRC20
  token: string; // Token address (empty for MAS)
  amount: string; // Amount in smallest unit (nanoMAS or token wei)
  deadline: number; // Unix timestamp in milliseconds
  mode: DealMode;
  status: DealStatus;
  note?: string;
  createdAt: number; // Unix timestamp in milliseconds
  completedAt?: number; // Unix timestamp in milliseconds
}

export interface DealEvent {
  type: "CREATED" | "FUNDED" | "APPROVED" | "RELEASED" | "REFUNDED" | "DISPUTED";
  timestamp: number;
  txHash?: string;
}

// Helper function to get status label
export function getStatusLabel(status: DealStatus): string {
  switch (status) {
    case DealStatus.PENDING:
      return "Pending";
    case DealStatus.ACTIVE:
      return "Active";
    case DealStatus.COMPLETED:
      return "Completed";
    case DealStatus.REFUNDED:
      return "Refunded";
    case DealStatus.DISPUTED:
      return "Disputed";
    case DealStatus.EXPIRED:
      return "Expired";
    default:
      return "Unknown";
  }
}

// Helper function to get mode label
export function getModeLabel(mode: DealMode): string {
  return mode === DealMode.AUTO_RELEASE ? "Auto-Release" : "Auto-Refund";
}

// Helper function to get asset type label
export function getAssetTypeLabel(assetType: AssetType): string {
  return assetType === AssetType.MAS ? "MAS" : "Token";
}
