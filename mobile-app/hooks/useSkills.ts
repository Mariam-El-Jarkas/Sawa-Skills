import { useState, useEffect, useCallback, useRef } from 'react';
import { skillsService, SkillListing, UserSkill, BrowseParams } from '../services/skillsService';
import { useAuth } from '../contexts/AuthContext';

const PAGE_SIZE = 20;

interface SkillsState {
  listings: SkillListing[];
  categories: string[];
  myListings: SkillListing[];
  myOffered: UserSkill[];
  myWanted: UserSkill[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  isMyDataLoading: boolean;
  error: string | null;
}

interface SkillsActions {
  fetchListings: (params: BrowseParams) => void;
  loadMoreListings: () => void;
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isMyDataLoading, setIsMyDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear user-specific state on logout so previous user's data is never visible to next user
  useEffect(() => {
    if (!token) {
      setMyListings([]);
      setMyOffered([]);
      setMyWanted([]);
    }
  }, [token]);
  const currentPageRef = useRef(0);
  const currentParamsRef = useRef<BrowseParams>({});

  // Debounce ref for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load categories once on mount ─────────────────────────────────────────
  useEffect(() => {
    skillsService.getCategories().then(setCategories).catch(() => {});
  }, []);

  // ── Browse listings (debounced, resets to page 0) ─────────────────────────
  const fetchListings = useCallback((params: BrowseParams) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      currentPageRef.current = 0;
      currentParamsRef.current = params;
      try {
        const data = (await skillsService.browseListings({ ...params, page: 0, size: PAGE_SIZE }, token)) || [];
        setListings(Array.isArray(data) ? data : []);
        setHasMore(Array.isArray(data) && data.length === PAGE_SIZE);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load skills');
      } finally {
        setIsLoading(false);
      }
    }, 250);
  }, [token]);

  // ── Load next page (append) ───────────────────────────────────────────────
  const loadMoreListings = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = currentPageRef.current + 1;
    setIsLoadingMore(true);
    try {
      const data = (await skillsService.browseListings({ ...currentParamsRef.current, page: nextPage, size: PAGE_SIZE }, token)) || [];
      setListings(prev => [...(Array.isArray(prev) ? prev : []), ...(Array.isArray(data) ? data : [])]);
      setHasMore(data.length === PAGE_SIZE);
      currentPageRef.current = nextPage;
    } catch {
      // silently fail on load-more — user can retry by scrolling again
    } finally {
      setIsLoadingMore(false);
    }
  }, [token, isLoadingMore, hasMore]);

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
      setMyListings(Array.isArray(listings) ? listings : []);
      setMyOffered(Array.isArray(offered) ? offered : []);
      setMyWanted(Array.isArray(wanted) ? wanted : []);
    } catch {
      // Silently fail — user stays on UI with empty lists
    } finally {
      setIsMyDataLoading(false);
    }
  }, [token]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const createListing = useCallback(async (data: { offeredSkill: string; wantedSkill: string; location?: string; availability?: string }) => {
    if (!token) throw new Error('Not logged in');
    try {
      const created = await skillsService.createListing(data, token);
      setMyListings(prev => [created, ...prev]);
    } catch (e: any) {
      throw e;
    }
  }, [token]);

  const deleteListing = useCallback(async (id: number) => {
    if (!token) throw new Error('Not logged in');
    try {
      await skillsService.deleteListing(id, token);
      setMyListings(prev => prev.filter(l => l.id !== id));
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (e: any) {
      // Re-throw so component can alert the user
      throw e;
    }
  }, [token]);

  const addOfferedSkill = useCallback(async (data: { skillName: string; description?: string; category?: string }) => {
    if (!token) throw new Error('Not logged in');
    try {
      const skill = await skillsService.addOfferedSkill(data, token);
      setMyOffered(prev => [...prev, skill]);
    } catch (e: any) {
      throw e;
    }
  }, [token]);

  const addWantedSkill = useCallback(async (data: { skillName: string; description?: string; category?: string }) => {
    if (!token) throw new Error('Not logged in');
    try {
      const skill = await skillsService.addWantedSkill(data, token);
      setMyWanted(prev => [...prev, skill]);
    } catch (e: any) {
      throw e;
    }
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
    isLoading, isLoadingMore, hasMore, isMyDataLoading, error,
    fetchListings, loadMoreListings, fetchMyData,
    createListing, deleteListing,
    addOfferedSkill, addWantedSkill, toggleVisibility,
  };
}
