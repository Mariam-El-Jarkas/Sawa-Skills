import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { useToast } from '../../components/modals/AppToast';
import { Search, Filter } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSkills } from '../../hooks/useSkills';
import { SwapRequestModal } from '../../components/SwapRequestModal';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { ListingCard } from '../../components/cards/ListingCard';
import { FilterModal } from '../../components/skills/FilterModal';
import { MyExchangeView } from '../../components/skills/MyExchangeView';
import { AddSkillListingView } from '../../components/skills/AddSkillListingView';
import { swapsService } from '../../services/swapsService';
import { C } from '../../components/theme';

const ALL_CATEGORY = 'All';

export default function SkillsScreen() {
  const router = useRouter();
  const { isLoggedIn, user, token, setShowLoginPrompt } = useAuth();
  const {
    listings, categories, myListings, myOffered, myWanted,
    isLoading, isLoadingMore, hasMore, isMyDataLoading, error,
    fetchListings, loadMoreListings, fetchMyData,
    createListing, deleteListing,
    addOfferedSkill, addWantedSkill,
  } = useSkills();
  const { showToast } = useToast();

  const [view, setView] = useState<'browse' | 'my-exchange' | 'add'>('browse');
  const [selectedCat, setSelectedCat] = useState(ALL_CATEGORY);
  const [availFilter, setAvailFilter] = useState<'All' | 'Remote' | 'On-site'>('All');
  const [showFilter, setShowFilter] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [requestedSwaps, setRequestedSwaps] = useState<number[]>([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{ ownerId: number; ownerName: string; offeredSkill: string; listingId: number } | null>(null);
  const [addMode, setAddMode] = useState<'listing' | 'offer' | 'want'>('listing');
  const [newListing, setNewListing] = useState({ offer: '', want: '', location: '', availability: 'Remote' as 'Remote' | 'On-site' });
  const [newSkill, setNewSkill] = useState({ name: '', description: '', category: 'Tech' });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleDeleteListingConfirm = (id: number) => {
    setConfirmDelete(id);
  };

  const handleDeleteConfirmed = async () => {
    if (confirmDelete === null) return;
    const id = confirmDelete;
    setConfirmDelete(null);
    setIsDeletingId(id);
    try {
      await deleteListing(id);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete listing', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Load my data when logged in (to ensure swap requests have offered skills)
  useEffect(() => {
    if (isLoggedIn) {
      fetchMyData();
    }
  }, [isLoggedIn, fetchMyData]);

  // Re-fetch on filter changes
  useEffect(() => {
    fetchListings({ search: searchText || undefined, category: selectedCat, availability: availFilter });
  }, [searchText, selectedCat, availFilter, token, fetchListings]);

  // Sync requestedSwaps state when listings change
  useEffect(() => {
    if (listings.length > 0) {
      const requestedIds = listings.filter(l => l.alreadyRequested).map(l => l.id);
      if (requestedIds.length > 0) {
        setRequestedSwaps(prev => Array.from(new Set([...prev, ...requestedIds])));
      }
    }
  }, [listings]);

  const handleRequestSwap = (listing: typeof listings[0]) => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    if (requestedSwaps.includes(listing.id)) return;
    setSwapTarget({ ownerId: listing.ownerId, ownerName: listing.ownerName, offeredSkill: listing.offeredSkill, listingId: listing.id });
    setShowSwapModal(true);
  };

  const handleSwapConfirm = async (data: { offeredSkill: string; note: string; time: string }) => {
    if (!token || !swapTarget) return;
    try {
      await swapsService.createSwap({
        receiverId: swapTarget.ownerId,
        offeredSkill: data.offeredSkill,
        wantedSkill: swapTarget.offeredSkill,
        preferredTime: data.time,
        note: data.note,
        listingId: swapTarget.listingId,
      }, token);
      
      setRequestedSwaps(prev => [...new Set([...prev, swapTarget.listingId])]);
      fetchListings({ search: searchText || undefined, category: selectedCat, availability: availFilter });
    } catch (e: any) {
      throw e;
    }
  };

  const handleCreateListingAction = async () => {
    const errs: Record<string, string> = {};
    if (!newListing.offer.trim()) errs.offer = 'Skill you offer is required.';
    else if (newListing.offer.trim().length > 100) errs.offer = 'Max 100 characters.';
    if (!newListing.want.trim()) errs.want = 'Skill you want is required.';
    else if (newListing.want.trim().length > 100) errs.want = 'Max 100 characters.';
    if (newListing.availability === 'On-site' && !newListing.location.trim()) errs.location = 'Location is required for on-site exchanges.';
    else if (newListing.location.trim().length > 100) errs.location = 'Max 100 characters.';
    
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSaving(true);
    try {
      await createListing({ 
        offeredSkill: newListing.offer, 
        wantedSkill: newListing.want, 
        location: newListing.availability === 'Remote' ? undefined : newListing.location, 
        availability: newListing.availability 
      });
      setNewListing({ offer: '', want: '', location: '', availability: 'Remote' });
      setFormErrors({});
      setView('my-exchange');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to create listing', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkillAction = async () => {
    const errs: Record<string, string> = {};
    if (!newSkill.name.trim()) errs.name = 'Skill name is required.';
    else if (newSkill.name.trim().length > 100) errs.name = 'Max 100 characters.';
    if (newSkill.description.trim().length > 300) errs.description = 'Description max 300 characters.';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSaving(true);
    try {
      if (addMode === 'offer') {
        await addOfferedSkill({ skillName: newSkill.name, description: newSkill.description, category: newSkill.category });
      } else {
        await addWantedSkill({ skillName: newSkill.name, description: newSkill.description, category: newSkill.category });
      }
      setNewSkill({ name: '', description: '', category: 'Tech' });
      setFormErrors({});
      setView('my-exchange');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to add skill', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const offeredForModal = (Array.isArray(myOffered) ? myOffered : []).map(s => ({ id: s.id, name: s.skillName }));
  const displayCategories = [ALL_CATEGORY, ...(Array.isArray(categories) ? categories.filter(c => c !== ALL_CATEGORY) : [])];

  return (
    <ScrollView
      style={s.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => fetchListings({ search: searchText || undefined, category: selectedCat, availability: availFilter })}
          colors={[C.violet600]}
          tintColor={C.violet600}
        />
      }
    >
      <View style={s.body}>
        {isLoggedIn && (
          <View style={s.viewTabs}>
            {(['browse', 'my-exchange'] as const).map(v => (
              <TouchableOpacity key={v} style={[s.viewTab, view === v && s.viewTabActive]} onPress={() => { setView(v); if (v === 'my-exchange') setSearchText(''); }}>
                <Text style={[s.viewTabTxt, view === v && s.viewTabTxtActive]}>{v === 'browse' ? 'Browse Skills' : 'My Exchange'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Browse ── */}
        {(view === 'browse' || !isLoggedIn) && (
          <>
            <View style={s.searchRow}>
              <View style={s.searchBox}>
                <Search size={18} color={C.gray400} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search skills..."
                  placeholderTextColor={C.gray400}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              <TouchableOpacity
                style={[s.filterBtn, (selectedCat !== ALL_CATEGORY || availFilter !== 'All') && { borderColor: C.violet600, backgroundColor: C.violet50 }]}
                onPress={() => setShowFilter(true)}
              >
                <Filter size={20} color={(selectedCat !== ALL_CATEGORY || availFilter !== 'All') ? C.violet600 : C.gray700} />
              </TouchableOpacity>
            </View>

            {(selectedCat !== ALL_CATEGORY || availFilter !== 'All' || searchText !== '') && (
              <View style={s.activeFiltersRow}>
                <Text style={s.resultsCount}>{listings.length} results found</Text>
                <TouchableOpacity onPress={() => { setSelectedCat(ALL_CATEGORY); setAvailFilter('All'); setSearchText(''); }}>
                  <Text style={s.clearFiltersLink}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catsScroll}>
              {displayCategories.map(cat => (
                <TouchableOpacity key={cat} style={[s.catPill, selectedCat === cat && s.catPillActive]} onPress={() => setSelectedCat(cat)}>
                  <Text style={[s.catTxt, selectedCat === cat && s.catTxtActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isLoading ? (
              <ActivityIndicator size="large" color={C.violet600} style={{ marginTop: 32 }} />
            ) : error ? (
              <Text style={s.errorTxt}>{error}</Text>
            ) : listings.length === 0 ? (
              <View style={s.empty}><Text style={s.emptyTxt}>No skills found. Try a different search.</Text></View>
            ) : (
              <View style={s.skillsList}>
                {listings.map(skill => (
                  <ListingCard
                    key={skill.id}
                    listing={skill}
                    isRequested={skill.alreadyRequested || requestedSwaps.includes(skill.id)}
                    isOwnListing={isLoggedIn && user?.id === skill.ownerId}
                    onRequestSwap={handleRequestSwap}
                    onViewProfile={(uid) => router.push(`/profile?userId=${uid}`)}
                    onGoToSwaps={() => router.push('/swaps')}
                    onDelete={isDeletingId === skill.id ? undefined : handleDeleteListingConfirm}
                    onManageListing={() => setView('my-exchange')}
                  />
                ))}
                {hasMore && (
                  <TouchableOpacity style={s.loadMoreBtn} onPress={loadMoreListings} disabled={isLoadingMore}>
                    {isLoadingMore
                      ? <ActivityIndicator size="small" color={C.violet600} />
                      : <Text style={s.loadMoreTxt}>Load More</Text>}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {/* ── My Exchange ── */}
        {view === 'my-exchange' && (
          <MyExchangeView
            isLoading={isMyDataLoading}
            myListings={myListings}
            myOffered={myOffered}
            myWanted={myWanted}
            onAddListing={() => { setView('add'); setAddMode('listing'); }}
            onAddOffered={() => { setView('add'); setAddMode('offer'); }}
            onAddWanted={() => { setView('add'); setAddMode('want'); }}
            onDeleteListing={handleDeleteListingConfirm}
            isDeletingId={isDeletingId}
            onViewProfile={(uid) => router.push(uid ? `/profile?userId=${uid}` : '/profile')}
          />
        )}

        {/* ── Add View ── */}
        {view === 'add' && (
          <AddSkillListingView
            addMode={addMode}
            onBack={() => setView('my-exchange')}
            isSaving={isSaving}
            formErrors={formErrors}
            newListing={newListing}
            onNewListingChange={(f, v) => {
              setNewListing({ ...newListing, [f]: v });
              if (formErrors[f]) setFormErrors(e => { const n = { ...e }; delete n[f]; return n; });
            }}
            onSubmitListing={handleCreateListingAction}
            newSkill={newSkill}
            onNewSkillChange={(f, v) => {
              setNewSkill({ ...newSkill, [f as keyof typeof newSkill]: v });
              if (formErrors[f]) setFormErrors(e => { const n = { ...e }; delete n[f]; return n; });
            }}
            onSubmitSkill={handleAddSkillAction}
          />
        )}
      </View>

      <FilterModal
        isVisible={showFilter}
        onClose={() => setShowFilter(false)}
        categories={categories}
        selectedCat={selectedCat}
        onSelectCat={setSelectedCat}
        availFilter={availFilter}
        onSelectAvail={setAvailFilter}
        onReset={() => { setSelectedCat(ALL_CATEGORY); setAvailFilter('All'); setShowFilter(false); }}
        onApply={() => setShowFilter(false)}
      />

      <SwapRequestModal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        targetUser={swapTarget?.ownerName ?? ''}
        targetSkill={swapTarget?.offeredSkill ?? ''}
        userSkills={offeredForModal}
        onConfirm={handleSwapConfirm}
      />

      <ConfirmModal
        isVisible={confirmDelete !== null}
        title="Remove Listing"
        message="Are you sure you want to delete this listing?"
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete(null)}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  body: { padding: 16, gap: 16, paddingBottom: 32 },
  viewTabs: { flexDirection: 'row', backgroundColor: C.white, padding: 4, borderRadius: 12, borderWidth: 1, borderColor: '#DDD6FE' },
  viewTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  viewTabActive: { backgroundColor: C.violet600 },
  viewTabTxt: { fontSize: 13, fontWeight: '500', color: C.gray600 },
  viewTabTxtActive: { color: C.white, fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.gray200, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: C.gray800 },
  filterBtn: { width: 48, height: 48, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.gray200, alignItems: 'center', justifyContent: 'center' },
  catsScroll: { marginBottom: 4 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.gray200, marginRight: 8 },
  catPillActive: { backgroundColor: C.violet600, borderColor: C.violet600 },
  catTxt: { fontSize: 13, fontWeight: '500', color: C.gray700 },
  catTxtActive: { color: C.white },
  errorTxt: { color: '#DC2626', fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  skillsList: { gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { color: C.gray500, fontSize: 14, textAlign: 'center' },
  activeFiltersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
  resultsCount: { fontSize: 13, color: C.gray500, fontWeight: '500' },
  clearFiltersLink: { fontSize: 13, color: C.violet600, fontWeight: '600' },
  loadMoreBtn: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.violet200, alignItems: 'center', marginTop: 4 },
  loadMoreTxt: { fontSize: 14, fontWeight: '600', color: C.violet600 },
});

