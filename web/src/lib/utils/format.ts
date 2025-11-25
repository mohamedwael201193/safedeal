/**
 * Formatting utilities for SafeDeal
 */

/**
 * Truncate a Massa address for display
 * @example "AS12...9Q"
 */
export function truncateAddress(
  address: string,
  prefixLength = 4,
  suffixLength = 2
): string {
  if (!address || address.length <= prefixLength + suffixLength) return address;
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Format MAS amount with proper decimals
 * @param amount - Amount in MAS (not nanoMAS)
 */
export function formatMAS(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a timestamp to a readable date/time
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a timestamp to just date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format relative time (e.g., "in 2 hours", "5 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const future = diff > 0;
  const prefix = future ? "in " : "";
  const suffix = future ? "" : " ago";

  if (days > 0) {
    return `${prefix}${days} day${days > 1 ? "s" : ""}${suffix}`;
  }
  if (hours > 0) {
    return `${prefix}${hours} hour${hours > 1 ? "s" : ""}${suffix}`;
  }
  if (minutes > 0) {
    return `${prefix}${minutes} minute${minutes > 1 ? "s" : ""}${suffix}`;
  }
  return `${prefix}${seconds} second${seconds !== 1 ? "s" : ""}${suffix}`;
}

/**
 * Format countdown time as HH:MM:SS
 */
export function formatCountdown(timestamp: number): string {
  const now = Date.now();
  const diff = Math.max(0, timestamp - now);

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const h = hours.toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");

  return `${h}:${m}:${s}`;
}
