import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

const getBaseUrl = (): string => {
  if (Platform.OS === 'web') return 'http://localhost:8080';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:8080`;
  return 'http://10.0.2.2:8080';
};

const BASE_URL = getBaseUrl();

export interface ReviewData {
  id: number;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ConnectionData {
  id: number;
  otherUserId: number;
  otherUserName: string;
  avatarInitials: string;
  skills: string[];
}

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  profilePicture: string | null;
  location: string | null;
  avgRating: number;
  reviewCount: number;
  swapCount: number;
  volunteerStatus: string | null;
  isVolunteer: boolean;
  isAgeVerified: boolean;
  isMinorVerified: boolean;
  reviews: ReviewData[];
  offeredSkills: string[];
  wantedSkills: string[];
  connections: ConnectionData[];
}

/** Convert relative path → absolute URL (e.g. /uploads/…  →  http://host:8080/uploads/…) */
const toAbsoluteUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${BASE_URL}${path}`;
};

export function useProfile() {
  const { token, updateUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token ?? ''}`,
  });

  const parseError = async (res: Response, fallback: string): Promise<string> => {
    try {
      const text = await res.text();
      const json = JSON.parse(text);
      return json.message ?? json.error ?? fallback;
    } catch {
      return fallback;
    }
  };

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/profile/me`, { headers: getHeaders() });
      if (!res.ok) throw new Error(await parseError(res, `Failed to load profile (${res.status})`));
      const raw: ProfileData = await res.json();
      // Resolve relative picture URL to absolute so <Image> can load it
      const data: ProfileData = {
        ...raw,
        profilePicture: raw.profilePicture ? `${toAbsoluteUrl(raw.profilePicture)}?t=${Date.now()}` : null,
        offeredSkills: raw.offeredSkills ?? [],
        wantedSkills: raw.wantedSkills ?? [],
        isVolunteer: !!raw.volunteerStatus,
      };
      setProfile(data);
      updateUser({
        bio: data.bio ?? undefined,
        phone: data.phone ?? undefined,
        profilePicture: data.profilePicture ?? undefined,
        isAgeVerified: data.isAgeVerified,
        isMinorVerified: data.isMinorVerified,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) refresh();
  }, [token]);

  const updateBio = useCallback(async (bio: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/profile/bio`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ bio }),
    });
    if (!res.ok) throw new Error(await parseError(res, 'Failed to update bio'));
    setProfile(p => p ? { ...p, bio } : p);
  }, [token]);

  const updateContact = useCallback(async (phone: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/profile/contact`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) throw new Error(await parseError(res, 'Failed to update phone'));
    setProfile(p => p ? { ...p, phone } : p);
    updateUser({ phone });
  }, [token, updateUser]);

  const uploadPicture = useCallback(async (imageBase64: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/profile/picture`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ imageBase64 }),
    });
    if (!res.ok) throw new Error(await parseError(res, 'Failed to upload picture'));
    const data = await res.json();
    const absoluteUrl = data.pictureUrl ? `${toAbsoluteUrl(data.pictureUrl)}?t=${Date.now()}` : null;
    setProfile(p => p ? { ...p, profilePicture: absoluteUrl } : p);
    updateUser({ profilePicture: absoluteUrl ?? undefined });
  }, [token, updateUser]);

  const deleteProfilePicture = useCallback(async (): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/profile/picture`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await parseError(res, 'Failed to delete picture'));
    setProfile(p => p ? { ...p, profilePicture: null } : p);
    updateUser({ profilePicture: undefined });
  }, [token, updateUser]);

  const applyForVolunteer = useCallback(async (why: string, experience: string, skillsToShare: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/profile/volunteer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ why, experience, skillsToShare }),
    });
    if (!res.ok) throw new Error(await parseError(res, 'Failed to apply for volunteer badge'));
    setProfile(p => p ? { ...p, volunteerStatus: 'PENDING', isVolunteer: true } : p);
  }, [token]);

  const requestEmailChange = useCallback(async (newEmail: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/profile/contact/request-email-change`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ newEmail }),
    });
    if (!res.ok) throw new Error(await parseError(res, 'Failed to send verification code'));
  }, [token]);

  const verifyCurrentEmail = useCallback(async (otp: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/profile/contact/verify-current-email`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ otp }),
    });
    if (!res.ok) throw new Error(await parseError(res, 'Invalid or expired code'));
  }, [token]);

  const confirmEmailChange = useCallback(async (otp: string): Promise<string> => {
    const res = await fetch(`${BASE_URL}/api/profile/contact/confirm-email-change`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ otp }),
    });
    if (!res.ok) throw new Error(await parseError(res, 'Invalid or expired code'));
    const data = await res.json();
    setProfile(p => p ? { ...p, email: data.newEmail } : p);
    updateUser({ email: data.newEmail });
    return data.newEmail;
  }, [token, updateUser]);

  const submitSupportRequest = useCallback(async (data: {
    oldEmail: string;
    newEmail: string;
    issueDescription: string;
    joinDate: string;
    location: string;
    usedFeatures: string;
    additionalProof: string;
  }): Promise<void> => {
    const res = await fetch(`${BASE_URL}/api/profile/support/recovery`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await parseError(res, 'Failed to submit support request'));
  }, [token]);

  return {
    profile,
    loading,
    error,
    refresh,
    updateBio,
    updateContact,
    uploadPicture,
    deleteProfilePicture,
    applyForVolunteer,
    requestEmailChange,
    verifyCurrentEmail,
    confirmEmailChange,
    submitSupportRequest,
  };
}
