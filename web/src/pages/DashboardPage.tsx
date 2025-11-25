import { DealStatusBadge } from "@/components/domain/DealStatusBadge";
import { EmptyState } from "@/components/domain/EmptyState";
import { Identicon } from "@/components/domain/Identicon";
import { ModeBadge } from "@/components/domain/ModeBadge";
import { StatCard } from "@/components/domain/StatCard";
import { TruncatedAddress } from "@/components/domain/TruncatedAddress";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { getUserDeals } from "@/lib/massa/contract";
import { formatMAS, formatRelativeTime } from "@/lib/utils/format";
import { Deal, DealRole, DealStatus } from "@/types/deal";
import { Clock, FileText, PlusCircle, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { selectedAccount } = useWallet();
  const [selectedRole, setSelectedRole] = useState<DealRole>(DealRole.CLIENT);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch deals based on selected role
  useEffect(() => {
    const fetchDeals = async () => {
      if (!selectedAccount) {
        setDeals([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("🔍 Fetching deals for:", selectedAccount.address);
        const fetchedDeals = await getUserDeals(selectedAccount.address);
        console.log("✅ Fetched deals:", fetchedDeals);
        setDeals(fetchedDeals);
      } catch (err) {
        console.error("Failed to fetch deals:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch deals");
        toast.error("Failed to load deals");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, [selectedAccount, selectedRole]);

  const filteredDeals = deals.filter((deal) => {
    // Filter based on connected account address
    if (!selectedAccount) return false;

    if (selectedRole === DealRole.CLIENT) {
      return deal.clientAddress === selectedAccount.address;
    } else {
      return deal.freelancerAddress === selectedAccount.address;
    }
  });

  const activeDeals = filteredDeals.filter(
    (d) => d.status === DealStatus.ACTIVE
  );
  const totalLocked = activeDeals.reduce(
    (sum, d) => sum + parseFloat(d.amount),
    0
  );

  // Find earliest deadline
  const nextDeadline =
    activeDeals.length > 0
      ? Math.min(...activeDeals.map((d) => d.deadline))
      : null;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Track deals where you are the client or the freelancer.
          </p>
        </div>

        {/* Skeleton loading */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={FileText}
          title="Failed to load deals"
          description="There was an error loading your deals. Please try again."
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Track deals where you are the client or the freelancer. See what
            will execute next on-chain.
          </p>
        </div>
        <Button onClick={() => navigate("/app/create")} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Deal
        </Button>
      </div>

      {/* Role toggle */}
      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        <Button
          variant={selectedRole === DealRole.CLIENT ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedRole(DealRole.CLIENT)}
        >
          As Client
        </Button>
        <Button
          variant={selectedRole === DealRole.FREELANCER ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedRole(DealRole.FREELANCER)}
        >
          As Freelancer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Deals"
          value={activeDeals.length}
          icon={FileText}
        />
        <StatCard
          title="Total Locked"
          value={formatMAS(totalLocked)}
          icon={Wallet}
        />
        <StatCard
          title="Next Auto Action"
          value={nextDeadline ? formatRelativeTime(nextDeadline) : "—"}
          icon={Clock}
        />
        <StatCard title="Completed (30d)" value={0} />
      </div>

      {/* Deals list */}
      {filteredDeals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No deals yet in this role"
          description={`You don't have any deals where you are the ${selectedRole.toLowerCase()}.`}
          actionLabel="Create your first SafeDeal"
          onAction={() => navigate("/app/create")}
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Deals</h2>

          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium">
                    Counterparty
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
                      <div className="flex items-center gap-2">
                        <Identicon address={deal.freelancerAddress} />
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
                  <div className="flex items-center gap-2">
                    <Identicon address={deal.freelancerAddress} size={32} />
                    <TruncatedAddress address={deal.freelancerAddress} />
                  </div>
                  <DealStatusBadge status={deal.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {formatMAS(deal.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <ModeBadge mode={deal.mode} />
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(deal.deadline)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
