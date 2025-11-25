import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMAS } from "@/lib/utils/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Identicon } from "@/components/domain/Identicon";
import { TruncatedAddress } from "@/components/domain/TruncatedAddress";
import { Wallet, ChevronDown, LogOut, RefreshCw, ExternalLink } from "lucide-react";

export function WalletButton() {
  const { 
    wallets, 
    selectedAccount, 
    isConnected, 
    isLoading,
    network,
    connectWallet, 
    disconnectWallet,
    accounts,
    selectAccount,
    refreshAccounts,
    balance,
  } = useWallet();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConnect = async (walletName: string) => {
    await connectWallet(walletName);
    setIsDialogOpen(false);
  };

  // Not connected state
  if (!isConnected || !selectedAccount) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2 hover-lift group" disabled={isLoading}>
            <Wallet className="h-4 w-4 group-hover:rotate-6 transition-transform" />
            {isLoading ? "Detecting wallets..." : "Connect Wallet"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Massa Wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to SafeDeal on Massa Mainnet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {wallets.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-sm text-muted-foreground">
                  No Massa wallets detected. Please install one of the following:
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => window.open("https://station.massa.net/", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Install MassaStation
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => window.open("https://bearby.io/", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Install Bearby
                  </Button>
                </div>
              </div>
            ) : (
              wallets.map((wallet) => {
                const walletName = wallet.name();
                return (
                  <Button
                    key={walletName}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => handleConnect(walletName)}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{walletName}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(walletName) === "MASSASTATION" ? "Massa's official wallet" : "Browser extension wallet"}
                      </p>
                    </div>
                  </Button>
                );
              })
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            By connecting, you agree to SafeDeal's terms of service
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Connected state
  const address = selectedAccount.address;

  return (
    <div className="flex items-center gap-2">
      {/* Network badge */}
      {network && (
        <Badge variant="outline" className="hidden sm:flex">
          {network}
        </Badge>
      )}

      {/* Account dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse-subtle" />
            <Identicon address={address} size={16} />
            <span className="font-mono text-xs hidden sm:inline">
              {address.slice(0, 4)}...{address.slice(-4)}
            </span>
            {typeof balance === "number" && (
              <span className="text-xs text-muted-foreground hidden md:inline">
                · {formatMAS(balance)} MAS
              </span>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <p className="text-xs text-muted-foreground">Connected Account</p>
              <div className="flex items-center gap-2">
                <Identicon address={address} size={24} />
                <TruncatedAddress 
                  address={address} 
                  prefixLength={6} 
                  suffixLength={4}
                  className="text-sm font-mono"
                />
              </div>
              {network && (
                <Badge variant="muted" className="w-fit text-xs">
                  {network}
                </Badge>
              )}
              {typeof balance === "number" && (
                <p className="text-xs text-muted-foreground">
                  Balance: {formatMAS(balance)} MAS
                </p>
              )}
            </div>
          </DropdownMenuLabel>

          {accounts.length > 1 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Switch Account
              </DropdownMenuLabel>
            {accounts.map((account) => {
              const accAddress = account.address;
              const isSelected = accAddress === address;
                return (
                  <DropdownMenuItem
                    key={accAddress}
                    onClick={() => selectAccount(accAddress)}
                    className={isSelected ? "bg-accent" : ""}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Identicon address={accAddress} size={20} />
                      <span className="font-mono text-xs flex-1">
                        {accAddress.slice(0, 6)}...{accAddress.slice(-4)}
                      </span>
                      {isSelected && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={refreshAccounts} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Accounts
          </DropdownMenuItem>

          <DropdownMenuItem onClick={disconnectWallet} className="gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
