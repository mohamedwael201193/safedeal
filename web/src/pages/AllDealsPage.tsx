import { DealStatusBadge } from "@/components/domain/DealStatusBadge";
import { EmptyState } from "@/components/domain/EmptyState";
import { Identicon } from "@/components/domain/Identicon";
import { ModeBadge } from "@/components/domain/ModeBadge";
import { TruncatedAddress } from "@/components/domain/TruncatedAddress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { getUserDeals } from "@/lib/massa/contract";
import { formatMAS, formatRelativeTime } from "@/lib/utils/format";
import { Deal, DealRole, DealStatus } from "@/types/deal";
import { FileText, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AllDealsPage() {
  const navigate = useNavigate();
  const { selectedAccount } = useWallet();

  const [roleFilter, setRoleFilter] = useState<DealRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<DealStatus | "ALL">("ALL");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user deals
  useEffect(() => {
    const fetchDeals = async () => {
      if (!selectedAccount) {
        setDeals([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const fetchedDeals = await getUserDeals(selectedAccount.address);
        setDeals(fetchedDeals);
      } catch (err) {
        console.error("Failed to fetch deals:", err);
        toast.error("Failed to load deals");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, [selectedAccount]);

  const filteredDeals = deals.filter((deal) => {
    if (!selectedAccount) return false;

    if (roleFilter !== "ALL") {
      if (
        roleFilter === DealRole.CLIENT &&
        deal.clientAddress !== selectedAccount.address
      ) {
        return false;
      }
      if (
        roleFilter === DealRole.FREELANCER &&
        deal.freelancerAddress !== selectedAccount.address
      ) {
        return false;
      }
    }
    if (statusFilter !== "ALL" && deal.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const statusOptions: Array<DealStatus | "ALL"> = [
    "ALL",
    DealStatus.ACTIVE,
    DealStatus.PENDING,
    DealStatus.COMPLETED,
    DealStatus.REFUNDED,
    DealStatus.DISPUTED,
    DealStatus.EXPIRED,
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-32 rounded-lg bg-card animate-pulse" />
        <div className="h-96 rounded-lg bg-card animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">All Deals</h1>
        <p className="text-muted-foreground">
          View and manage all SafeDeals related to your address.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Role filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Role:</span>
          <div className="flex gap-2">
            {["ALL", DealRole.CLIENT, DealRole.FREELANCER].map((role) => (
              <Badge
                key={role}
                variant={roleFilter === role ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setRoleFilter(role as any)}
              >
                {role === "ALL"
                  ? "All"
                  : role === DealRole.CLIENT
                  ? "Client"
                  : "Freelancer"}
              </Badge>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Status:</span>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((status) => (
              <Badge
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setStatusFilter(status)}
              >
                {status === "ALL" ? "All" : status}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Deals list */}
      {filteredDeals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No deals found"
          description="There are no deals matching your current filters."
          actionLabel="Clear filters"
          onAction={() => {
            setRoleFilter("ALL");
            setStatusFilter("ALL");
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">ID</th>
                  <th className="text-left p-4 text-sm font-medium">Client</th>
                  <th className="text-left p-4 text-sm font-medium">
                    Freelancer
                  </th>
                  <th className="text-left p-4 text-sm font-medium">Amount</th>
                  <th className="text-left p-4 text-sm font-medium">Mode</th>
                  <th className="text-left p-4 text-sm font-medium">
                    Deadline
                  </th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-right p-4 text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-t border-border hover:bg-accent/50 transition-smooth"
                  >
                    <td className="p-4">
                      <span className="font-mono text-sm">#{deal.id}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Identicon address={deal.clientAddress} size={20} />
                        <TruncatedAddress address={deal.clientAddress} />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Identicon address={deal.freelancerAddress} size={20} />
                        <TruncatedAddress address={deal.freelancerAddress} />
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold">
                        {formatMAS(deal.amount)}
                      </span>
                    </td>
                    <td className="p-4">
                      <ModeBadge mode={deal.mode} />
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatRelativeTime(deal.deadline)}
                    </td>
                    <td className="p-4">
                      <DealStatusBadge status={deal.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/app/deals/${deal.id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredDeals.map((deal) => (
              <div
                key={deal.id}
                className="rounded-lg border border-border p-4 space-y-3 hover-lift cursor-pointer"
                onClick={() => navigate(`/app/deals/${deal.id}`)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-muted-foreground">
                    #{deal.id}
                  </span>
                  <DealStatusBadge status={deal.status} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Identicon address={deal.clientAddress} size={20} />
                    <TruncatedAddress address={deal.clientAddress} />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Identicon address={deal.freelancerAddress} size={20} />
                    <TruncatedAddress address={deal.freelancerAddress} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {formatMAS(deal.amount)}
                  </span>
                  <ModeBadge mode={deal.mode} />
                </div>

                <div className="text-sm text-muted-foreground">
                  {formatRelativeTime(deal.deadline)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
