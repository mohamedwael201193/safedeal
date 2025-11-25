import { DealStatus } from "@/types/deal";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Timer, 
  Circle 
} from "lucide-react";

interface DealStatusBadgeProps {
  status: DealStatus;
  className?: string;
}

const statusConfig: Record<DealStatus, {
  variant: "default" | "success" | "warning" | "destructive" | "muted";
  icon: React.ElementType;
  label: string;
}> = {
  [DealStatus.PENDING]: {
    variant: "muted",
    icon: Circle,
    label: "Pending",
  },
  [DealStatus.ACTIVE]: {
    variant: "default",
    icon: Timer,
    label: "Active",
  },
  [DealStatus.COMPLETED]: {
    variant: "success",
    icon: CheckCircle2,
    label: "Completed",
  },
  [DealStatus.REFUNDED]: {
    variant: "warning",
    icon: XCircle,
    label: "Refunded",
  },
  [DealStatus.DISPUTED]: {
    variant: "destructive",
    icon: AlertTriangle,
    label: "Disputed",
  },
  [DealStatus.EXPIRED]: {
    variant: "muted",
    icon: Clock,
    label: "Expired",
  },
};

export function DealStatusBadge({ status, className }: DealStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
