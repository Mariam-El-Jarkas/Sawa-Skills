import { apiGet } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HomeStats {
  // Authenticated
  swapCount?: number;
  connectionCount?: number;
  avgRating?: number;
  // Guest
  totalSkills?: number;
  totalMembers?: number;
  totalCities?: number;
  isAuthenticated: boolean;
}

export interface TrendingSkill {
  name: string;
  swapCount: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const homeService = {
  getStats(token?: string | null): Promise<HomeStats> {
    return apiGet<HomeStats>('/api/home/stats', token);
  },

  getTrending(): Promise<TrendingSkill[]> {
    return apiGet<TrendingSkill[]>('/api/home/trending');
  },
};
