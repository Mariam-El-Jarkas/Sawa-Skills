import { apiGet, apiPost, apiPatch } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Swap {
  id: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  date: string;
  otherUserId: number;
  otherUserName: string;
  otherUserInitials: string;
  theyOffer: string;
  youOffer: string;
  note: string | null;
  preferredTime: string | null;
  isRequester: boolean;
}

export interface CreateSwapData {
  receiverId: number;
  offeredSkill: string;
  wantedSkill: string;
  preferredTime?: string;
  note?: string;
}

export interface RatingData {
  rating: number;
  comment?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const swapsService = {
  getMySwaps(token: string, status?: string): Promise<Swap[]> {
    const qs = status && status !== 'all' ? `?status=${status}` : '';
    return apiGet<Swap[]>(`/api/swaps/my${qs}`, token);
  },

  createSwap(data: CreateSwapData, token: string): Promise<Swap> {
    return apiPost<Swap>('/api/swaps', data, token);
  },

  acceptSwap(id: number, token: string): Promise<Swap> {
    return apiPatch<Swap>(`/api/swaps/${id}/accept`, {}, token);
  },

  rejectSwap(id: number, token: string): Promise<Swap> {
    return apiPatch<Swap>(`/api/swaps/${id}/reject`, {}, token);
  },

  rateSwap(id: number, data: RatingData, token: string): Promise<void> {
    return apiPost<void>(`/api/swaps/${id}/rate`, data, token);
  },
};
