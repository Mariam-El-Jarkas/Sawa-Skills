import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Modal, ActivityIndicator, Alert, StyleSheet, RefreshControl } from 'react-native';
import { Search, Filter, Plus, MapPin, Star, ArrowLeft, Globe, X, Trash2, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSkills } from '../../hooks/useSkills';
import { SwapRequestModal } from '../../components/SwapRequestModal';
import { swapsService } from '../../services/swapsService';
import { C } from '../../components/theme';

const ALL_CATEGORY = 'All';

export default function SkillsScreen() {
  const router = useRouter();
  const { isLoggedIn, token, setShowLoginPrompt } = useAuth();
  const {
    listings, categories, myListings, myOffered, myWanted,
    isLoading, isMyDataLoading, error,
    fetchListings, fetchMyData,
    createListing, deleteListing,
    addOfferedSkill, addWantedSkill, toggleVisibility,
  } = useSkills();

  const [view, setView] = useState<'browse' | 'my-exchange' | 'add'>('browse');
  const [selectedCat, setSelectedCat] = useState(ALL_CATEGORY);
  const [availFilter, setAvailFilter] = useState<'All' | 'Remote' | 'On-site'>('All');
  const [showFilter, setShowFilter] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [requestedSwaps, setRequestedSwaps] = useState<number[]>([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{ ownerId: number; ownerName: string; offeredSkill: string; listingId: number } | null>(null);
  const [addMode, setAddMode] = useState<'listing' | 'offer' | 'want'>('listing');
  const [newListing, setNewListing] = useState({ offer: '', want: '', location: '' });
  const [newSkill, setNewSkill] = useState({ name: '', description: '', category: 'Tech' });
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load my data when switching to my-exchange tab
  useEffect(() => {
    if (view === 'my-exchange' && isLoggedIn) {
      fetchMyData();
    }
  }, [view, isLoggedIn]);

  // Re-fetch on filter changes with debounce (handled inside useSkills)
  useEffect(() => {
    fetchListings({ search: searchText || undefined, category: selectedCat, availability: availFilter });
  }, [searchText, selectedCat, availFilter]);

  const displayCategories = [ALL_CATEGORY, ...categories.filter(c => c !== ALL_CATEGORY)];

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
      }, token);
      setRequestedSwaps(prev => [...prev, swapTarget.listingId]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to send swap request');
    }
  };

  const handleCreateListing = async () => {
    const errs: Record<string, string> = {};
    if (!newListing.offer.trim()) errs.offer = 'Skill you offer is required.';
    else if (newListing.offer.trim().length > 100) errs.offer = 'Max 100 characters.';
    if (!newListing.want.trim()) errs.want = 'Skill you want is required.';
    else if (newListing.want.trim().length > 100) errs.want = 'Max 100 characters.';
    if (newListing.location.trim().length > 100) errs.location = 'Max 100 characters.';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSaving(true);
    try {
      await createListing({ offeredSkill: newListing.offer, wantedSkill: newListing.want, location: newListing.location, availability: 'On-site' });
      setNewListing({ offer: '', want: '', location: '' });
      setFormErrors({});
      setView('my-exchange');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create listing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async () => {
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
      Alert.alert('Error', e.message ?? 'Failed to add skill');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteListing = async (id: number) => {
    try {
      await deleteListing(id);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to delete listing');
    }
  };

  // Offered skills formatted for SwapRequestModal
  const offeredForModal = myOffered.map(s => ({ id: s.id, name: s.skillName }));

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
              <TouchableOpacity key={v} style={[s.viewTab, view === v && s.viewTabActive]} onPress={() => setView(v)}>
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
              <TouchableOpacity style={s.filterBtn} onPress={() => setShowFilter(true)}>
                <Filter size={20} color={C.gray700} />
              </TouchableOpacity>
            </View>

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
                  <View key={skill.id} style={s.skillCard}>
                    <View style={s.skillTop}>
                      <View style={s.skillAvatarWrap}>
                        <View style={s.skillAvatar}>
                          <Text style={s.skillAvatarTxt}>{skill.ownerInitials}</Text>
                        </View>
                      </View>
                      <View style={s.skillInfo}>
                        <View style={s.skillInfoTop}>
                          <View>
                            <Text style={s.skillUser}>{skill.ownerName}</Text>
                            <View style={s.locRow}>
                              {skill.availability === 'Remote' ? <Globe size={12} color={C.gray500} /> : <MapPin size={12} color={C.gray500} />}
                              <Text style={s.locTxt}>{skill.location ?? skill.availability ?? 'Flexible'}</Text>
                            </View>
                          </View>
                          <View style={s.ratingRow}>
                            <Star size={14} color={C.yellow400} fill={C.yellow400} />
                            <Text style={s.ratingTxt}>{skill.avgRating > 0 ? skill.avgRating.toFixed(1) : '—'}</Text>
                          </View>
                        </View>
                        <Text style={s.offersTxt}>Offers: <Text style={s.offersSkill}>{skill.offeredSkill}</Text></Text>
                        <Text style={s.wantsTxt}>Wants: <Text style={s.wantsSkill}>{skill.wantedSkill}</Text></Text>
                      </View>
                    </View>
                    <View style={s.skillBtns}>
                      <TouchableOpacity
                        style={[s.reqBtn, requestedSwaps.includes(skill.id) && s.reqBtnDone]}
                        onPress={() => handleRequestSwap(skill)}
                      >
                        <Text style={[s.reqBtnTxt, requestedSwaps.includes(skill.id) && s.reqBtnTxtDone]}>
                          {requestedSwaps.includes(skill.id) ? 'Requested ✓' : 'Request Swap'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.profileBtn} onPress={() => router.push(`/profile?userId=${skill.ownerId}`)}>
                        <Text style={s.profileBtnTxt}>View Profile</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── My Exchange ── */}
        {view === 'my-exchange' && (
          <View style={s.myExchange}>
            <Text style={s.meTitle}>My Exchange</Text>
            <Text style={s.meSub}>Manage your listings and skills</Text>
            <TouchableOpacity style={s.createBtn} onPress={() => { setView('add'); setAddMode('listing'); }}>
              <Plus size={20} color="#fff" />
              <Text style={s.createBtnTxt}>Create New Listing</Text>
            </TouchableOpacity>

            {isMyDataLoading ? (
              <ActivityIndicator size="small" color={C.violet600} style={{ marginTop: 16 }} />
            ) : (
              <>
                <Text style={s.meSection}>ACTIVE LISTINGS</Text>
                {myListings.length === 0 && <Text style={s.emptyTxt}>No listings yet.</Text>}
                {myListings.map(l => (
                  <View key={l.id} style={s.listingCard}>
                    <View style={s.listingTop}>
                      <View style={s.listingLoc}>
                        <MapPin size={13} color={C.gray500} />
                        <Text style={s.listingLocTxt}>{l.location ?? l.availability ?? 'Flexible'}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteListing(l.id)}>
                        <Trash2 size={16} color={C.gray400} />
                      </TouchableOpacity>
                    </View>
                    <View style={s.listingRow}><View style={s.offerTag}><Text style={s.offerTagTxt}>OFFER</Text></View><Text style={s.listingSkill}>{l.offeredSkill}</Text></View>
                    <View style={s.listingRow}><View style={s.wantTag}><Text style={s.wantTagTxt}>WANT</Text></View><Text style={s.listingSkill}>{l.wantedSkill}</Text></View>
                  </View>
                ))}

                <Text style={[s.meSection, { marginTop: 20 }]}>SKILLS I OFFER</Text>
                <TouchableOpacity onPress={() => { setView('add'); setAddMode('offer'); }} style={s.addLink}><Text style={s.addLinkTxt}>+ Add</Text></TouchableOpacity>
                {myOffered.map(sk => (
                  <View key={sk.id} style={s.skillRow}>
                    <View style={s.skillRowInfo}>
                      <Text style={s.skillRowName}>{sk.skillName}</Text>
                      {sk.category && <Text style={s.skillRowDesc}>{sk.category}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => toggleVisibility(sk.id)}>
                      <Eye size={18} color={C.violet600} />
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={[s.meSection, { marginTop: 20 }]}>SKILLS I WANT</Text>
                <TouchableOpacity onPress={() => { setView('add'); setAddMode('want'); }} style={s.addLink}><Text style={s.addLinkTxt}>+ Add</Text></TouchableOpacity>
                {myWanted.map(sk => (
                  <View key={sk.id} style={s.skillRow}>
                    <View style={s.skillRowInfo}>
                      <Text style={s.skillRowName}>{sk.skillName}</Text>
                      {sk.category && <Text style={s.skillRowDesc}>{sk.category}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => toggleVisibility(sk.id)}>
                      <Eye size={18} color={C.violet600} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ── Add View ── */}
        {view === 'add' && (
          <View style={s.addView}>
            <View style={s.addHeader}>
              <TouchableOpacity onPress={() => setView('my-exchange')} style={s.backBtn}><ArrowLeft size={20} color={C.gray700} /></TouchableOpacity>
              <Text style={s.addTitle}>{addMode === 'listing' ? 'Create Exchange Listing' : addMode === 'offer' ? 'Add Skill to Offer' : 'Add Skill to Learn'}</Text>
            </View>
            <View style={s.addForm}>
              {addMode === 'listing' ? (
                <>
                  {(['location', 'offer', 'want'] as const).map(field => (
                  <View key={field}>
                    <Text style={s.fieldLabel}>{field.toUpperCase()}{field !== 'location' ? ' *' : ''}</Text>
                    <TextInput
                      style={[s.fieldInput, formErrors[field] ? s.fieldInputError : null]}
                      value={newListing[field]}
                      onChangeText={v => {
                        setNewListing({ ...newListing, [field]: v });
                        if (formErrors[field]) setFormErrors(e => { const n = { ...e }; delete n[field]; return n; });
                      }}
                      placeholder={field === 'location' ? 'e.g. Beirut or Remote' : `Skill you ${field}`}
                      placeholderTextColor={C.gray400}
                      maxLength={field === 'location' ? 100 : 100}
                    />
                    {formErrors[field] && <Text style={s.fieldError}>{formErrors[field]}</Text>}
                  </View>
                ))}
                  <TouchableOpacity style={[s.publishBtn, isSaving && s.publishBtnDisabled]} onPress={handleCreateListing} disabled={isSaving}>
                    <Text style={s.publishBtnTxt}>{isSaving ? 'Publishing...' : 'Publish Listing'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={s.fieldLabel}>SKILL NAME *</Text>
                  <TextInput
                    style={[s.fieldInput, formErrors.name ? s.fieldInputError : null]}
                    value={newSkill.name}
                    onChangeText={v => {
                      setNewSkill({ ...newSkill, name: v });
                      if (formErrors.name) setFormErrors(e => { const n = { ...e }; delete n.name; return n; });
                    }}
                    placeholder="e.g. Graphic Design"
                    placeholderTextColor={C.gray400}
                    maxLength={100}
                  />
                  {formErrors.name && <Text style={s.fieldError}>{formErrors.name}</Text>}
                  <Text style={s.fieldLabel}>SHORT DESCRIPTION</Text>
                  <TextInput
                    style={[s.fieldInput, s.textarea, formErrors.description ? s.fieldInputError : null]}
                    value={newSkill.description}
                    onChangeText={v => {
                      setNewSkill({ ...newSkill, description: v });
                      if (formErrors.description) setFormErrors(e => { const n = { ...e }; delete n.description; return n; });
                    }}
                    placeholder="Briefly describe..."
                    multiline
                    placeholderTextColor={C.gray400}
                    maxLength={300}
                  />
                  <Text style={[s.fieldLabel, { textAlign: 'right', marginTop: -8 }]}>{newSkill.description.length}/300</Text>
                  {formErrors.description && <Text style={s.fieldError}>{formErrors.description}</Text>}
                  <TouchableOpacity style={[s.publishBtn, isSaving && s.publishBtnDisabled]} onPress={handleAddSkill} disabled={isSaving}>
                    <Text style={s.publishBtnTxt}>{isSaving ? 'Saving...' : 'Save to Profile'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilter} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.filterSheet}>
            <View style={s.filterHdr}>
              <Text style={s.filterTitle}>Filter Skills</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}><X size={22} color={C.gray700} /></TouchableOpacity>
            </View>
            <Text style={s.filterLabel}>CATEGORY</Text>
            <View style={s.filterGrid}>
              {categories.map(cat => (
                <TouchableOpacity key={cat} style={[s.filterOpt, selectedCat === cat && s.filterOptActive]} onPress={() => setSelectedCat(cat)}>
                  <Text style={[s.filterOptTxt, selectedCat === cat && s.filterOptTxtActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.filterLabel, { marginTop: 16 }]}>AVAILABILITY</Text>
            <View style={s.availRow}>
              {(['All', 'Remote', 'On-site'] as const).map(t => (
                <TouchableOpacity key={t} style={[s.availOpt, availFilter === t && s.availOptActive]} onPress={() => setAvailFilter(t)}>
                  <Text style={[s.availTxt, availFilter === t && s.availTxtActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.applyBtn} onPress={() => setShowFilter(false)}>
              <Text style={s.applyBtnTxt}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SwapRequestModal
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        targetUser={swapTarget?.ownerName ?? ''}
        targetSkill={swapTarget?.offeredSkill ?? ''}
        userSkills={offeredForModal.length > 0 ? offeredForModal : [{ id: 0, name: 'My Skill' }]}
        onConfirm={handleSwapConfirm}
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
  skillsList: { gap: 12 },
  skillCard: { backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#DDD6FE' },
  skillTop: { flexDirection: 'row' },
  skillAvatarWrap: { width: 80, alignItems: 'center', justifyContent: 'center', padding: 12 },
  skillAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  skillAvatarTxt: { color: C.white, fontWeight: '700', fontSize: 18 },
  skillInfo: { flex: 1, padding: 10 },
  skillInfoTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  skillUser: { fontSize: 14, fontWeight: '600', color: C.gray900 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locTxt: { fontSize: 12, color: C.gray500 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTxt: { fontSize: 13, fontWeight: '600' },
  offersTxt: { fontSize: 13, color: C.gray500 },
  offersSkill: { color: C.violet600, fontWeight: '600' },
  wantsTxt: { fontSize: 13, color: C.gray500 },
  wantsSkill: { fontWeight: '500', color: C.gray800 },
  skillBtns: { flexDirection: 'row', gap: 8, padding: 10 },
  reqBtn: { flex: 1, paddingVertical: 8, backgroundColor: C.violet600, borderRadius: 8, alignItems: 'center' },
  reqBtnDone: { backgroundColor: C.violet100 },
  reqBtnTxt: { color: C.white, fontSize: 13, fontWeight: '600' },
  reqBtnTxtDone: { color: C.violet600 },
  profileBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6FE' },
  profileBtnTxt: { color: C.violet600, fontSize: 13, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { color: C.gray500, fontSize: 14, textAlign: 'center' },
  errorTxt: { color: '#DC2626', fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  myExchange: { gap: 12 },
  meTitle: { fontSize: 22, fontWeight: '700', color: C.gray900 },
  meSub: { fontSize: 13, color: C.gray500, marginTop: -8 },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.violet600, paddingVertical: 14, borderRadius: 14 },
  createBtnTxt: { color: C.white, fontWeight: '700', fontSize: 15 },
  meSection: { fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 1 },
  listingCard: { backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.gray100, gap: 8 },
  listingTop: { flexDirection: 'row', justifyContent: 'space-between' },
  listingLoc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listingLocTxt: { fontSize: 12, color: C.gray500, fontWeight: '600' },
  listingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listingSkill: { fontWeight: '600', fontSize: 14, color: C.gray900 },
  offerTag: { backgroundColor: C.violet50, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  offerTagTxt: { fontSize: 9, fontWeight: '700', color: C.violet600 },
  wantTag: { backgroundColor: C.gray50, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  wantTagTxt: { fontSize: 9, fontWeight: '700', color: C.gray600 },
  addLink: { alignSelf: 'flex-end', marginTop: -8 },
  addLinkTxt: { color: C.violet600, fontWeight: '700', fontSize: 13 },
  skillRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.gray100, gap: 8 },
  skillRowInfo: { flex: 1 },
  skillRowName: { fontWeight: '700', fontSize: 14 },
  skillRowDesc: { fontSize: 11, color: C.gray500 },
  addView: { gap: 16 },
  addHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 8, backgroundColor: C.gray100, borderRadius: 20 },
  addTitle: { fontSize: 17, fontWeight: '700', color: C.gray900, flex: 1 },
  addForm: { backgroundColor: C.white, borderRadius: 20, padding: 20, gap: 12, borderWidth: 1, borderColor: C.gray100 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.gray400, letterSpacing: 1, marginBottom: 4 },
  fieldInput: { backgroundColor: C.gray50, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: '600', color: C.gray900 },
  fieldInputError: { borderWidth: 1.5, borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  fieldError: { fontSize: 12, color: '#DC2626', marginTop: 3, marginLeft: 4 },
  textarea: { height: 72, textAlignVertical: 'top' },
  publishBtn: { backgroundColor: C.violet600, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  publishBtnDisabled: { opacity: 0.6 },
  publishBtnTxt: { color: C.white, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  filterHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterTitle: { fontSize: 20, fontWeight: '700' },
  filterLabel: { fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 1, marginBottom: 10 },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterOpt: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: C.gray50 },
  filterOptActive: { backgroundColor: C.violet600 },
  filterOptTxt: { fontWeight: '700', fontSize: 13, color: C.gray600 },
  filterOptTxtActive: { color: C.white },
  availRow: { flexDirection: 'row', gap: 8 },
  availOpt: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: C.gray100, alignItems: 'center', backgroundColor: C.white },
  availOptActive: { borderColor: C.violet600, backgroundColor: C.violet50 },
  availTxt: { fontWeight: '700', fontSize: 13, color: C.gray500 },
  availTxtActive: { color: C.violet600 },
  applyBtn: { backgroundColor: C.violet600, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  applyBtnTxt: { color: C.white, fontWeight: '700', fontSize: 15 },
});
