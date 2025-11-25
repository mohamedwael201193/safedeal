import { useMemo } from "react";

interface IdenticonProps {
  address: string;
  size?: number;
  className?: string;
}

/**
 * Simple deterministic identicon based on address
 */
export function Identicon({ address, size = 24, className }: IdenticonProps) {
  const color = useMemo(() => {
    // Generate a deterministic color from the address
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }, [address]);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        flexShrink: 0,
      }}
      title={address}
    />
  );
}
