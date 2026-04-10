import { useState, useEffect, useCallback } from 'react';
import { homeService, HomeStats, TrendingSkill } from '../services/homeService';
import { useAuth } from '../contexts/AuthContext';

interface HomeData {
  stats: HomeStats | null;
  trending: TrendingSkill[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useHomeData(): HomeData {
  const { token } = useAuth();
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [trending, setTrending] = useState<TrendingSkill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, trendingData] = await Promise.all([
        homeService.getStats(token),
        homeService.getTrending(),
      ]);
      setStats(statsData);
      setTrending(trendingData);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load home data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token !== undefined) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { stats, trending, isLoading, error, refresh };
}
