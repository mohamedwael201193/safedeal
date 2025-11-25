import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetTimestamp: number;
  className?: string;
  onComplete?: () => void;
}

export function CountdownTimer({ targetTimestamp, className, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetTimestamp - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        onComplete?.();
        return;
      }

      // Mark as urgent if less than 1 minute remaining
      setIsUrgent(diff < 60000);
      setTimeLeft(formatCountdown(targetTimestamp));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp, onComplete]);

  return (
    <div
      className={cn(
        "font-mono text-2xl font-bold tracking-wider",
        isUrgent && "animate-pulse-subtle text-warning",
        className
      )}
    >
      {timeLeft}
    </div>
  );
}
