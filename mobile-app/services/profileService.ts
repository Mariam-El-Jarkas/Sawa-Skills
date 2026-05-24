import { apiGet, apiPost, apiDelete, apiPatch } from './api';

export interface PublicProfile {
  id: number;
  name: string;
  bio: string | null;
  profilePicture: string | null;
  avgRating: number;
  reviewCount: number;
  swapCount: number;
  isVolunteer: boolean;
  publicProfile: boolean;
  offeredSkills: string[];
  wantedSkills: string[];
  reviews: Array<{
    id: number;
    reviewerName: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }>;
}

export const profileService = {
  getPublicProfile(userId: number, token: string): Promise<PublicProfile> {
    return apiGet<PublicProfile>(`/api/profile/${userId}`, token);
  },
  updatePrivacy(settings: { publicProfile: boolean; swapNotifications: boolean; messageNotifications: boolean; skillNewsNotifications: boolean }, token: string): Promise<void> {
    return apiPatch<void>('/api/profile/privacy', settings, token);
  },
  sendConnectionRequest(userId: number, token: string): Promise<any> {
    return apiPost(`/api/profile/${userId}/connect`, {}, token);
  },
  approveConnection(connectionId: number, token: string): Promise<any> {
    return apiPost(`/api/profile/connections/${connectionId}/approve`, {}, token);
  },
  removeConnection(connectionId: number, token: string): Promise<any> {
    return apiDelete(`/api/profile/connections/${connectionId}`, token);
  },
  declineConnection(connectionId: number, token: string): Promise<any> {
    return apiDelete(`/api/profile/connections/${connectionId}`, token);
  },
};
