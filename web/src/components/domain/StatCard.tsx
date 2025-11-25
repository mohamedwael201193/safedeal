import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
  valueClassName?: string;
}

export function StatCard({ title, value, icon: Icon, className, valueClassName }: StatCardProps) {
  return (
    <Card className={cn("p-6 hover-lift", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-bold", valueClassName)}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
}
