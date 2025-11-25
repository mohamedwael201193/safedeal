import { useCallback, useEffect, useState } from "react";
import { useWallet } from "../../contexts/WalletContext";
import { useToast } from "../../hooks/use-toast";
import { Deal, DealMode } from "../../types/deal";
import { calculateDeadlineSlot, createPublicClient } from "./client";
import {
  approveAndRelease as approveAndReleaseContract,
  createDeal as createDealContract,
  getDeal,
  getDealsByClient,
  getDealsByFreelancer,
  getUserDeals,
  raiseDispute as raiseDisputeContract,
} from "./contract";

/**
 * React hooks for SafeDeal contract interactions
 */

// ============================================================================
// FETCH HOOKS
// ============================================================================

/**
 * Hook to fetch a single deal by ID
 */
export function useDeal(dealId: string | undefined) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dealId) {
      setLoading(false);
      return;
    }

    const fetchDeal = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getDeal(parseInt(dealId));
        setDeal(result);
      } catch (err: any) {
        setError(err.message || "Failed to fetch deal");
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [dealId]);

  return { deal, loading, error };
}

/**
 * Hook to fetch all deals for the connected user
 */
export function useUserDeals() {
  const { selectedAccount } = useWallet();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!selectedAccount) {
      setDeals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userAddress = await selectedAccount.address();
      const result = await getUserDeals(userAddress);
      setDeals(result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { deals, loading, error, refresh };
}

/**
 * Hook to fetch deals where user is client
 */
export function useClientDeals() {
  const { selectedAccount } = useWallet();
  const [dealIds, setDealIds] = useState<number[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!selectedAccount) {
      setDeals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userAddress = await selectedAccount.address();
      const ids = await getDealsByClient(userAddress);
      setDealIds(ids);

      // Fetch full deal data
      const dealsData = await Promise.all(ids.map((id) => getDeal(id)));
      setDeals(dealsData.filter((d): d is Deal => d !== null));
    } catch (err: any) {
      setError(err.message || "Failed to fetch client deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { deals, dealIds, loading, error, refresh };
}

/**
 * Hook to fetch deals where user is freelancer
 */
export function useFreelancerDeals() {
  const { selectedAccount } = useWallet();
  const [dealIds, setDealIds] = useState<number[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!selectedAccount) {
      setDeals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userAddress = await selectedAccount.address();
      const ids = await getDealsByFreelancer(userAddress);
      setDealIds(ids);

      // Fetch full deal data
      const dealsData = await Promise.all(ids.map((id) => getDeal(id)));
      setDeals(dealsData.filter((d): d is Deal => d !== null));
    } catch (err: any) {
      setError(err.message || "Failed to fetch freelancer deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { deals, dealIds, loading, error, refresh };
}

// ============================================================================
// WRITE HOOKS
// ============================================================================

/**
 * Hook to create a new deal
 */
export function useCreateDeal() {
  const { selectedWallet } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createDeal = useCallback(
    async (params: {
      freelancerAddress: string;
      amount: string;
      deadlineHours: number;
      mode: DealMode;
      note?: string;
    }) => {
      if (!selectedWallet) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return { success: false };
      }

      try {
        setLoading(true);

        // Calculate deadline slot
        const client = createPublicClient();
        const deadlineSlot = await calculateDeadlineSlot(
          client,
          params.deadlineHours
        );

        // Create deal
        const result = await createDealContract(selectedWallet, {
          freelancerAddress: params.freelancerAddress,
          amount: params.amount,
          deadlineSlot,
          mode: params.mode,
          note: params.note,
        });

        if (result.success) {
          toast({
            title: "Deal created!",
            description: `Deal #${result.dealId} has been created successfully.`,
          });
        } else {
          toast({
            title: "Failed to create deal",
            description: result.error || "Unknown error",
            variant: "destructive",
          });
        }

        return result;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create deal",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [selectedWallet, toast]
  );

  return { createDeal, loading };
}

/**
 * Hook to approve and release a deal
 */
export function useApproveAndRelease() {
  const { selectedWallet } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const approve = useCallback(
    async (dealId: number) => {
      if (!selectedWallet) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return { success: false };
      }

      try {
        setLoading(true);

        const result = await approveAndReleaseContract(selectedWallet, dealId);

        if (result.success) {
          toast({
            title: "Deal approved!",
            description: "Funds have been released to the freelancer.",
          });
        } else {
          toast({
            title: "Failed to approve deal",
            description: result.error || "Unknown error",
            variant: "destructive",
          });
        }

        return result;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to approve deal",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [selectedWallet, toast]
  );

  return { approve, loading };
}

/**
 * Hook to raise a dispute
 */
export function useRaiseDispute() {
  const { selectedWallet } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const dispute = useCallback(
    async (dealId: number) => {
      if (!selectedWallet) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet first",
          variant: "destructive",
        });
        return { success: false };
      }

      try {
        setLoading(true);

        const result = await raiseDisputeContract(selectedWallet, dealId);

        if (result.success) {
          toast({
            title: "Dispute raised",
            description: "The deal has been marked as disputed.",
            variant: "warning",
          });
        } else {
          toast({
            title: "Failed to raise dispute",
            description: result.error || "Unknown error",
            variant: "destructive",
          });
        }

        return result;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to raise dispute",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [selectedWallet, toast]
  );

  return { dispute, loading };
}
