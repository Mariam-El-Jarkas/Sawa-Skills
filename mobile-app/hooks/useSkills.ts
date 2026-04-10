import { useState, useEffect, useCallback, useRef } from 'react';
import { skillsService, SkillListing, UserSkill, BrowseParams } from '../services/skillsService';
import { useAuth } from '../contexts/AuthContext';

interface SkillsState {
  listings: SkillListing[];
  categories: string[];
  myListings: SkillListing[];
  myOffered: UserSkill[];
  myWanted: UserSkill[];
  isLoading: boolean;
  isMyDataLoading: boolean;
  error: string | null;
}

interface SkillsActions {
  fetchListings: (params: BrowseParams) => void;
  fetchMyData: () => Promise<void>;
  createListing: (data: { offeredSkill: string; wantedSkill: string; location?: string; availability?: string }) => Promise<void>;
  deleteListing: (id: number) => Promise<void>;
  addOfferedSkill: (data: { skillName: string; description?: string; category?: string }) => Promise<void>;
  addWantedSkill: (data: { skillName: string; description?: string; category?: string }) => Promise<void>;
  toggleVisibility: (id: number) => Promise<void>;
}

export function useSkills(): SkillsState & SkillsActions {
  const { token } = useAuth();
  const [listings, setListings] = useState<SkillListing[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [myListings, setMyListings] = useState<SkillListing[]>([]);
  const [myOffered, setMyOffered] = useState<UserSkill[]>([]);
  const [myWanted, setMyWanted] = useState<UserSkill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMyDataLoading, setIsMyDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce ref for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load categories once on mount ─────────────────────────────────────────
  useEffect(() => {
    skillsService.getCategories().then(setCategories).catch(() => {});
  }, []);

  // ── Browse listings (debounced) ───────────────────────────────────────────
  const fetchListings = useCallback((params: BrowseParams) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await skillsService.browseListings(params, token);
        setListings(data);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load skills');
      } finally {
        setIsLoading(false);
      }
    }, 350);
  }, [token]);

  // ── Load initial listings ─────────────────────────────────────────────────
  useEffect(() => {
    fetchListings({});
  }, [fetchListings]);

  // ── Cleanup debounce on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Load logged-in user's data ────────────────────────────────────────────
  const fetchMyData = useCallback(async () => {
    if (!token) return;
    setIsMyDataLoading(true);
    try {
      const [listings, offered, wanted] = await Promise.all([
        skillsService.getMyListings(token),
        skillsService.getMyOfferedSkills(token),
        skillsService.getMyWantedSkills(token),
      ]);
      setMyListings(listings);
      setMyOffered(offered);
      setMyWanted(wanted);
    } catch {
      // Silently fail — user stays on UI with empty lists
    } finally {
      setIsMyDataLoading(false);
    }
  }, [token]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const createListing = useCallback(async (data: { offeredSkill: string; wantedSkill: string; location?: string; availability?: string }) => {
    if (!token) throw new Error('Not logged in');
    const created = await skillsService.createListing(data, token);
    setMyListings(prev => [created, ...prev]);
  }, [token]);

  const deleteListing = useCallback(async (id: number) => {
    if (!token) throw new Error('Not logged in');
    await skillsService.deleteListing(id, token);
    setMyListings(prev => prev.filter(l => l.id !== id));
  }, [token]);

  const addOfferedSkill = useCallback(async (data: { skillName: string; description?: string; category?: string }) => {
    if (!token) throw new Error('Not logged in');
    const skill = await skillsService.addOfferedSkill(data, token);
    setMyOffered(prev => [...prev, skill]);
  }, [token]);

  const addWantedSkill = useCallback(async (data: { skillName: string; description?: string; category?: string }) => {
    if (!token) throw new Error('Not logged in');
    const skill = await skillsService.addWantedSkill(data, token);
    setMyWanted(prev => [...prev, skill]);
  }, [token]);

  const toggleVisibility = useCallback(async (id: number) => {
    if (!token) throw new Error('Not logged in');
    const updated = await skillsService.toggleVisibility(id, token);
    const update = (list: UserSkill[]) => list.map(s => s.id === id ? updated : s);
    setMyOffered(update);
    setMyWanted(update);
  }, [token]);

  return {
    listings, categories, myListings, myOffered, myWanted,
    isLoading, isMyDataLoading, error,
    fetchListings, fetchMyData,
    createListing, deleteListing,
    addOfferedSkill, addWantedSkill, toggleVisibility,
  };
}
