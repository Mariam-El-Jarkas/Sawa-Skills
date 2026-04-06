import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  name: string;
  email: string;
  birthDate?: string;
  isAgeVerified?: boolean;
  isMinorVerified?: boolean;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, password: string, birthDate: string) => Promise<boolean>;
  verifyAge: () => Promise<boolean>;
  verifyMinor: (parentEmail: string) => Promise<boolean>;
  showLoginPrompt: boolean;
  setShowLoginPrompt: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000));
    if (email && password) {
      setIsLoggedIn(true);
      setUser({ name: 'Alex', email, birthDate: '1995-05-15', isAgeVerified: false, isMinorVerified: false });
      setShowLoginPrompt(false);
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string, birthDate: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000));
    if (name && email && password && birthDate) {
      setIsLoggedIn(true);
      setUser({ name, email, birthDate, isAgeVerified: false, isMinorVerified: false });
      setShowLoginPrompt(false);
      return true;
    }
    return false;
  };

  const verifyAge = async (): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1500));
    if (user) { setUser({ ...user, isAgeVerified: true, isMinorVerified: false }); return true; }
    return false;
  };

  const verifyMinor = async (parentEmail: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1500));
    if (user && parentEmail) { setUser({ ...user, isMinorVerified: true, isAgeVerified: false }); return true; }
    return false;
  };

  const logout = () => { setIsLoggedIn(false); setUser(null); };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, signup, verifyAge, verifyMinor, showLoginPrompt, setShowLoginPrompt }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
