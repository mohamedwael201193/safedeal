import { Outlet, Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { WalletButton } from "@/components/wallet/WalletButton";
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppShell() {

  const navItems = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard },
    { to: "/app/create", label: "Create Deal", icon: PlusCircle },
    { to: "/app/deals", label: "All Deals", icon: List },
    { to: "/app/help", label: "Help", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 transition-smooth hover:opacity-80">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow" />
            <span className="text-xl font-bold">SafeDeal</span>
          </Link>

          {/* Right side */}
          <WalletButton />
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex w-60 border-r border-border bg-card/50">
          <nav className="flex flex-col gap-1 p-4 w-full">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app"}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
                  "hover:bg-accent hover:text-accent-foreground"
                )}
                activeClassName="bg-accent text-accent-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex justify-around p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs transition-smooth",
                "hover:bg-accent hover:text-accent-foreground"
              )}
              activeClassName="bg-accent text-accent-foreground"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
