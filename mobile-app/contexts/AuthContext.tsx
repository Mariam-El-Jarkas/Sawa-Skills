import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiGet, apiPost, setOnUnauthorized, BASE_URL, isJwtExpired } from '../services/api';
import { notificationService } from '../services/notificationService';

const toAbsoluteUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${BASE_URL}${path}`;
};

const TOKEN_KEY = 'auth_token';

// ── Secure storage helpers ────────────────────────────────────────────────────
// Native: expo-secure-store (hardware-backed on supported devices)
// Web: localStorage (shared across tabs — intentional for session persistence)
const saveToken = async (token: string) => {
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

const loadToken = async (): Promise<string | null> => {
  if (Platform.OS !== 'web') return await SecureStore.getItemAsync(TOKEN_KEY);
  return localStorage.getItem(TOKEN_KEY);
};

const deleteToken = async () => {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  birthDate?: string;
  gender?: string;
  isAgeVerified?: boolean;
  isMinorVerified?: boolean;
  isVolunteer?: boolean;
  bio?: string;
  phone?: string;
  profilePicture?: string;
  ageVerificationStatus?: string | null;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, phone: string, password: string, birthDate: string, gender: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  loginWithSocial: (provider: 'GOOGLE' | 'FACEBOOK' | 'GITHUB', accessToken: string, redirectUri?: string) => Promise<boolean>;
  verifyAge: (data: { fullName: string, dob: string, idFrontImage: string | null, idBackImage: string | null, selfieImage: string | null }) => Promise<boolean>;
  verifyMinor: (parentEmail: string, gender?: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  showLoginPrompt: boolean;
  setShowLoginPrompt: (show: boolean) => void;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: (count: number) => void;
  refreshUnreadCount: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const refreshUnreadCount = async () => {
    if (!token) return;
    try {
      const unreadRes = await notificationService.getUnreadCount(token);
      setUnreadNotificationsCount(unreadRes.count);
    } catch { /* silent */ }
  };

  /** Builds a full User object from a /api/profile/me response. */
  const buildUser = (profile: any): User => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role || 'USER',
    bio: profile.bio,
    profilePicture: toAbsoluteUrl(profile.profilePicture),
    isAgeVerified: profile.ageVerificationStatus === 'APPROVED',
    isMinorVerified: profile.isMinorVerified,
    isVolunteer: profile.isVolunteer ?? false,
    ageVerificationStatus: profile.ageVerificationStatus,
  });

  /** Clears all auth state without navigating. Used by both logout and cross-tab sync. */
  const clearSession = () => {
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    setUnreadNotificationsCount(0);
  };

  /** Restores auth state from a verified token. Used by session restore and cross-tab sync. */
  const restoreSession = async (storedToken: string): Promise<boolean> => {
    try {
      const profile = await apiGet<any>('/api/profile/me', storedToken);
      setToken(storedToken);
      setIsLoggedIn(true);
      setUser(buildUser(profile));
      try {
        const unread = await notificationService.getUnreadCount(storedToken);
        setUnreadNotificationsCount(unread.count);
      } catch { /* silent */ }
      return true;
    } catch {
      await deleteToken();
      return false;
    }
  };

  // ── App launch: restore session ───────────────────────────────────────────

  useEffect(() => {
    // Register 401 handler — fires when any API call returns Unauthorized.
    // Clears everything and hard-redirects to the auth screen.
    setOnUnauthorized(async () => {
      await deleteToken();
      clearSession();
      try { router.replace('/auth'); } catch { /* already navigating */ }
    });

    (async () => {
      try {
        const stored = await loadToken();
        if (stored) {
          // Fast client-side expiry check — avoids a network round-trip for expired tokens
          if (isJwtExpired(stored)) {
            await deleteToken();
          } else {
            await restoreSession(stored);
          }
        }
      } catch {
        await deleteToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cross-tab session synchronization (web only) ──────────────────────────
  //
  // localStorage is shared across all tabs of the same origin.
  // The 'storage' event fires in OTHER tabs when localStorage changes —
  // never in the tab that made the change. This lets us sync auth state
  // across tabs without polling.
  //
  //  Tab A logs out  → storage event fires in Tab B → Tab B also logs out
  //  Tab A logs in   → storage event fires in Tab B → Tab B restores session
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const syncAcrossTabs = async (e: StorageEvent) => {
      if (e.key !== TOKEN_KEY) return;

      if (e.newValue === null) {
        // Another tab removed the token (logout or account delete)
        clearSession();
        try { router.replace('/auth'); } catch { /* already on auth */ }
      } else if (e.oldValue === null && e.newValue) {
        // Another tab added the token (fresh login) — restore session here too
        await restoreSession(e.newValue);
      }
      // Token replacement (value change without null → null): session update,
      // not a security event. No action needed; next API call will use fresh token.
    };

    window.addEventListener('storage', syncAcrossTabs);
    return () => window.removeEventListener('storage', syncAcrossTabs);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Periodic unread count refresh ────────────────────────────────────────

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    const interval = setInterval(refreshUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session creation ──────────────────────────────────────────────────────

  /**
   * Called after any successful login (email/password or social).
   * Sets basic user immediately (fast UI unblock), then fetches the full
   * profile with verification/volunteer status in the background.
   */
  const applySession = async (data: any) => {
    await saveToken(data.accessToken);
    setToken(data.accessToken);
    setIsLoggedIn(true);
    setUser({
      id: data.userId,
      name: data.name ?? '',
      email: data.email,
      role: data.role ?? 'USER',
      isAgeVerified: false,
      isMinorVerified: false,
    });
    setShowLoginPrompt(false);

    // Fetch full profile (verification/volunteer status, picture)
    try {
      const profile = await apiGet<any>('/api/profile/me', data.accessToken);
      setUser(buildUser(profile));
    } catch { /* keep basic user on profile fetch failure */ }
  };

  // ── Auth actions ──────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<boolean> => {
    const data = await apiPost<any>('/api/auth/login', { email, password });
    await applySession(data);
    return true;
  };

  const signup = async (name: string, email: string, phone: string, password: string, birthDate: string, gender: string): Promise<boolean> => {
    try {
      await apiPost('/api/auth/register', { name, email, phone, password, dateOfBirth: birthDate, gender });
      return true;
    } catch (e: any) {
      // Backend resent OTP to an existing unverified account — treat as success
      if (e?.message?.startsWith('RESEND_OTP:')) return true;
      throw e;
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    try { await apiPost('/api/auth/verify-email', { email, otp }); return true; }
    catch { return false; }
  };

  const resendOtp = async (email: string): Promise<boolean> => {
    try { await apiPost('/api/auth/resend-otp', { email }); return true; }
    catch { return false; }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try { await apiPost('/api/auth/forgot-password', { email }); return true; }
    catch { return false; }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<boolean> => {
    try { await apiPost('/api/auth/reset-password', { email, token: code, newPassword }); return true; }
    catch { return false; }
  };

  const loginWithSocial = async (provider: 'GOOGLE' | 'FACEBOOK' | 'GITHUB', accessToken: string, redirectUri?: string): Promise<boolean> => {
    const data = await apiPost<any>('/api/auth/social-login', { provider, accessToken, redirectUri });
    await applySession(data);
    return true;
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  };

  const verifyAge = async (data: any): Promise<boolean> => {
    try {
      if (!user || !token) return false;
      await apiPost('/api/verification/submit', { ...data, type: data.type || 'ADULT' }, token);
      return true;
    } catch { return false; }
  };

  const verifyMinor = async (parentEmail: string, gender?: string): Promise<boolean> => {
    try {
      if (!user || !token) return false;
      await apiPost('/api/verification/submit', { parentEmail, type: 'MINOR', ...(gender ? { gender } : {}) }, token);
      return true;
    } catch { return false; }
  };

  /**
   * Logs out the current user.
   * - Deletes the token from secure storage (triggers cross-tab sync on web)
   * - Clears all in-memory auth state
   * - Resets the navigation stack to the auth screen
   */
  const logout = async () => {
    await deleteToken(); // Removing from localStorage fires 'storage' event in other tabs
    clearSession();
    try { router.replace('/auth'); } catch { /* already navigating */ }
  };

  // ── Provider ──────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{
      isLoggedIn, user, token, isLoading,
      login, logout, signup, verifyOtp, resendOtp,
      forgotPassword, resetPassword, loginWithSocial,
      verifyAge, verifyMinor, updateUser,
      showLoginPrompt, setShowLoginPrompt,
      unreadNotificationsCount, setUnreadNotificationsCount,
      refreshUnreadCount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
