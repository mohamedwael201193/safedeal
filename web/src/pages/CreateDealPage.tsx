import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WalletGuard } from "@/components/wallet/WalletGuard";
import { useWallet } from "@/contexts/WalletContext";
import { masToNano, USDCE_TOKEN_ADDRESS } from "@/lib/massa/client";
import { createDealForMAS, createDealForToken } from "@/lib/massa/contract";
import { cn } from "@/lib/utils";
import { formatMAS, formatRelativeTime } from "@/lib/utils/format";
import { DealMode } from "@/types/deal";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function CreateDealPage() {
  const navigate = useNavigate();
  const { selectedAccount, selectedWallet } = useWallet();

  const [tokenType, setTokenType] = useState<"MAS" | "USDC">("MAS");
  const [freelancerAddress, setFreelancerAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [mode, setMode] = useState<DealMode>(DealMode.AUTO_RELEASE);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate Massa address format (AU or AS prefix + base58)
  const isValidAddress =
    freelancerAddress.length === 0 ||
    /^(AU|AS)[1-9A-HJ-NP-Za-km-z]{48,50}$/.test(freelancerAddress);
  const isValidAmount = amount.length === 0 || parseFloat(amount) > 0;
  const canSubmit =
    isValidAddress &&
    isValidAmount &&
    freelancerAddress &&
    amount &&
    duration &&
    !isSubmitting;

  const durationPresets = [
    { label: "5 minutes", hours: 5 / 60 },
    { label: "1 hour", hours: 1 },
    { label: "1 day", hours: 24 },
    { label: "3 days", hours: 72 },
    { label: "7 days", hours: 168 },
  ];

  const handleSubmit = async () => {
    if (!canSubmit || !selectedAccount || !selectedWallet) {
      toast.error("Please fill all required fields and connect wallet");
      return;
    }

    setIsSubmitting(true);
    try {
      const deadlineMs = Date.now() + duration! * 3600000;

      let result;
      if (tokenType === "MAS") {
        const amountMAS = masToNano(amount);
        result = await createDealForMAS(selectedWallet, {
          freelancerAddress,
          amountMAS,
          deadlineMs,
          mode,
          note: note || undefined,
        });
      } else {
        // USDC.e: 6 decimals
        const amountUSDC = BigInt(Math.floor(parseFloat(amount) * 1e6));
        result = await createDealForToken(selectedWallet, {
          freelancerAddress,
          tokenAddress: USDCE_TOKEN_ADDRESS,
          amount: amountUSDC,
          deadlineMs,
          mode,
          note: note || undefined,
        });
      }

      if (result.success) {
        toast.success(
          `Deal created successfully! ID: ${result.dealId || "pending"}`
        );
        navigate("/app/deals");
      } else {
        toast.error(result.error || "Failed to create deal");
      }
    } catch (error) {
      console.error("Failed to create deal:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create deal"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deadline = duration ? Date.now() + duration * 3600000 : null;

  return (
    <WalletGuard>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Create SafeDeal</h1>
          <p className="text-muted-foreground">
            Set up an autonomous escrow with clear rules and automatic
            execution.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Parties */}
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="font-semibold mb-4">Parties</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="freelancer">Freelancer address</Label>
                <Input
                  id="freelancer"
                  placeholder="AS1234..."
                  value={freelancerAddress}
                  onChange={(e) => setFreelancerAddress(e.target.value)}
                  className={cn(!isValidAddress && "border-destructive")}
                />
                <p className="text-xs text-muted-foreground">
                  The Massa address that will receive funds if the deal
                  completes.
                </p>
                {!isValidAddress && (
                  <p className="text-xs text-destructive">
                    Invalid Massa address format
                  </p>
                )}
              </div>
            </Card>

            {/* Asset & Amount */}
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="font-semibold mb-4">Asset & amount</h2>
              </div>

              <div className="space-y-2">
                <Label>Token</Label>
                <div className="flex gap-2">
                  <Badge
                    variant={tokenType === "MAS" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setTokenType("MAS")}
                  >
                    MAS
                  </Badge>
                  <Badge
                    variant={tokenType === "USDC" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setTokenType("USDC")}
                  >
                    USDC.e
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder={tokenType === "MAS" ? "50" : "100"}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={cn(!isValidAmount && "border-destructive")}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {tokenType === "MAS" ? "MAS" : "USDC.e"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  For example: {tokenType === "MAS" ? "50 MAS" : "100 USDC.e"}
                </p>
              </div>
            </Card>

            {/* Time & Automation */}
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="font-semibold mb-4">Time & automation</h2>
              </div>

              <div className="space-y-2">
                <Label>Deadline</Label>
                <div className="grid grid-cols-2 gap-2">
                  {durationPresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant={
                        duration === preset.hours ? "default" : "outline"
                      }
                      onClick={() => setDuration(preset.hours)}
                      className="w-full"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>GUARANTEED autonomous execution:</strong> Contract
                  books exact execution slot with 1.0 MAS reserve (deferred
                  calls). Execution happens automatically at exact deadline - NO
                  manual trigger needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mode</Label>
                <div className="space-y-2">
                  <button
                    onClick={() => setMode(DealMode.AUTO_RELEASE)}
                    className={cn(
                      "w-full p-4 rounded-lg border transition-smooth text-left",
                      mode === DealMode.AUTO_RELEASE
                        ? "border-success bg-success/5"
                        : "border-border hover:border-success/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <ArrowDownToLine className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium">
                          Auto-release to freelancer
                        </p>
                        <p className="text-sm text-muted-foreground">
                          If nobody acts by the deadline, funds automatically go
                          to the freelancer.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setMode(DealMode.AUTO_REFUND)}
                    className={cn(
                      "w-full p-4 rounded-lg border transition-smooth text-left",
                      mode === DealMode.AUTO_REFUND
                        ? "border-warning bg-warning/5"
                        : "border-border hover:border-warning/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <ArrowUpFromLine className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium">Auto-refund to client</p>
                        <p className="text-sm text-muted-foreground">
                          If nobody acts by the deadline, funds automatically
                          return to you.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </Card>

            {/* Optional Note */}
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="font-semibold mb-4">Optional note</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Deal note (off-chain context only)</Label>
                <Textarea
                  id="note"
                  placeholder="E.g., Website redesign project"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  For your own reference; not stored on-chain in v1.
                </p>
              </div>
            </Card>

            {/* Submit */}
            <Button
              size="lg"
              className="w-full"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {isSubmitting
                ? "Creating deal..."
                : "Create SafeDeal & lock funds"}
            </Button>
          </div>

          {/* Right: Summary & Safety */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-6 space-y-4 sticky top-6">
              <h2 className="font-semibold">Deal summary</h2>

              {/* Diagram */}
              <div className="flex items-center justify-between text-sm py-4">
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">You</p>
                  <p className="text-xs font-medium">(Client)</p>
                </div>
                <div className="flex-1 h-px bg-border mx-4" />
                <div className="text-center">
                  <div className="text-xs font-mono bg-muted px-2 py-1 rounded mb-2">
                    SafeDeal
                  </div>
                </div>
                <div className="flex-1 h-px bg-border mx-4" />
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-success/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Freelancer</p>
                </div>
              </div>

              {/* Key info */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {amount ? formatMAS(amount) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Execution Reserve
                  </span>
                  <span className="font-semibold text-primary">1.0 MAS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Required</span>
                  <span className="font-bold">
                    {amount ? formatMAS(parseFloat(amount) + 1.0) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-semibold">
                    {deadline ? formatRelativeTime(deadline) : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">If no one acts</span>
                  <span className="font-semibold">
                    {mode === DealMode.AUTO_RELEASE
                      ? "Auto-release"
                      : "Auto-refund"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Safety note */}
            <Card className="p-6 space-y-4 bg-warning/5 border-warning/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold">Safety reminder</h3>
                  <p className="text-sm text-muted-foreground">
                    Double-check the address and amount. On-chain actions are
                    irreversible.
                  </p>
                </div>
              </div>
            </Card>

            {/* What happens next */}
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold">What happens next?</h3>
              <div className="space-y-3">
                {[
                  { label: "Now", text: "Funds are locked in SafeDeal" },
                  {
                    label: "Before deadline",
                    text: "Client can approve / dispute",
                  },
                  {
                    label: "At deadline",
                    text: "Contract executes outcome automatically",
                  },
                ].map((step) => (
                  <div key={step.label} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </WalletGuard>
  );
}
