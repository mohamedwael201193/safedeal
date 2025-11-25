import { getWallets } from "@massalabs/wallet-provider";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

// Infer types from the library
type ProviderType = Awaited<ReturnType<typeof getWallets>>[number];
type AccountType = Awaited<ReturnType<ProviderType["accounts"]>>[number];

export interface WalletContextType {
  // Wallet state
  wallets: ProviderType[];
  selectedWallet: ProviderType | null;
  accounts: AccountType[];
  selectedAccount: AccountType | null;
  isConnected: boolean;
  isLoading: boolean;

  // Network info
  network: string | null;

  // Actions
  connectWallet: (walletName?: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  selectAccount: (address: string) => void;
  refreshAccounts: () => Promise<void>;
  balance: number | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<ProviderType[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<ProviderType | null>(
    null
  );
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountType | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [network, setNetwork] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  // Detect available wallets on mount and auto-reconnect
  useEffect(() => {
    const detectWallets = async () => {
      try {
        setIsLoading(true);
        const availableWallets = await getWallets();
        setWallets(availableWallets);

        if (availableWallets.length === 0) {
          console.log("No Massa wallets detected");
        } else {
          console.log(
            `Detected ${availableWallets.length} Massa wallet(s):`,
            availableWallets.map((w) => w.name()).join(", ")
          );

          // Auto-reconnect if there was a previous connection
          const savedWalletName = localStorage.getItem("safedeal_wallet");
          const savedAccountAddress = localStorage.getItem("safedeal_account");

          if (savedWalletName) {
            const wallet = availableWallets.find(
              (w) => w.name() === savedWalletName
            );
            if (wallet) {
              console.log(`Auto-reconnecting to ${savedWalletName}...`);
              // Try to reconnect silently
              try {
                setSelectedWallet(wallet);
                const walletAccounts = await wallet.accounts();
                setAccounts(walletAccounts);

                if (walletAccounts.length > 0) {
                  // Try to select the previously saved account
                  let activeAccount = walletAccounts[0];
                  if (savedAccountAddress) {
                    const savedAcc = walletAccounts.find(
                      (acc) => acc.address === savedAccountAddress
                    );
                    if (savedAcc) activeAccount = savedAcc;
                  }

                  setSelectedAccount(activeAccount);
                  setIsConnected(true);

                  // Fetch network and balance
                  const networkInfo = await wallet.networkInfos();
                  setNetwork(networkInfo.name);

                  const accountAny = activeAccount as any;
                  const rawBalance = await accountAny.balance();
                  const masBalance = Number(rawBalance) / 1e9;
                  setBalance(masBalance);

                  console.log(`Auto-reconnected to ${savedWalletName}`);
                }
              } catch (error) {
                console.error("Auto-reconnect failed:", error);
                // Clear saved data if auto-reconnect fails
                localStorage.removeItem("safedeal_wallet");
                localStorage.removeItem("safedeal_account");
              }
            }
          }
        }
      } catch (error) {
        console.error("Error detecting wallets:", error);
        toast.error("Failed to detect wallets");
      } finally {
        setIsLoading(false);
      }
    };

    detectWallets();
  }, []);

  // Fetch accounts from selected wallet
  const fetchAccounts = useCallback(
    async (wallet: ProviderType) => {
      try {
        const walletAccounts = await wallet.accounts();
        setAccounts(walletAccounts);

        // Determine active account and fetch balance
        if (walletAccounts.length > 0) {
          let activeAccount = walletAccounts[0];
          if (selectedAccount) {
            const existing = walletAccounts.find(
              (acc) => acc.address === selectedAccount.address
            );
            if (existing) {
              activeAccount = existing;
            }
          }
          setSelectedAccount(activeAccount);
          try {
            const accountAny = activeAccount as any;
            const rawBalance = await accountAny.balance(); // Returns bigint in nanoMAS
            // Convert nanoMAS to MAS: 1 MAS = 10^9 nanoMAS
            const masBalance = Number(rawBalance) / 1e9;
            setBalance(masBalance);
            console.log(`Balance: ${masBalance} MAS (${rawBalance} nanoMAS)`);
          } catch (error) {
            console.error("Error fetching balance:", error);
          }
        }

        return walletAccounts;
      } catch (error) {
        console.error("Error fetching accounts:", error);
        toast.error("Failed to fetch wallet accounts");
        return [];
      }
    },
    [selectedAccount]
  );

  // Fetch network info
  const fetchNetwork = useCallback(async (wallet: ProviderType) => {
    try {
      const networkInfo = await wallet.networkInfos();
      setNetwork(networkInfo.name);
    } catch (error) {
      console.error("Error fetching network info:", error);
    }
  }, []);

  // Connect to a wallet
  const connectWallet = useCallback(
    async (walletName?: string) => {
      try {
        setIsLoading(true);

        if (wallets.length === 0) {
          toast.error(
            "No Massa wallets detected. Please install MassaStation or Bearby."
          );
          return;
        }

        // Select wallet by name or use first available
        let wallet: ProviderType | null = null;
        if (walletName) {
          wallet = wallets.find((w) => w.name() === walletName) || null;
          if (!wallet) {
            toast.error(`Wallet "${walletName}" not found`);
            return;
          }
        } else {
          wallet = wallets[0];
        }
        // For most providers (MassaStation, Bearby), calling accounts() will
        // trigger the wallet UI and connection flow if needed.
        setSelectedWallet(wallet);

        // Fetch accounts and network info
        const walletAccounts = await fetchAccounts(wallet);
        await fetchNetwork(wallet);

        if (walletAccounts.length === 0) {
          toast.warning("No accounts found in wallet");
        } else {
          setIsConnected(true);

          // Save wallet connection to localStorage for auto-reconnect
          localStorage.setItem("safedeal_wallet", wallet.name());
          if (walletAccounts[0]) {
            localStorage.setItem("safedeal_account", walletAccounts[0].address);
          }

          toast.success(`Connected to ${wallet.name()}`);
        }

        // Set up listeners for Bearby
        if (typeof wallet.listenAccountChanges === "function") {
          wallet.listenAccountChanges((address: string) => {
            console.log("Account changed:", address);
            toast.info(
              `Switched to account ${address.slice(0, 6)}...${address.slice(
                -4
              )}`
            );
            fetchAccounts(wallet);
          });
        }

        if (typeof wallet.listenNetworkChanges === "function") {
          wallet.listenNetworkChanges((network: any) => {
            console.log("Network changed:", network);
            const networkName =
              typeof network === "string" ? network : network.name;
            setNetwork(networkName);
            toast.info(`Network switched to ${networkName}`);
          });
        }
      } catch (error: any) {
        console.error("Error connecting wallet:", error);
        toast.error(error?.message || "Failed to connect wallet");
      } finally {
        setIsLoading(false);
      }
    },
    [wallets, fetchAccounts, fetchNetwork]
  );

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      if (selectedWallet && typeof selectedWallet.disconnect === "function") {
        await selectedWallet.disconnect();
      }

      setSelectedWallet(null);
      setSelectedAccount(null);
      setAccounts([]);
      setIsConnected(false);
      setNetwork(null);
      setBalance(null);

      // Clear localStorage
      localStorage.removeItem("safedeal_wallet");
      localStorage.removeItem("safedeal_account");

      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  }, [selectedWallet]);

  // Select a specific account
  const selectAccount = useCallback(
    (address: string) => {
      const account = accounts.find((acc) => acc.address === address);
      if (account) {
        setSelectedAccount(account);
        localStorage.setItem("safedeal_account", address);
        toast.success(
          `Switched to ${address.slice(0, 6)}...${address.slice(-4)}`
        );
      }
    },
    [accounts]
  );

  // Refresh accounts list
  const refreshAccounts = useCallback(async () => {
    if (selectedWallet) {
      await fetchAccounts(selectedWallet);
    }
  }, [selectedWallet, fetchAccounts]);

  const value: WalletContextType = {
    wallets,
    selectedWallet,
    accounts,
    selectedAccount,
    isConnected,
    isLoading,
    network,
    connectWallet,
    disconnectWallet,
    selectAccount,
    refreshAccounts,
    balance,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
