import { apiGet, apiPatch } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HomeStats {
  // Authenticated
  swapCount?: number;
  connectionCount?: number;
  avgRating?: number;
  userCity?: string | null;
  pendingSwapCount?: number;
  activeSwapCount?: number;
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

export interface LocationItem {
  id: number;
  city: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const homeService = {
  getStats(token?: string | null): Promise<HomeStats> {
    return apiGet<HomeStats>('/api/home/stats', token);
  },

  getTrending(): Promise<TrendingSkill[]> {
    return apiGet<TrendingSkill[]>('/api/home/trending');
  },

  getLocations(token: string): Promise<LocationItem[]> {
    return apiGet<LocationItem[]>('/api/profile/locations', token);
  },

  updateLocation(city: string, token: string): Promise<void> {
    return apiPatch<void>('/api/profile/location', { city }, token);
  },
};
