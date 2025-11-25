import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { truncateAddress } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface TruncatedAddressProps {
  address: string;
  className?: string;
  prefixLength?: number;
  suffixLength?: number;
}

export function TruncatedAddress({ 
  address, 
  className,
  prefixLength = 4,
  suffixLength = 2,
}: TruncatedAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-sm transition-smooth",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      title={address}
    >
      <span>{truncateAddress(address, prefixLength, suffixLength)}</span>
      {copied ? (
        <Check className="h-3 w-3 text-success" />
      ) : (
        <Copy className="h-3 w-3 opacity-50" />
      )}
    </button>
  );
}
