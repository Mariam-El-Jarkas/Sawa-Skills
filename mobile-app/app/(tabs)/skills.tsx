import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useToast } from '../../components/modals/AppToast';
import { Search, Filter, Calendar, Clock, Users, Plus, X, CheckCircle, Wifi, MapPin, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSkills } from '../../hooks/useSkills';
import { useProfile } from '../../hooks/useProfile';
import { SwapRequestModal } from '../../components/SwapRequestModal';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { ListingCard } from '../../components/cards/ListingCard';
import { FilterModal } from '../../components/skills/FilterModal';
import { MyExchangeView } from '../../components/skills/MyExchangeView';
import { AddSkillListingView } from '../../components/skills/AddSkillListingView';
import { swapsService } from '../../services/swapsService';
import { volunteerService, VolunteerSession } from '../../services/volunteerService';
import { useTheme } from '../../contexts/ThemeContext';
import { VerificationGate } from '../../components/VerificationGate';
import { GuestGate } from '../../components/GuestGate';

const ALL_CATEGORY = 'All';

export default function SkillsScreen() {
  const { C } = useTheme();
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

  const [view, setView] = useState<'browse' | 'my-requests' | 'sessions' | 'add'>('browse');
  const { profile } = useProfile();
  const isVolunteer = !!(profile?.isVolunteer);
  const [mySessions, setMySessions] = useState<VolunteerSession[]>([]);
  const [showSessionForm, setShowSessionForm] = useState(false);
  // --- Session form state ---
  const [sessName, setSessName] = useState('');
  const [sessDesc, setSessDesc] = useState('');
  const [sessSkills, setSessSkills] = useState('');
  const [sessDate, setSessDate] = useState<Date | null>(null);
  const [showSessDatePicker, setShowSessDatePicker] = useState(false);
  const [showSessTimePicker, setShowSessTimePicker] = useState(false);
  const [sessTempDate, setSessTempDate] = useState(new Date());
  const [sessLocType, setSessLocType] = useState<'Remote' | 'In Person'>('Remote');
  const [sessAddress, setSessAddress] = useState('');
  const [sessErrors, setSessErrors] = useState<Record<string, string>>({});
  const [sessSubmitting, setSessSubmitting] = useState(false);
  const [selectedCat, setSelectedCat] = useState(ALL_CATEGORY);
  const [availFilter, setAvailFilter] = useState<'All' | 'Remote' | 'On-site'>('All');
  const [showFilter, setShowFilter] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [requestedSwaps, setRequestedSwaps] = useState<number[]>([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{ ownerId: number; ownerName: string; offeredSkill: string; listingId: number; isFree?: boolean } | null>(null);
  const [addMode, setAddMode] = useState<'listing' | 'offer' | 'want'>('listing');
  const [newListing, setNewListing] = useState({ offer: '', want: '', location: '', availability: 'Remote' as 'Remote' | 'On-site', isFree: false });
  const [newSkill, setNewSkill] = useState({ name: '', description: '', category: '' });
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

  // Load my sessions when Sessions tab is opened
  useEffect(() => {
    if (view === 'sessions' && isLoggedIn && token) {
      volunteerService.getMySessions(token).then(setMySessions).catch(console.error);
    }
  }, [view, isLoggedIn, token]);

  const resetSessionForm = () => {
    setSessName(''); setSessDesc(''); setSessSkills('');
    setSessDate(null); setShowSessDatePicker(false); setShowSessTimePicker(false);
    setSessTempDate(new Date()); setSessLocType('Remote'); setSessAddress('');
    setSessErrors({}); setSessSubmitting(false);
  };

  const validateSessionForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!sessName.trim()) errs.name = 'Session name is required.';
    else if (sessName.trim().length > 100) errs.name = 'Max 100 characters.';
    if (sessDesc.trim().length > 500) errs.desc = 'Max 500 characters.';
    if (!sessDate) errs.date = 'Please select a date and time.';
    else if (sessDate <= new Date()) errs.date = 'Session must be scheduled in the future.';
    if (sessLocType === 'In Person') {
      if (!sessAddress.trim()) errs.address = 'Address is required for in-person sessions.';
      else if (sessAddress.trim().length < 5) errs.address = 'Please enter a more specific address.';
      else if (sessAddress.trim().length > 255) errs.address = 'Max 255 characters.';
    }
    setSessErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSessionSubmit = async () => {
    if (!token || !validateSessionForm() || !sessDate) return;
    setSessSubmitting(true);
    // Build ISO string without timezone offset to avoid backend parsing issues
    const pad = (n: number) => n.toString().padStart(2, '0');
    const isoDateTime = `${sessDate.getFullYear()}-${pad(sessDate.getMonth() + 1)}-${pad(sessDate.getDate())}T${pad(sessDate.getHours())}:${pad(sessDate.getMinutes())}:00`;
    try {
      const created = await volunteerService.createSession({
        name: sessName.trim(),
        description: sessDesc.trim(),
        skills: sessSkills.trim(),
        isoDateTime,
        locationType: sessLocType === 'In Person' ? 'IN_PERSON' : 'REMOTE',
        location: sessLocType === 'In Person' ? sessAddress.trim() : undefined,
      }, token);
      setMySessions(prev => [created, ...prev]);
      showToast('Session created!', 'success');
      setShowSessionForm(false);
      resetSessionForm();
      if (created.groupChatId) {
        setTimeout(() => router.push({ pathname: '/chat', params: { openId: created.groupChatId!.toString() } }), 500);
      }
    } catch (e: any) {
      showToast(e.message ?? 'Failed to create session', 'error');
    } finally {
      setSessSubmitting(false);
    }
  };

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
    setSwapTarget({ ownerId: listing.ownerId, ownerName: listing.ownerName, offeredSkill: listing.offeredSkill, listingId: listing.id, isFree: listing.isFree });
    setShowSwapModal(true);
  };

  const handleSwapConfirm = async (data: { offeredSkill: string; note: string; time: string }) => {
    if (!token || !swapTarget) return;
    try {
      await swapsService.createSwap({
        receiverId: swapTarget.ownerId,
        offeredSkill: swapTarget.isFree ? '' : data.offeredSkill,
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
    if (!newListing.isFree) {
      if (!newListing.want.trim()) errs.want = 'Skill you want is required.';
      else if (newListing.want.trim().length > 100) errs.want = 'Max 100 characters.';
    }
    if (newListing.availability === 'On-site' && !newListing.location.trim()) errs.location = 'Location is required for on-site exchanges.';
    else if (newListing.location.trim().length > 100) errs.location = 'Max 100 characters.';

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSaving(true);
    try {
      await createListing({
        offeredSkill: newListing.offer,
        wantedSkill: newListing.isFree ? '' : newListing.want,
        location: newListing.availability === 'Remote' ? undefined : newListing.location,
        availability: newListing.availability,
        isFree: newListing.isFree,
      });
      setNewListing({ offer: '', want: '', location: '', availability: 'Remote', isFree: false });
      setFormErrors({});
      setView('my-requests');
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
      setView('my-requests');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to add skill', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const formatSessDate = (d: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  };
  const formatSessTime = (d: Date) => {
    const h = d.getHours(); const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${ampm}`;
  };

  const offeredForModal = (Array.isArray(myOffered) ? myOffered : []).map(sk => ({ id: sk.id, name: sk.skillName }));
  const displayCategories = [ALL_CATEGORY, ...(Array.isArray(categories) ? categories.filter(c => c !== ALL_CATEGORY) : [])];

  const s = useMemo(() => StyleSheet.create({
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
    errorTxt: { color: C.violet600, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
    skillsList: { gap: 12 },
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyTxt: { color: C.gray500, fontSize: 14, textAlign: 'center' },
    activeFiltersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
    resultsCount: { fontSize: 13, color: C.gray500, fontWeight: '500' },
    clearFiltersLink: { fontSize: 13, color: C.violet600, fontWeight: '600' },
    loadMoreBtn: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.violet200, alignItems: 'center', marginTop: 4 },
    loadMoreTxt: { fontSize: 14, fontWeight: '600', color: C.violet600 },
    // Sessions tab
    sessionsView: { gap: 12 },
    sessionsHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sessionsSectionTitle: { fontSize: 16, fontWeight: '700', color: C.gray900 },
    createSessionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.violet600, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    createSessionTxt: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
    sessionsEmpty: { paddingVertical: 40, alignItems: 'center' },
    sessionsEmptyTxt: { fontSize: 14, color: C.gray500, textAlign: 'center' },
    sessionCard: { backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.gray100 },
    sessionCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    sessionInfo: { flex: 1 },
    sessionTitle: { fontSize: 14, fontWeight: '600', color: C.gray900, flex: 1, marginRight: 8 },
    sessionMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    sessionMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    sessionMetaTxt: { fontSize: 12, color: C.gray500 },
    sessionStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    sessionStatusTxt: { fontSize: 11, fontWeight: '600' },
    // Create session modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    formSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
    formHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.gray100 },
    formTitle: { fontSize: 18, fontWeight: '700', color: C.gray900 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: C.gray500, letterSpacing: 0.5, marginBottom: 6 },
    fieldInput: { backgroundColor: C.gray50, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.gray900 },
    fieldInputError: { borderColor: '#EF4444' },
    fieldError: { color: '#EF4444', fontSize: 12, marginTop: 4 },
    dateRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    datePill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
    datePillActive: { backgroundColor: C.violet50, borderColor: C.violet600 },
    datePillInactive: { backgroundColor: C.gray50, borderColor: C.gray200 },
    datePillTxt: { fontSize: 13, fontWeight: '600' },
    locToggleRow: { flexDirection: 'row', gap: 8 },
    locToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5 },
    locToggleBtnActive: { backgroundColor: C.violet600, borderColor: C.violet600 },
    locToggleBtnInactive: { backgroundColor: C.gray50, borderColor: C.gray200 },
    locToggleTxt: { fontSize: 13, fontWeight: '600' },
    pickerActionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.gray100 },
    pickerActionTxt: { fontSize: 14, fontWeight: '600', color: C.violet600 },
    pickerActionCancel: { fontSize: 14, fontWeight: '500', color: C.gray500 },
    safetyBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.violet50, borderRadius: 10, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: C.violet200 },
    safetyBannerTxt: { flex: 1, fontSize: 12, color: C.violet700, lineHeight: 17 },
    submitBtn: { backgroundColor: C.violet600, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    submitBtnTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  }), [C]);

  const isVerified = !!(user?.isAgeVerified || user?.isMinorVerified);

  return (
    <View style={{ flex: 1 }}>
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
            {(['browse', 'my-requests', 'sessions'] as const).map(v => (
              <TouchableOpacity key={v} style={[s.viewTab, view === v && s.viewTabActive]} onPress={() => { setView(v); if (v !== 'browse') setSearchText(''); }}>
                <Text style={[s.viewTabTxt, view === v && s.viewTabTxtActive]}>
                  {v === 'browse' ? 'Browse' : v === 'my-requests' ? 'My Requests' : 'Sessions'}
                </Text>
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
                    onViewProfile={(uid) => router.push(`/profile/${uid}`)}
                    onGoToSwaps={() => router.push('/swaps')}
                    onDelete={isDeletingId === skill.id ? undefined : handleDeleteListingConfirm}
                    onManageListing={() => setView('my-requests')}
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

        {/* ── My Requests ── */}
        {view === 'my-requests' && (
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
            onViewProfile={(uid) => router.push(uid ? `/profile/${uid}` : `/profile/${user?.id}`)}
            onGoToProfile={() => router.push(`/profile/${user?.id}`)}
          />
        )}

        {/* ── Sessions ── */}
        {view === 'sessions' && (
          <View style={s.sessionsView}>
            <View style={s.sessionsHdr}>
              <Text style={s.sessionsSectionTitle}>My Sessions</Text>
              {isVolunteer ? (
                <TouchableOpacity style={s.createSessionBtn} onPress={() => setShowSessionForm(true)}>
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={s.createSessionTxt}>Create</Text>
                </TouchableOpacity>
              ) : (
                <View style={[s.createSessionBtn, { backgroundColor: C.gray200 }]}>
                  <Text style={[s.createSessionTxt, { color: C.gray500 }]}>Volunteers Only</Text>
                </View>
              )}
            </View>
            {mySessions.length === 0 ? (
              <View style={s.sessionsEmpty}>
                <Text style={s.sessionsEmptyTxt}>
                  {isVolunteer ? 'No sessions yet. Create your first one!' : 'Become a volunteer to create sessions.'}
                </Text>
              </View>
            ) : (
              mySessions.map(sess => (
                <View key={sess.id} style={s.sessionCard}>
                  <View style={s.sessionCardTop}>
                    <Text style={s.sessionTitle} numberOfLines={1}>{sess.title}</Text>
                    <View style={[s.sessionStatusBadge, { backgroundColor: '#7C3AED' }]}>
                      <Text style={[s.sessionStatusTxt, { color: '#ffffff' }]}>{sess.status}</Text>
                    </View>
                  </View>
                  <View style={s.sessionMeta}>
                    <View style={s.sessionMetaItem}>
                      <Calendar size={12} color={C.gray400} />
                      <Text style={s.sessionMetaTxt}>{sess.date}{sess.time ? ` · ${sess.time}` : ''}</Text>
                    </View>
                    <View style={s.sessionMetaItem}>
                      <Users size={12} color={C.gray400} />
                      <Text style={s.sessionMetaTxt}>{sess.participants} joined</Text>
                    </View>
                    {sess.locationType && (
                      <View style={s.sessionMetaItem}>
                        {sess.locationType === 'IN_PERSON'
                          ? <MapPin size={12} color={C.gray400} />
                          : <Wifi size={12} color={C.gray400} />}
                        <Text style={s.sessionMetaTxt}>{sess.locationType === 'IN_PERSON' ? 'In Person' : 'Remote'}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Add View ── */}
        {view === 'add' && (
          <AddSkillListingView
            addMode={addMode}
            onBack={() => setView('my-requests')}
            isSaving={isSaving}
            formErrors={formErrors}
            newListing={newListing}
            isVolunteer={!!(user?.isVolunteer)}
            onNewListingChange={(f, v) => {
              setNewListing({ ...newListing, [f]: v });
              if (typeof v === 'string' && formErrors[f]) setFormErrors(e => { const n = { ...e }; delete n[f]; return n; });
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
        onGoToSkills={() => setView('my-requests')}
        isFree={swapTarget?.isFree ?? false}
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
    {!isLoggedIn && <GuestGate feature="Skills" />}
    {isLoggedIn && !isVerified && <VerificationGate feature="Skills" />}

    {/* ── Create Session Modal ── */}
    <Modal visible={showSessionForm} transparent animationType="slide" onRequestClose={() => { setShowSessionForm(false); resetSessionForm(); }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.modalOverlay}>
          <View style={s.formSheet}>
            <View style={s.formHdr}>
              <Text style={s.formTitle}>Create Session</Text>
              <TouchableOpacity onPress={() => { setShowSessionForm(false); resetSessionForm(); }}>
                <X size={22} color={C.gray700} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
              {/* Session Name */}
              <View style={{ marginBottom: 16 }}>
                <Text style={s.fieldLabel}>SESSION NAME *</Text>
                <TextInput
                  style={[s.fieldInput, sessErrors.name && s.fieldInputError]}
                  placeholder="e.g. Intro to Coding"
                  placeholderTextColor={C.gray400}
                  value={sessName}
                  onChangeText={v => { setSessName(v); if (sessErrors.name) setSessErrors(e => { const n = {...e}; delete n.name; return n; }); }}
                  maxLength={100}
                />
                {sessErrors.name && <Text style={s.fieldError}>{sessErrors.name}</Text>}
              </View>

              {/* Description */}
              <View style={{ marginBottom: 16 }}>
                <Text style={s.fieldLabel}>DESCRIPTION</Text>
                <TextInput
                  style={[s.fieldInput, { minHeight: 80, textAlignVertical: 'top' }, sessErrors.desc && s.fieldInputError]}
                  placeholder="What will participants learn?"
                  placeholderTextColor={C.gray400}
                  value={sessDesc}
                  onChangeText={v => { setSessDesc(v); if (sessErrors.desc) setSessErrors(e => { const n = {...e}; delete n.desc; return n; }); }}
                  multiline
                  maxLength={500}
                />
                <Text style={{ fontSize: 11, color: C.gray400, textAlign: 'right', marginTop: 2 }}>{sessDesc.length}/500</Text>
                {sessErrors.desc && <Text style={s.fieldError}>{sessErrors.desc}</Text>}
              </View>

              {/* Skills Covered */}
              <View style={{ marginBottom: 16 }}>
                <Text style={s.fieldLabel}>SKILLS COVERED</Text>
                <TextInput
                  style={s.fieldInput}
                  placeholder="e.g. Python, React, Design..."
                  placeholderTextColor={C.gray400}
                  value={sessSkills}
                  onChangeText={setSessSkills}
                />
              </View>

              {/* Date & Time */}
              <View style={{ marginBottom: 16 }}>
                <Text style={s.fieldLabel}>DATE & TIME *</Text>
                <View style={s.dateRow}>
                  <TouchableOpacity
                    style={[s.datePill, sessDate ? s.datePillActive : s.datePillInactive]}
                    onPress={() => { setSessTempDate(sessDate ?? new Date()); setShowSessDatePicker(true); setShowSessTimePicker(false); if (sessErrors.date) setSessErrors(e => { const n = {...e}; delete n.date; return n; }); }}
                  >
                    <Calendar size={14} color={sessDate ? C.violet600 : C.gray400} />
                    <Text style={[s.datePillTxt, { color: sessDate ? C.violet600 : C.gray400 }]}>
                      {sessDate ? formatSessDate(sessDate) : 'Pick a date'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.datePill, sessDate ? s.datePillActive : s.datePillInactive]}
                    onPress={() => { setSessTempDate(sessDate ?? new Date()); setShowSessTimePicker(true); setShowSessDatePicker(false); if (sessErrors.date) setSessErrors(e => { const n = {...e}; delete n.date; return n; }); }}
                  >
                    <Clock size={14} color={sessDate ? C.violet600 : C.gray400} />
                    <Text style={[s.datePillTxt, { color: sessDate ? C.violet600 : C.gray400 }]}>
                      {sessDate ? formatSessTime(sessDate) : 'Pick a time'}
                    </Text>
                  </TouchableOpacity>
                  {sessDate && (
                    <TouchableOpacity onPress={() => setSessDate(null)} style={{ padding: 6 }}>
                      <X size={16} color={C.gray400} />
                    </TouchableOpacity>
                  )}
                </View>
                {sessErrors.date && <Text style={s.fieldError}>{sessErrors.date}</Text>}

                {/* iOS inline date picker */}
                {Platform.OS === 'ios' && showSessDatePicker && (
                  <View style={{ backgroundColor: C.gray50, borderRadius: 12, marginTop: 8 }}>
                    <DateTimePicker
                      value={sessTempDate}
                      mode="date"
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={(_: DateTimePickerEvent, d?: Date) => { if (d) setSessTempDate(d); }}
                      textColor={C.gray900}
                    />
                    <View style={s.pickerActionRow}>
                      <TouchableOpacity onPress={() => setShowSessDatePicker(false)}>
                        <Text style={s.pickerActionCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setShowSessDatePicker(false); setShowSessTimePicker(true); }}>
                        <Text style={s.pickerActionTxt}>Next: Time →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {Platform.OS === 'ios' && showSessTimePicker && (
                  <View style={{ backgroundColor: C.gray50, borderRadius: 12, marginTop: 8 }}>
                    <DateTimePicker
                      value={sessTempDate}
                      mode="time"
                      display="spinner"
                      onChange={(_: DateTimePickerEvent, d?: Date) => { if (d) setSessTempDate(d); }}
                      textColor={C.gray900}
                    />
                    <View style={s.pickerActionRow}>
                      <TouchableOpacity onPress={() => { setShowSessTimePicker(false); setShowSessDatePicker(true); }}>
                        <Text style={s.pickerActionCancel}>← Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setSessDate(sessTempDate); setShowSessTimePicker(false); }}>
                        <Text style={s.pickerActionTxt}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Android native dialogs */}
                {Platform.OS === 'android' && showSessDatePicker && (
                  <DateTimePicker
                    value={sessTempDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(_: DateTimePickerEvent, d?: Date) => {
                      setShowSessDatePicker(false);
                      if (d) { setSessTempDate(d); setShowSessTimePicker(true); }
                    }}
                  />
                )}
                {Platform.OS === 'android' && showSessTimePicker && (
                  <DateTimePicker
                    value={sessTempDate}
                    mode="time"
                    display="default"
                    onChange={(_: DateTimePickerEvent, d?: Date) => {
                      setShowSessTimePicker(false);
                      if (d) { setSessDate(d); setSessErrors(e => { const n = {...e}; delete n.date; return n; }); }
                    }}
                  />
                )}
              </View>

              {/* Location Type */}
              <View style={{ marginBottom: 16 }}>
                <Text style={s.fieldLabel}>LOCATION *</Text>
                <View style={s.locToggleRow}>
                  {(['Remote', 'In Person'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[s.locToggleBtn, sessLocType === type ? s.locToggleBtnActive : s.locToggleBtnInactive]}
                      onPress={() => { setSessLocType(type); setSessAddress(''); setSessErrors(e => { const n = {...e}; delete n.address; return n; }); }}
                    >
                      {type === 'Remote'
                        ? <Wifi size={14} color={sessLocType === type ? '#fff' : C.gray500} />
                        : <MapPin size={14} color={sessLocType === type ? '#fff' : C.gray500} />}
                      <Text style={[s.locToggleTxt, { color: sessLocType === type ? '#fff' : C.gray500 }]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {sessLocType === 'In Person' && (
                  <View style={{ marginTop: 10 }}>
                    <TextInput
                      style={[s.fieldInput, sessErrors.address && s.fieldInputError]}
                      placeholder="Enter address or meeting point"
                      placeholderTextColor={C.gray400}
                      value={sessAddress}
                      onChangeText={v => { setSessAddress(v); if (sessErrors.address) setSessErrors(e => { const n = {...e}; delete n.address; return n; }); }}
                      maxLength={255}
                    />
                    {sessErrors.address && <Text style={s.fieldError}>{sessErrors.address}</Text>}
                    <View style={[s.safetyBanner, { marginTop: 10 }]}>
                      <AlertTriangle size={14} color={C.violet600} style={{ marginTop: 1 }} />
                      <Text style={s.safetyBannerTxt}>
                        Minors joining in-person sessions will require parent/guardian approval before they are added.
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[s.submitBtn, sessSubmitting && { opacity: 0.7 }]}
                onPress={handleSessionSubmit}
                disabled={sessSubmitting}
              >
                {sessSubmitting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.submitBtnTxt}>Create Session</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </View>
  );
}
