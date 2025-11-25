import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Wallet,
  Clock,
  ArrowRight
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Help & About</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about SafeDeal
        </p>
      </div>

      {/* What is SafeDeal */}
      <Card className="p-8 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">What is SafeDeal?</h2>
        </div>
        
        <p className="text-muted-foreground leading-relaxed">
          SafeDeal is an <strong>autonomous escrow system</strong> built on the Massa Mainnet blockchain. 
          It allows freelancers and clients to work together with confidence by locking funds in a smart 
          contract that automatically executes based on pre-defined rules.
        </p>

        <p className="text-muted-foreground leading-relaxed">
          Unlike traditional escrow services that require manual intervention, SafeDeal operates entirely 
          on-chain. Once you create a deal and set the rules, the smart contract enforces them 
          automatically—no third party can interfere or change the outcome.
        </p>
      </Card>

      {/* How it protects both sides */}
      <Card className="p-8 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">How SafeDeal protects both sides</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Client protections */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Badge variant="default">For Clients</Badge>
            </h3>
            <ul className="space-y-2">
              {[
                "Funds locked until work is approved or deadline passes",
                "Can choose auto-refund mode if freelancer doesn't deliver",
                "No risk of losing funds to unresponsive freelancers",
                "Transparent on-chain rules you can verify",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Freelancer protections */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Badge variant="success">For Freelancers</Badge>
            </h3>
            <ul className="space-y-2">
              {[
                "Payment guaranteed when deadline arrives (in auto-release mode)",
                "No risk of client disappearing without paying",
                "Can't be scammed by malicious clients",
                "Work with confidence knowing payment is secured",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* What happens at deadline */}
      <Card className="p-8 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">What happens at the deadline?</h2>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          SafeDeal offers two modes that determine what happens if nobody takes action by the deadline:
        </p>

        <div className="space-y-4 mt-6">
          <div className="p-4 rounded-lg bg-success/5 border border-success/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-success" />
              Auto-release mode
            </h3>
            <p className="text-sm text-muted-foreground">
              At the deadline, funds <strong>automatically release to the freelancer</strong>. This is ideal 
              when you trust the freelancer to deliver and want to ensure they get paid even if you're 
              unavailable to approve.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-warning" />
              Auto-refund mode
            </h3>
            <p className="text-sm text-muted-foreground">
              At the deadline, funds <strong>automatically return to the client</strong>. This is useful 
              when you want the freelancer to proactively prove completion before getting paid.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            <strong>Important:</strong> Before the deadline, the client can always approve early to release 
            funds immediately, or raise a dispute if there's an issue.
          </p>
        </div>
      </Card>

      {/* Limitations */}
      <Card className="p-8 space-y-4 bg-warning/5 border-warning/20">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-warning" />
          <h2 className="text-2xl font-bold">Limitations & disclaimers</h2>
        </div>

        <ul className="space-y-3">
          {[
            "SafeDeal is not legal advice. Consult a lawyer for legal guidance on contracts.",
            "Version 1 does not include off-chain arbitration. Disputes must be resolved between parties.",
            "Transactions on Massa Mainnet cost real MAS and transaction fees.",
            "Smart contract actions are irreversible. Double-check addresses and amounts before confirming.",
            "SafeDeal is experimental software. Use at your own risk.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* How to try SafeDeal */}
      <Card className="p-8 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">How to try SafeDeal</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Install a Massa-compatible wallet",
              description: "You'll need a wallet that supports Massa Mainnet (e.g., Massa Station, Bearby).",
            },
            {
              step: "2",
              title: "Get some MAS on mainnet",
              description: "Purchase or transfer MAS tokens to your wallet. You'll need them for deal amounts and gas fees.",
            },
            {
              step: "3",
              title: "Connect your wallet",
              description: "Click 'Connect Wallet' in the top right of the SafeDeal dApp.",
            },
            {
              step: "4",
              title: "Create a small SafeDeal",
              description: "Test with a small amount and short deadline (e.g., 1 hour) to see autonomous execution in action.",
            },
            {
              step: "5",
              title: "Observe automatic resolution",
              description: "Watch as the contract automatically executes your chosen outcome at the deadline.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                {item.step}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
