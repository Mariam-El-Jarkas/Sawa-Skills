import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL, setOnUnauthorized } from '../services/api';

const TOKEN_KEY = 'auth_token';

// expo-secure-store doesn't work on web — fall back to in-memory
const saveToken = async (token: string) => {
  if (Platform.OS !== 'web') await SecureStore.setItemAsync(TOKEN_KEY, token);
};
const loadToken = async (): Promise<string | null> => {
  if (Platform.OS !== 'web') return await SecureStore.getItemAsync(TOKEN_KEY);
  return null;
};
const deleteToken = async () => {
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(TOKEN_KEY);
};

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  birthDate?: string;
  isAgeVerified?: boolean;
  isMinorVerified?: boolean;
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
  signup: (name: string, email: string, phone: string, password: string, birthDate: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  loginWithSocial: (provider: 'GOOGLE' | 'FACEBOOK' | 'GITHUB', accessToken: string, redirectUri?: string) => Promise<boolean>;
  verifyAge: (data: { fullName: string, dob: string, idFrontImage: string | null, idBackImage: string | null, selfieImage: string | null }) => Promise<boolean>;
  verifyMinor: (parentEmail: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  showLoginPrompt: boolean;
  setShowLoginPrompt: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Restore session on app launch
  useEffect(() => {
    setOnUnauthorized(async () => {
      await deleteToken();
      setIsLoggedIn(false);
      setUser(null);
      setToken(null);
      router.replace('/auth');
    });

    (async () => {
      try {
        const stored = await loadToken();
        if (stored) {
          // Validate token is still good by decoding expiry (JWT is base64)
          const parts = stored.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp * 1000 > Date.now()) {
              setToken(stored);
              setIsLoggedIn(true);
              setUser({
                id: payload.userId,
                name: payload.name ?? '',
                email: payload.sub,
                role: payload.role ?? 'USER',
                isAgeVerified: false,
                isMinorVerified: false,
              });
            } else {
              await deleteToken(); // expired — clear it
            }
          }
        }
      } catch {
        await deleteToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || `Login failed (${res.status})`);
    }
    await applySession(await res.json());
    return true;
  };

  const signup = async (name: string, email: string, phone: string, password: string, birthDate: string): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, dateOfBirth: birthDate }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || `Server error ${res.status}`);
    }
    return true;
  };

  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      return res.ok;
    } catch { return false; }
  };

  const resendOtp = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return res.ok;
    } catch { return false; }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return res.ok;
    } catch { return false; }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: code, newPassword }),
      });
      return res.ok;
    } catch { return false; }
  };

  const loginWithSocial = async (provider: 'GOOGLE' | 'FACEBOOK' | 'GITHUB', accessToken: string, redirectUri?: string): Promise<boolean> => {
    const res = await fetch(`${BASE_URL}/api/auth/social-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, accessToken, redirectUri }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(msg || 'Social login failed');
    }
    await applySession(await res.json());
    return true;
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  };

  const verifyAge = async (data: any): Promise<boolean> => {
    try {
      if (!user || !token) return false;
      const res = await fetch(`${BASE_URL}/api/verification/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...data, type: data.type || 'ADULT' }),
      });
      return res.ok;
    } catch { return false; }
  };

  const verifyMinor = async (parentEmail: string): Promise<boolean> => {
    try {
      if (!user || !token) return false;
      const res = await fetch(`${BASE_URL}/api/verification/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ parentEmail, type: 'MINOR' }),
      });
      return res.ok;
    } catch { return false; }
  };

  const logout = async () => {
    await deleteToken();
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn, user, token, isLoading,
      login, logout, signup, verifyOtp, resendOtp,
      forgotPassword, resetPassword, loginWithSocial,
      verifyAge, verifyMinor, updateUser,
      showLoginPrompt, setShowLoginPrompt,
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
