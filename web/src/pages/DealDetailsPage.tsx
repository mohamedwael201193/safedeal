import { CountdownTimer } from "@/components/domain/CountdownTimer";
import { DealStatusBadge } from "@/components/domain/DealStatusBadge";
import { EmptyState } from "@/components/domain/EmptyState";
import { Identicon } from "@/components/domain/Identicon";
import { ModeBadge } from "@/components/domain/ModeBadge";
import { TruncatedAddress } from "@/components/domain/TruncatedAddress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/contexts/WalletContext";
import {
  approveAndRelease,
  getDeal,
  processDeal,
  raiseDispute,
} from "@/lib/massa/contract";
import { formatDateTime, formatMAS } from "@/lib/utils/format";
import { Deal, DealMode, DealStatus } from "@/types/deal";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileX } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function DealDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedAccount } = useWallet();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  // Fetch deal details
  useEffect(() => {
    const fetchDeal = async () => {
      if (!id) {
        setError("No deal ID provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetchedDeal = await getDeal(parseInt(id));
        setDeal(fetchedDeal);
      } catch (err) {
        console.error("Failed to fetch deal:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch deal");
        toast.error("Failed to load deal");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeal();
  }, [id]);

  const handleApprove = async () => {
    if (!deal || !selectedAccount) return;

    setIsActing(true);
    try {
      await approveAndRelease(deal.id);
      toast.success("Funds released to freelancer!");
      // Refresh deal
      const updatedDeal = await getDeal(deal.id);
      setDeal(updatedDeal);
    } catch (err) {
      console.error("Failed to approve:", err);
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setIsActing(false);
    }
  };

  const handleDispute = async () => {
    if (!deal || !selectedAccount) return;

    setIsActing(true);
    try {
      await raiseDispute(deal.id);
      toast.success("Dispute raised!");
      // Refresh deal
      const updatedDeal = await getDeal(deal.id);
      setDeal(updatedDeal);
    } catch (err) {
      console.error("Failed to raise dispute:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to raise dispute"
      );
    } finally {
      setIsActing(false);
    }
  };

  const handleProcessDeal = async () => {
    if (!deal || !selectedAccount) return;

    setIsActing(true);
    try {
      const result = await processDeal(
        selectedAccount.provider,
        parseInt(deal.id)
      );
      if (result.success) {
        toast.success("Deal processed successfully!");
        // Refresh deal
        const updatedDeal = await getDeal(parseInt(deal.id));
        setDeal(updatedDeal);
      } else {
        toast.error(result.error || "Failed to process deal");
      }
    } catch (err) {
      console.error("Failed to process deal:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to process deal"
      );
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-64 rounded-lg bg-card animate-pulse" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/app")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <EmptyState
          icon={FileX}
          title="Deal not found"
          description="We couldn't find this SafeDeal. It may not exist or you may not have permission to view it."
          actionLabel="Go to Dashboard"
          onAction={() => navigate("/app")}
        />
      </div>
    );
  }

  const isActive = deal.status === DealStatus.ACTIVE;
  const isCompleted = [
    DealStatus.COMPLETED,
    DealStatus.REFUNDED,
    DealStatus.EXPIRED,
  ].includes(deal.status);
  const isClient = selectedAccount?.address === deal.client;
  const isFreelancer = selectedAccount?.address === deal.freelancer;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate("/app")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">SafeDeal #{deal.id}</h1>
          {deal.note && <p className="text-muted-foreground">{deal.note}</p>}
        </div>
        <div className="flex items-center gap-2">
          <DealStatusBadge status={deal.status} />
          <ModeBadge mode={deal.mode} />
        </div>
      </div>

      {/* Countdown Section */}
      {isActive && (
        <Card className="p-8 bg-gradient-to-br from-card to-card/50">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              {deal.mode === DealMode.AUTO_RELEASE
                ? "Auto-releases to freelancer at deadline if nobody acts"
                : "Auto-refunds to client at deadline if nobody acts"}
            </p>
            <CountdownTimer
              targetTimestamp={deal.deadline}
              className="text-4xl"
            />
            <p className="text-sm text-muted-foreground">
              {formatDateTime(deal.deadline)}
            </p>
          </div>
        </Card>
      )}

      {isCompleted && (
        <Card className="p-6 bg-muted/50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <p className="font-medium">
                {deal.status === DealStatus.COMPLETED && "Deal completed"}
                {deal.status === DealStatus.REFUNDED &&
                  "Funds refunded to client"}
                {deal.status === DealStatus.EXPIRED && "Deal expired"}
              </p>
              <p className="text-sm text-muted-foreground">
                {deal.completedAt && `on ${formatDateTime(deal.completedAt)}`}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Deal Information */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Parties</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Client</span>
                <div className="flex items-center gap-2">
                  <Identicon address={deal.clientAddress} />
                  <TruncatedAddress address={deal.clientAddress} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">
                  Freelancer
                </span>
                <div className="flex items-center gap-2">
                  <Identicon address={deal.freelancerAddress} />
                  <TruncatedAddress address={deal.freelancerAddress} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Financials</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{formatMAS(deal.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token</span>
                <span className="font-semibold">{deal.token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-semibold">
                  {formatDateTime(deal.createdAt)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Rules</h2>

            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm">
                  {deal.mode === DealMode.AUTO_RELEASE
                    ? "At the deadline, if no action has been taken, funds will automatically be released to the freelancer."
                    : "At the deadline, if no action has been taken, funds will automatically be refunded to the client."}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                This logic is enforced by the Massa smart contract. No
                centralized party can override it.
              </p>
            </div>
          </Card>
        </div>

        {/* Right: Actions & Timeline */}
        <div className="space-y-6">
          {isActive && (
            <Card className="p-6 space-y-4">
              <h2 className="font-semibold">Actions</h2>

              {/* Show actions based on user role */}
              <div className="space-y-2">
                {/* If deadline has passed, show Process Deal button */}
                {Date.now() > deal.deadline && (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    variant="default"
                    onClick={handleProcessDeal}
                    disabled={isActing}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isActing
                      ? "Processing..."
                      : "Trigger Auto-" +
                        (deal.mode === DealMode.AUTO_RELEASE
                          ? "Release"
                          : "Refund")}
                  </Button>
                )}

                {isClient && Date.now() <= deal.deadline && (
                  <>
                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleApprove}
                      disabled={isActing}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isActing ? "Processing..." : "Approve & release now"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleDispute}
                      disabled={isActing}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      {isActing ? "Processing..." : "Open dispute"}
                    </Button>
                  </>
                )}
                {isFreelancer && Date.now() <= deal.deadline && (
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleDispute}
                    disabled={isActing}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {isActing ? "Processing..." : "Open dispute"}
                  </Button>
                )}
                {!isClient && !isFreelancer && Date.now() <= deal.deadline && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    You are not a party to this deal
                  </p>
                )}
              </div>

              {Date.now() > deal.deadline && (
                <div className="space-y-2">
                  <p className="text-xs text-green-500 text-center bg-green-500/10 p-3 rounded font-medium">
                    ✅ Deferred call should have executed automatically. If not,
                    click "Trigger Auto-
                    {deal.mode === DealMode.AUTO_RELEASE ? "Release" : "Refund"}
                    " above.
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Note: Deferred calls provide GUARANTEED execution at exact
                    slot (1.0 MAS booking fee). Manual trigger available if
                    needed.
                  </p>
                </div>
              )}
              {Date.now() <= deal.deadline && (
                <div className="space-y-2">
                  <p className="text-xs text-primary text-center bg-primary/10 p-3 rounded font-medium">
                    ✅ GUARANTEED execution booked via deferred call (1.0 MAS)
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Contract will execute automatically at EXACT deadline slot.
                    100% reliable - no manual action needed.
                  </p>
                </div>
              )}
            </Card>
          )}

          {isCompleted && (
            <Card className="p-6 space-y-4 bg-muted/50">
              <h2 className="font-semibold">Deal settled</h2>
              <p className="text-sm text-muted-foreground">
                This deal has been settled on-chain. No further actions are
                available.
              </p>
            </Card>
          )}

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Timeline</h2>

            <div className="space-y-4">
              {[
                {
                  label: "Deal created",
                  time: deal.createdAt,
                  completed: true,
                },
                {
                  label: "Funds locked",
                  time: deal.createdAt,
                  completed: true,
                },
                { label: "Awaiting action", time: null, completed: false },
              ].map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        event.completed ? "bg-primary" : "bg-muted"
                      }`}
                    />
                    {i < 2 && <div className="w-px h-full bg-border mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">{event.label}</p>
                    {event.time && (
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.time)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
