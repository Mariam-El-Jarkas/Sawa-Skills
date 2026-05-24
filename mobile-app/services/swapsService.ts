import { apiGet, apiPost, apiPatch } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Swap {
  id: number;
  status: 'pending' | 'active' | 'completed' | 'rejected' | 'pending_parent_approval';
  date: string;
  otherUserId: number;
  otherUserName: string;
  otherUserInitials: string;
  otherUserPicture: string | null;
  theyOffer: string;
  youOffer: string;
  note: string | null;
  preferredTime: string | null;
  isRequester: boolean;
  hasRated?: boolean;
  isFinished?: boolean;
  everyoneFinished?: boolean;
  otherUserAge?: number | null;
  otherUserGender?: string | null;
}

export interface CreateSwapData {
  receiverId: number;
  offeredSkill: string;
  wantedSkill: string;
  preferredTime?: string;
  note?: string;
  listingId?: number;
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

  markFinished(id: number, token: string): Promise<Swap> {
    return apiPatch<Swap>(`/api/swaps/${id}/finished`, {}, token);
  },

  rateSwap(id: number, data: RatingData, token: string): Promise<void> {
    return apiPost<void>(`/api/swaps/${id}/rate`, data, token);
  },
};
