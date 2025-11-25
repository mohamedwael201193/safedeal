import { ReactNode } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, AlertCircle } from "lucide-react";

interface WalletGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * WalletGuard component - restricts content to connected wallets only
 * Shows a connection prompt if wallet is not connected
 */
export function WalletGuard({ children, fallback }: WalletGuardProps) {
  const { isConnected, isLoading, connectWallet, wallets } = useWallet();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Detecting wallets...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Wallet Connection Required</h2>
            <p className="text-muted-foreground">
              Please connect your Massa wallet to access this feature
            </p>
          </div>

          {wallets.length === 0 && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm text-left">
                <p className="font-medium mb-1">No wallet detected</p>
                <p className="text-muted-foreground">
                  Please install MassaStation or Bearby to continue
                </p>
              </div>
            </div>
          )}

          <Button 
            size="lg" 
            className="w-full"
            onClick={() => connectWallet()}
            disabled={wallets.length === 0}
          >
            <Wallet className="h-4 w-4 mr-2" />
            {wallets.length === 0 ? "No Wallet Detected" : "Connect Wallet"}
          </Button>

          {wallets.length === 0 && (
            <div className="text-xs text-muted-foreground">
              <a 
                href="https://station.massa.net/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Install MassaStation
              </a>
              {" or "}
              <a 
                href="https://bearby.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Install Bearby
              </a>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
