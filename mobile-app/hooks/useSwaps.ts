import { useState, useCallback } from 'react';
import { swapsService, Swap, CreateSwapData, RatingData } from '../services/swapsService';
import { useAuth } from '../contexts/AuthContext';

export type SwapFilter = 'all' | 'pending' | 'active' | 'completed' | 'rejected';

export function filterSwaps(swaps: Swap[], filter: SwapFilter): Swap[] {
  if (filter === 'all') return swaps;
  if (filter === 'pending') return swaps.filter(s => s.status === 'pending');
  if (filter === 'rejected') return swaps.filter(s => s.status === 'rejected');
  if (filter === 'active') return swaps.filter(s => s.status === 'active' && !s.isFinished);
  if (filter === 'completed') return swaps.filter(s => s.status === 'completed' || (s.status === 'active' && s.isFinished));
  return swaps;
}

interface SwapsState {
  swaps: Swap[];
  isLoading: boolean;
  error: string | null;
}

interface SwapsActions {
  fetchSwaps: (status?: string) => Promise<void>;
  createSwap: (data: CreateSwapData) => Promise<void>;
  acceptSwap: (id: number) => Promise<void>;
  rejectSwap: (id: number) => Promise<void>;
  markFinished: (id: number) => Promise<void>;
  rateSwap: (id: number, data: RatingData) => Promise<void>;
}

export function useSwaps(): SwapsState & SwapsActions {
  const { token } = useAuth();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSwaps = useCallback(async (status?: string) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await swapsService.getMySwaps(token, status);
      setSwaps(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load swaps');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const createSwap = useCallback(async (data: CreateSwapData) => {
    if (!token) throw new Error('Not logged in');
    const created = await swapsService.createSwap(data, token);
    setSwaps(prev => [created, ...prev]);
  }, [token]);

  const acceptSwap = useCallback(async (id: number) => {
    if (!token) throw new Error('Not logged in');
    const updated = await swapsService.acceptSwap(id, token);
    setSwaps(prev => prev.map(s => s.id === id ? updated : s));
  }, [token]);

  const rejectSwap = useCallback(async (id: number) => {
    if (!token) throw new Error('Not logged in');
    await swapsService.rejectSwap(id, token);
    setSwaps(prev => prev.filter(s => s.id !== id));
  }, [token]);

  const markFinished = useCallback(async (id: number) => {
    if (!token) throw new Error('Not logged in');
    const updated = await swapsService.markFinished(id, token);
    setSwaps(prev => prev.map(s => s.id === id ? updated : s));
  }, [token]);

  const rateSwap = useCallback(async (id: number, data: RatingData) => {
    if (!token) throw new Error('Not logged in');
    await swapsService.rateSwap(id, data, token);
    // UI will hide the rate button based on hasRated flag from server-synced state
    setSwaps(prev => prev.map(s => s.id === id ? { ...s, hasRated: true } : s));
  }, [token]);

  return { swaps, isLoading, error, fetchSwaps, createSwap, acceptSwap, rejectSwap, markFinished, rateSwap };
}
