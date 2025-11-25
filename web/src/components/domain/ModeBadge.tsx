import { DealMode } from "@/types/deal";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

interface ModeBadgeProps {
  mode: DealMode;
  className?: string;
}

export function ModeBadge({ mode, className }: ModeBadgeProps) {
  const isAutoRelease = mode === DealMode.AUTO_RELEASE;

  return (
    <Badge variant={isAutoRelease ? "success" : "warning"} className={className}>
      {isAutoRelease ? (
        <>
          <ArrowDownToLine className="h-3 w-3" />
          Auto-release if silent
        </>
      ) : (
        <>
          <ArrowUpFromLine className="h-3 w-3" />
          Auto-refund if silent
        </>
      )}
    </Badge>
  );
}
