import { apiGet } from './api';

export interface PublicProfile {
  id: number;
  name: string;
  bio: string | null;
  profilePicture: string | null;
  avgRating: number;
  reviewCount: number;
  swapCount: number;
  isVolunteer: boolean;
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
};
