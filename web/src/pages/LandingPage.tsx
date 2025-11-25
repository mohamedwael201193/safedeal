import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/domain/CountdownTimer";
import { 
  Shield, 
  Clock, 
  Scale, 
  Globe,
  ArrowRight,
  Code,
  Palette,
  Bug,
  Coins,
  CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  // Mock data for the visual card
  const mockDeadline = Date.now() + 7183000; // ~2 hours from now

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow" />
            <span className="text-xl font-bold">SafeDeal</span>
          </div>
          <Link to="/app">
            <Button size="sm">Launch dApp</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="space-y-6 animate-slide-up">
            <Badge variant="outline" className="w-fit">
              <Globe className="h-3 w-3" />
              On Massa Mainnet
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              On-chain escrow that protects{" "}
              <span className="text-gradient-primary">freelancers & clients</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl">
              Lock MAS in a smart contract on Massa Mainnet, set a deadline, and let SafeDeal 
              automatically pay or refund—even if someone disappears.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/app">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Launch dApp
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => scrollToSection("how-it-works")}
              >
                How SafeDeal works
              </Button>
            </div>
          </div>

          {/* Right: Visual card */}
          <div className="relative animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <Card className="p-6 hover-lift bg-gradient-to-br from-card to-card/50">
              <div className="space-y-4">
                {/* Parties */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20" />
                    <span className="text-muted-foreground">Client</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">SafeDeal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Freelancer</span>
                    <div className="h-8 w-8 rounded-full bg-success/20" />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge variant="default">ACTIVE</Badge>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">Auto-release in</span>
                </div>

                {/* Countdown */}
                <div className="flex items-center justify-center py-6">
                  <CountdownTimer targetTimestamp={mockDeadline} />
                </div>

                {/* Amount */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Locked amount</p>
                  <p className="text-2xl font-bold">50 MAS</p>
                </div>

                {/* Progress ring visual */}
                <div className="flex justify-center">
                  <div className="relative h-24 w-24">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="8"
                        strokeDasharray="283"
                        strokeDashoffset="70"
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Shield,
              title: "Trustless funds lock",
              description: "Funds are held by a Massa smart contract, not by us.",
            },
            {
              icon: Clock,
              title: "Autonomous deadlines",
              description: "SafeDeal executes your rules on-chain at the deadline.",
            },
            {
              icon: Scale,
              title: "No middleman",
              description: "No support tickets, no arbitration desk—just code and clear rules.",
            },
            {
              icon: Globe,
              title: "DeWeb-native frontend",
              description: "Interface is deployed on Massa DeWeb for censorship-resistant access.",
            },
          ].map((benefit, i) => (
            <Card 
              key={benefit.title} 
              className="p-6 hover-lift animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How SafeDeal works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to secure your freelance deal on-chain
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Create a SafeDeal",
              description: "Define both parties, lock MAS, and set deadline and behavior if no one acts.",
            },
            {
              step: "2",
              title: "Deliver work off-chain",
              description: "Freelancer delivers however they prefer; client can approve at any time.",
            },
            {
              step: "3",
              title: "Contract enforces the outcome",
              description: "At deadline, SafeDeal automatically pays or refunds based on your chosen mode.",
            },
          ].map((step, i) => (
            <div 
              key={step.step} 
              className="relative animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                  {step.step}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-border -translate-x-1/2" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Perfect for</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Code,
              title: "Freelance development",
              description: "Secure payments for code, features, or bug fixes.",
            },
            {
              icon: Palette,
              title: "Design gigs",
              description: "Protect designers and clients during creative work.",
            },
            {
              icon: Bug,
              title: "Security audits",
              description: "Lock bounty funds until vulnerability is verified.",
            },
            {
              icon: Coins,
              title: "DAO bounties",
              description: "Automated contributor payments with transparent rules.",
            },
          ].map((useCase, i) => (
            <Card 
              key={useCase.title} 
              className="p-6 hover-lift animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <useCase.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">{useCase.title}</h3>
              <p className="text-sm text-muted-foreground">{useCase.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick test */}
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <Card className="p-8 lg:p-12 bg-gradient-to-br from-card to-card/50">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl lg:text-3xl font-bold">Try a SafeDeal in a few minutes</h2>
            <p className="text-muted-foreground">
              Test the autonomous escrow system with a short deadline
            </p>

            <div className="grid sm:grid-cols-3 gap-6 text-left mt-8">
              {[
                "Connect your Massa wallet",
                "Create a small SafeDeal with a short deadline",
                "Watch it auto-complete on its own",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>

            <Link to="/app">
              <Button size="lg" className="mt-4">
                Launch dApp
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary-glow" />
                <span className="font-bold">SafeDeal</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Autonomous escrow built on the Massa Mainnet. Frontend is DeWeb-ready and served as a static site.
              </p>
            </div>

            <div className="flex gap-6 text-sm">
              <Link to="/app" className="text-muted-foreground hover:text-foreground transition-smooth">
                dApp
              </Link>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
                GitHub
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">
                Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
