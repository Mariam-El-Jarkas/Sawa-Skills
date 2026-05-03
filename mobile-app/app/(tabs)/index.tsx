import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, RefreshControl, Modal,
  Animated, Easing, FlatList, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search, MapPin, TrendingUp, Heart, Sparkles, Users,
  Award, ChevronRight, Edit3, Calendar, ArrowLeftRight, X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useHomeData } from '../../hooks/useHomeData';
import { homeService } from '../../services/homeService';
import { volunteerService, VolunteerSession } from '../../services/volunteerService';
import { skillsService } from '../../services/skillsService';
import { useToast } from '../../components/modals/AppToast';
import { C, G } from '../../components/theme';

// ── Emoji / colour maps ───────────────────────────────────────────────────────

const FEATURED_EMOJIS: Record<string, string> = {
  Cooking: '🍳', Music: '🎵', Languages: '🗣️', Tech: '💻',
  Art: '🎨', Sports: '⚽', Business: '💼', Design: '🖌️',
};
const FEATURED_COLORS: Record<string, string> = {
  Cooking: '#FEF3C7', Music: '#EDE9FE', Languages: '#DCFCE7',
  Tech: '#DBEAFE', Art: '#FCE7F3', Sports: '#E0F2FE',
  Business: '#F3E8FF', Design: '#FFEDD5',
};
const TREND_ICONS: Record<string, string> = {
  Photography: '📸', 'Web Design': '🎨', Arabic: '🗣️',
  Cooking: '🍳', Music: '🎵', Tech: '💻',
};

// ── Lebanese cities dataset (fixed) ──────────────────────────────────────────
const LEBANESE_CITIES = [
  'Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Jounieh', 'Baalbek', 'Zahle',
  'Byblos', 'Aley', 'Beit Mery', 'Bcharre', 'Deir el Qamar', 'Batroun',
  'Jdeideh', 'Antelias', 'Dbayeh', 'Mansourieh', 'Broummana', 'Bikfaya',
  'Ghazir', 'Kesrouan', 'Metn', 'Chouf', 'Nabatieh', 'Marjayoun', 'Hasbaya',
  'Rachaya', 'West Bekaa', 'Hermel', 'Akkar', 'Halba', 'Koura', 'Zgharta',
  'Ehden', 'Enfeh', 'Chekka', 'Beit ed-Dine', 'Jezzine', 'Tannourine',
  'Laqlouq', 'Faraya', 'Faqra', 'Ajaltoun', 'Kfardebian', 'Nahr el Kalb',
  'Sarafand', 'Khalde', 'Ouzai', 'Dahieh', 'Ain el Remmaneh',
].sort();


// ── Skeleton pulse helper ─────────────────────────────────────────────────────

function usePulse() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn, user, token, setShowLoginPrompt } = useAuth();
  const { stats, trending, isLoading, refresh } = useHomeData();

  const [categories, setCategories] = useState<string[]>([]);
  const [sessions, setSessions] = useState<VolunteerSession[]>([]);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [confirmingSessionId, setConfirmingSessionId] = useState<number | null>(null);
  const { showToast } = useToast();

  // Location picker
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [savingCity, setSavingCity] = useState(false);
  const [localCity, setLocalCity] = useState<string | null>(null);

  // Animations
  const heroAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;
  const pulse = usePulse();

  // Sync localCity from stats
  useEffect(() => {
    if (stats?.userCity !== undefined) setLocalCity(stats.userCity ?? null);
  }, [stats?.userCity]);

  // Entrance animation
  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(heroAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(bodyAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, []);

  // Fetch categories + sessions on mount
  useEffect(() => {
    skillsService.getCategories().then(setCategories).catch(() => {});
    volunteerService.getAllSessions().then(data => setSessions(data.slice(0, 3))).catch(() => {});
  }, []);

  // ── Location picker ───────────────────────────────────────────────────────

  const openLocationPicker = useCallback(() => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    setCitySearch('');
    setLocationModalVisible(true);
  }, [isLoggedIn, setShowLoginPrompt]);

  const handlePickCity = useCallback(async (city: string) => {
    if (!token) return;
    setSavingCity(true);
    try {
      await homeService.updateLocation(city, token);
      setLocalCity(city);
      setLocationModalVisible(false);
      refresh();
    } catch { /* silent */ } finally {
      setSavingCity(false);
    }
  }, [token, refresh]);

  const filteredCities = citySearch.trim()
    ? LEBANESE_CITIES.filter(c => c.toLowerCase().includes(citySearch.trim().toLowerCase()))
    : LEBANESE_CITIES;

  // ── Join session ──────────────────────────────────────────────────────────

  const handleJoinSession = useCallback((session: VolunteerSession) => {
    if (!isLoggedIn || !token) { setShowLoginPrompt(true); return; }
    if (session.isOrganizer) {
      showToast('You cannot join your own session', 'error');
      return;
    }
    if (session.isJoined) return;
    setConfirmingSessionId(session.id);
  }, [isLoggedIn, token, showToast]);

  const confirmJoinSession = async (session: VolunteerSession) => {
    if (!token) return;
    setJoiningId(session.id);
    try {
      await volunteerService.joinSession(session.id, token);
      setSessions(prev => prev.map(s =>
        s.id === session.id ? { ...s, isJoined: true, participants: s.participants + 1 } : s
      ));
      showToast('Joined Successfully!', 'success');
      setConfirmingSessionId(null);
    } catch (e: any) {
      setConfirmingSessionId(null);
      showToast(e.message ?? 'Failed to join session', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const displayCity = localCity ?? (isLoggedIn ? null : null);
  const pendingCount = stats?.pendingSwapCount ?? 0;
  const activeCount = stats?.activeSwapCount ?? 0;
  const hasSwapActivity = isLoggedIn && stats?.isAuthenticated && (pendingCount + activeCount) > 0;

  const statCards = isLoggedIn && stats?.isAuthenticated
    ? [
        { val: String(stats.swapCount ?? 0), lbl: 'Completed', IconComp: ArrowLeftRight },
        { val: String(stats.connectionCount ?? 0), lbl: 'Connects', IconComp: Users },
        { val: String(stats.avgRating ?? '0.0'), lbl: 'Rating', IconComp: Award },
      ]
    : [
        { val: stats ? `${stats.totalSkills ?? 500}+` : '500+', lbl: 'Skills', IconComp: Sparkles },
        { val: stats ? `${stats.totalMembers ? Math.floor(stats.totalMembers / 1000) + 'k+' : '2k+'}` : '2k+', lbl: 'Members', IconComp: Users },
        { val: stats ? `${stats.totalCities ?? 12}+` : '12+', lbl: 'Cities', IconComp: MapPin },
      ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <ScrollView
        style={s.screen}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={[C.violet600]} tintColor={C.violet600} />
        }
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }}>
          <LinearGradient colors={['#6D28D9', '#8B5CF6', '#A78BFA']} style={s.hero}>

            {/* Location row */}
            <TouchableOpacity style={s.locRow} onPress={openLocationPicker} activeOpacity={0.75}>
              <MapPin size={16} color="rgba(255,255,255,0.9)" />
              <View style={{ flex: 1 }}>
                <Text style={s.locLabel}>Your Location</Text>
                <Text style={s.locVal}>
                  {isLoggedIn
                    ? (displayCity ?? 'Set your location')
                    : 'Lebanon'}
                </Text>
              </View>
              {isLoggedIn && (
                <Edit3
                  size={14}
                  color={displayCity ? 'rgba(255,255,255,0.7)' : '#FDE68A'}
                  style={{ marginLeft: 4 }}
                />
              )}
              {isLoggedIn && !displayCity && (
                <View style={s.setLocBadge}>
                  <Text style={s.setLocBadgeTxt}>Tap to set</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Greeting */}
            <View style={s.heroMsg}>
              {isLoggedIn ? (
                <>
                  <Text style={s.heroTitle}>Welcome back, {user?.name?.split(' ')[0] ?? 'there'}! 👋</Text>
                  <Text style={s.heroSub}>Ready to swap today?</Text>
                </>
              ) : (
                <>
                  <Text style={s.heroTitle}>Discover Skills. Share Talents. 🌟</Text>
                  <Text style={s.heroSub}>Join thousands learning together in Lebanon</Text>
                </>
              )}
            </View>

            {/* Search */}
            <TouchableOpacity style={s.searchWrap} onPress={() => router.push('/skills')} activeOpacity={0.9}>
              <Search size={18} color={C.gray400} style={{ marginRight: 8 }} />
              <Text style={s.searchPlaceholder}>Search skills, people, categories…</Text>
            </TouchableOpacity>

          </LinearGradient>
        </Animated.View>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <Animated.View style={[s.body, { opacity: bodyAnim, transform: [{ translateY: bodyAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>

          {/* Stats row */}
          <View style={s.statsRow}>
            {isLoading && !stats
              ? [1, 2, 3].map(i => (
                  <Animated.View key={i} style={[s.statCard, s.statCardSkeleton, { opacity: pulse }]} />
                ))
              : statCards.map(({ val, lbl, IconComp }) => (
                  <View key={lbl} style={s.statCard}>
                    <LinearGradient colors={G.violet} style={s.statIcon}>
                      <IconComp size={15} color="#fff" />
                    </LinearGradient>
                    <Text style={s.statVal}>{val}</Text>
                    <Text style={s.statLbl}>{lbl}</Text>
                  </View>
                ))}
          </View>

          {/* Swap activity strip */}
          {hasSwapActivity && (
            <TouchableOpacity style={s.activityStrip} onPress={() => router.push('/swaps')} activeOpacity={0.8}>
              <ArrowLeftRight size={16} color={C.violet600} />
              <Text style={s.activityTxt}>
                {activeCount > 0 ? `${activeCount} active` : ''}
                {activeCount > 0 && pendingCount > 0 ? ' · ' : ''}
                {pendingCount > 0 ? `${pendingCount} pending` : ''}
                {' '}swap{activeCount + pendingCount !== 1 ? 's' : ''}
              </Text>
              <ChevronRight size={14} color={C.violet600} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          {/* Quick actions */}
          <View style={s.actionsRow}>
            <TouchableOpacity onPress={() => router.push('/volunteer')} style={s.actionFull}>
              <LinearGradient colors={G.violet} style={s.actionGradient}>
                <Heart size={26} color="#fff" />
                <Text style={s.actionTitle}>Volunteer</Text>
                <Text style={s.actionSub}>Give back to community</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/skills')} style={[s.actionFull, s.actionLight]}>
              <Sparkles size={26} color={C.violet600} />
              <Text style={[s.actionTitle, { color: C.violet600 }]}>Explore</Text>
              <Text style={[s.actionSub, { color: C.violet500 }]}>Browse all skills</Text>
            </TouchableOpacity>
          </View>

          {/* Trending */}
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <TrendingUp size={18} color={C.violet600} />
              <Text style={s.sectionTitle}>Trending This Week</Text>
            </View>
            {isLoading && trending.length === 0
              ? [1, 2, 3].map(i => (
                  <Animated.View key={i} style={[s.trendRow, s.skeleton, { opacity: pulse }]} />
                ))
              : trending.map((sk, i) => (
                  <View key={i} style={s.trendRow}>
                    <Text style={s.trendRank}>#{i + 1}</Text>
                    <Text style={s.trendIcon}>{TREND_ICONS[sk.name] ?? '⭐'}</Text>
                    <Text style={s.trendName}>{sk.name}</Text>
                    <View style={s.trendBadge}>
                      <Text style={s.trendPct}>{sk.swapCount} swaps</Text>
                    </View>
                  </View>
                ))}
          </View>

          {/* Upcoming volunteer sessions */}
          {sessions.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHdr}>
                <Calendar size={18} color={C.violet600} />
                <Text style={s.sectionTitle}>Upcoming Sessions</Text>
                <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push('/volunteer')}>
                  <Text style={s.seeAllTxt}>See all</Text>
                  <ChevronRight size={13} color={C.violet600} />
                </TouchableOpacity>
              </View>
              {sessions.map(ev => (
                <View key={ev.id} style={s.evCard}>
                  <View style={s.evTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.evTitle} numberOfLines={1}>{ev.title}</Text>
                      <Text style={s.evDate}>{ev.date}</Text>
                    </View>
                    <View style={s.evBadge}>
                      <Text style={s.evBadgeTxt}>{ev.status}</Text>
                    </View>
                  </View>
                  <View style={s.evBot}>
                    <View style={s.evAttRow}>
                      <Users size={13} color={C.gray400} />
                      <Text style={s.evAtt}>{ev.participants} joined</Text>
                    </View>
                    {ev.isOrganizer ? (
                      <View style={[s.evBtn, { backgroundColor: C.violet50 }]}>
                        <Text style={[s.evBtnTxt, { color: C.violet600 }]}>Host</Text>
                      </View>
                    ) : confirmingSessionId === ev.id ? (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity style={[s.evBtn, { backgroundColor: C.gray100 }]} onPress={() => setConfirmingSessionId(null)}>
                          <Text style={[s.evBtnTxt, { color: C.gray700 }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.evBtn} onPress={() => confirmJoinSession(ev)}>
                          {joiningId === ev.id ? <ActivityIndicator size="small" color={C.white} /> : <Text style={s.evBtnTxt}>Confirm</Text>}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[s.evBtn, ev.isJoined && s.evBtnJoined]}
                        onPress={() => ev.isJoined ? null : handleJoinSession(ev)}
                        disabled={ev.isJoined || joiningId === ev.id}
                      >
                        {joiningId === ev.id
                          ? <ActivityIndicator size="small" color={C.violet600} />
                          : <Text style={[s.evBtnTxt, ev.isJoined && s.evBtnTxtJoined]}>
                              {ev.isJoined ? '✓ Joined' : 'Join'}
                            </Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Featured categories */}
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <Text style={s.sectionTitle}>Featured Categories</Text>
              <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push('/skills')}>
                <Text style={s.seeAllTxt}>See all</Text>
                <ChevronRight size={13} color={C.violet600} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(cat => (
                <TouchableOpacity key={cat} style={s.featCard} onPress={() => router.push('/skills')}>
                  <View style={[s.featImg, { backgroundColor: FEATURED_COLORS[cat] || '#F3F4F6' }]}>
                    <Text style={s.featEmoji}>{FEATURED_EMOJIS[cat] || '✨'}</Text>
                  </View>
                  <View style={s.featInfo}>
                    <Text style={s.featTitle}>{cat}</Text>
                    <Text style={s.featSub}>Explore →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── Location picker modal ─────────────────────────────────────────── */}
      <Modal visible={locationModalVisible} animationType="slide" transparent onRequestClose={() => setLocationModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHdr}>
              <Text style={s.modalTitle}>Set Your Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={s.modalClose}>
                <X size={20} color={C.gray500} />
              </TouchableOpacity>
            </View>

            <View style={s.citySearchBox}>
              <Search size={16} color={C.gray400} />
              <TextInput
                style={s.citySearchInput}
                placeholder="Search city…"
                placeholderTextColor={C.gray400}
                value={citySearch}
                onChangeText={setCitySearch}
                autoFocus
              />
            </View>

            {savingCity
              ? <ActivityIndicator size="large" color={C.violet600} style={{ marginTop: 32 }} />
              : (
                <FlatList
                  data={filteredCities}
                  keyExtractor={item => item}
                  style={{ maxHeight: 380 }}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <View style={s.cityEmpty}>
                      <Text style={s.cityEmptyTxt}>No match for "{citySearch}"</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[s.cityRow, localCity === item && s.cityRowActive]}
                      onPress={() => handlePickCity(item)}
                    >
                      <MapPin size={16} color={localCity === item ? C.violet600 : C.gray400} />
                      <Text style={[s.cityName, localCity === item && s.cityNameActive]}>
                        {item}
                      </Text>
                      {localCity === item && <Text style={s.cityCheck}>✓</Text>}
                    </TouchableOpacity>
                  )}
                />
              )
            }
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },

  // Hero
  hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingVertical: 4 },
  locLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.3 },
  locVal: { fontSize: 14, fontWeight: '600', color: '#fff' },
  setLocBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginLeft: 4 },
  setLocBadgeTxt: { color: '#FDE68A', fontSize: 11, fontWeight: '600' },
  heroMsg: { marginBottom: 18 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4, lineHeight: 28 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  searchPlaceholder: { fontSize: 14, color: C.gray400, flex: 1 },

  // Body
  body: { padding: 16, gap: 20, paddingBottom: 32 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: C.gray100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statCardSkeleton: { height: 96, backgroundColor: C.gray100 },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal: { fontSize: 20, fontWeight: '800', color: C.violet600 },
  statLbl: { fontSize: 10, color: C.gray500, marginTop: 2 },

  // Swap activity strip
  activityStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.violet50, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: C.violet200,
  },
  activityTxt: { fontSize: 13, color: C.violet600, fontWeight: '600', flex: 1 },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionFull: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  actionGradient: { padding: 18, gap: 4 },
  actionLight: { backgroundColor: C.violet50, padding: 18, borderWidth: 1, borderColor: '#DDD6FE', borderRadius: 16, gap: 4 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: 6 },
  actionSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  // Section
  section: { gap: 10 },
  sectionHdr: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.gray900, flex: 1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: C.violet50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  seeAllTxt: { fontSize: 12, color: C.violet600, fontWeight: '600' },

  // Trending
  trendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.gray100 },
  trendRank: { fontSize: 12, fontWeight: '700', color: C.gray400, width: 24 },
  trendIcon: { fontSize: 18, marginRight: 10 },
  trendName: { flex: 1, fontSize: 14, fontWeight: '500', color: C.gray800 },
  trendBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  trendPct: { color: '#16A34A', fontWeight: '600', fontSize: 12 },
  skeleton: { height: 48, backgroundColor: C.gray100 },

  // Volunteer session cards
  evCard: { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.gray100, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  evTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  evTitle: { fontSize: 14, fontWeight: '600', color: C.gray900 },
  evDate: { fontSize: 12, color: C.gray400, marginTop: 2 },
  evBadge: { backgroundColor: C.violet100, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginLeft: 8 },
  evBadgeTxt: { color: C.violet600, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  evBot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  evAttRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evAtt: { fontSize: 12, color: C.gray500 },
  evBtn: { backgroundColor: C.violet600, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, minWidth: 56, alignItems: 'center' },
  evBtnJoined: { backgroundColor: C.violet100 },
  evBtnTxt: { color: C.white, fontSize: 12, fontWeight: '600' },
  evBtnTxtJoined: { color: C.violet600 },

  // Featured categories
  featCard: { width: 108, backgroundColor: C.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.gray100, marginRight: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  featImg: { width: '100%', height: 68, alignItems: 'center', justifyContent: 'center' },
  featEmoji: { fontSize: 30 },
  featInfo: { padding: 8 },
  featTitle: { fontSize: 12, fontWeight: '600', color: C.gray900, marginBottom: 2 },
  featSub: { fontSize: 10, color: C.violet500, fontWeight: '500' },

  // Location modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 20, paddingHorizontal: 16, paddingTop: 20 },
  modalHdr: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.gray900 },
  modalClose: { padding: 4 },
  citySearchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.gray100, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  citySearchInput: { flex: 1, fontSize: 14, color: C.gray800 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  cityRowActive: { backgroundColor: C.violet50, borderRadius: 10, paddingHorizontal: 10, borderBottomWidth: 0, marginBottom: 1 },
  cityName: { flex: 1, fontSize: 15, color: C.gray800 },
  cityNameActive: { color: C.violet600, fontWeight: '600' },
  cityCheck: { color: C.violet600, fontWeight: '700', fontSize: 16 },
  cityEmpty: { alignItems: 'center', paddingVertical: 32 },
  cityEmptyTxt: { color: C.gray400, fontSize: 14 },
});
