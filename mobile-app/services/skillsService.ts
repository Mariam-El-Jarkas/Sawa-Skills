import { apiGet, apiPost, apiPatch, apiDelete } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SkillListing {
  id: number;
  ownerId: number;
  ownerName: string;
  ownerInitials: string;
  profilePicture: string | null;
  offeredSkill: string;
  wantedSkill: string;
  location: string | null;
  availability: 'Remote' | 'On-site' | null;
  avgRating: number;
  createdAt: string;
  alreadyRequested: boolean;
}

export interface UserSkill {
  id: number;
  skillName: string;
  category: string | null;
  offering: boolean;
  isPublic: boolean;
}

export interface BrowseParams {
  search?: string;
  category?: string;
  availability?: string;
  page?: number;
  size?: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const skillsService = {
  browseListings(params: BrowseParams, token?: string | null): Promise<SkillListing[]> {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.category) q.set('category', params.category);
    if (params.availability) q.set('availability', params.availability);
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.size !== undefined) q.set('size', String(params.size));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiGet<SkillListing[]>(`/api/skills${qs}`, token);
  },

  getCategories(): Promise<string[]> {
    return apiGet<string[]>('/api/skills/categories');
  },

  createListing(data: { offeredSkill: string; wantedSkill: string; location?: string; availability?: string }, token: string): Promise<SkillListing> {
    return apiPost<SkillListing>('/api/skills/listings', data, token);
  },

  getMyListings(token: string): Promise<SkillListing[]> {
    return apiGet<SkillListing[]>('/api/skills/my/listings', token);
  },

  deleteListing(id: number, token: string): Promise<void> {
    return apiDelete<void>(`/api/skills/listings/${id}`, token);
  },

  addOfferedSkill(data: { skillName: string; description?: string; category?: string }, token: string): Promise<UserSkill> {
    return apiPost<UserSkill>('/api/skills/my/offer', data, token);
  },

  addWantedSkill(data: { skillName: string; description?: string; category?: string }, token: string): Promise<UserSkill> {
    return apiPost<UserSkill>('/api/skills/my/want', data, token);
  },

  getMyOfferedSkills(token: string): Promise<UserSkill[]> {
    return apiGet<UserSkill[]>('/api/skills/my/offer', token);
  },

  getMyWantedSkills(token: string): Promise<UserSkill[]> {
    return apiGet<UserSkill[]>('/api/skills/my/want', token);
  },

  toggleVisibility(id: number, token: string): Promise<UserSkill> {
    return apiPatch<UserSkill>(`/api/skills/my/${id}/visibility`, {}, token);
  },
};
