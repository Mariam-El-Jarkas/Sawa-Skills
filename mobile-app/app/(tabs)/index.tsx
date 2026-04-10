import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, MapPin, TrendingUp, Heart, Sparkles, Users, Calendar, Award, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useHomeData } from '../../hooks/useHomeData';
import { C, G } from '../../components/theme';

const FEATURED_EMOJIS: Record<string, string> = {
  Cooking: '🍳', Music: '🎵', Languages: '🗣️', Tech: '💻', Art: '🎨', Sports: '⚽', Business: '💼', Design: '🖌️'
};
const FEATURED_COLORS: Record<string, string> = {
  Cooking: '#FEF3C7', Music: '#EDE9FE', Languages: '#DCFCE7', Tech: '#DBEAFE', Art: '#FCE7F3', Sports: '#E0F2FE', Business: '#F3E8FF', Design: '#FFEDD5'
};

const TREND_ICONS: Record<string, string> = {
  Photography: '📸',
  'Web Design': '🎨',
  Arabic: '🗣️',
  Cooking: '🍳',
  Music: '🎵',
  Tech: '💻',
};


import { skillsService } from '../../services/skillsService';

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn, user, setShowLoginPrompt } = useAuth();
  const { stats, trending, isLoading, refresh } = useHomeData();
  const [categories, setCategories] = useState<string[]>([]);
  const [location] = useState('Beirut');

  useEffect(() => {
    skillsService.getCategories().then(setCategories).catch(console.error);
  }, []);

  // ── Derived stat cards ────────────────────────────────────────────────────
  const statCards = isLoggedIn && stats?.isAuthenticated
    ? [
        { val: String(stats.swapCount ?? 0), lbl: 'Swaps', IconComp: Users },
        { val: String(stats.connectionCount ?? 0), lbl: 'Connects', IconComp: Heart },
        { val: String(stats.avgRating ?? '0.0'), lbl: 'Rating', IconComp: Award },
      ]
    : [
        { val: stats ? `${stats.totalSkills ?? 500}+` : '500+', lbl: 'Skills', IconComp: Sparkles },
        { val: stats ? `${stats.totalMembers ? Math.floor(stats.totalMembers / 1000) + 'k+' : '2k+'}` : '2k+', lbl: 'Members', IconComp: Users },
        { val: stats ? `${stats.totalCities ?? 12}+` : '12+', lbl: 'Cities', IconComp: MapPin },
      ];

  return (
    <ScrollView
      style={s.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={[C.violet600]} tintColor={C.violet600} />
      }
    >
      {/* Hero */}
      <LinearGradient colors={['#6D28D9', '#8B5CF6', '#A78BFA']} style={s.hero}>
        <View style={s.locRow}>
          <MapPin size={18} color="#fff" />
          <View>
            <Text style={s.locLabel}>Your Location</Text>
            <Text style={s.locVal}>{location}</Text>
          </View>
        </View>
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
        <View style={s.searchWrap}>
          <Search size={20} color={C.gray400} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search skills, people, categories..."
            placeholderTextColor={C.gray400}
            onFocus={() => router.push('/skills')}
          />
        </View>
      </LinearGradient>

      <View style={s.body}>
        {/* Stats */}
        <View style={s.statsRow}>
          {isLoading && !stats
            ? [1, 2, 3].map(i => (
                <View key={i} style={[s.statCard, s.statCardSkeleton]} />
              ))
            : statCards.map(({ val, lbl, IconComp }) => (
                <View key={lbl} style={s.statCard}>
                  <LinearGradient colors={G.violet} style={s.statIcon}>
                    <IconComp size={16} color="#fff" />
                  </LinearGradient>
                  <Text style={s.statVal}>{val}</Text>
                  <Text style={s.statLbl}>{lbl}</Text>
                </View>
              ))}
        </View>

        {/* Quick Actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity onPress={() => router.push('/volunteer')} style={s.actionFull}>
            <LinearGradient colors={G.violet} style={s.actionGradient}>
              <Heart size={28} color="#fff" />
              <Text style={s.actionTitle}>Volunteer</Text>
              <Text style={s.actionSub}>Give back to community</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/skills')} style={[s.actionFull, s.actionLight]}>
            <Sparkles size={28} color={C.violet600} />
            <Text style={[s.actionTitle, { color: C.violet600 }]}>Explore</Text>
            <Text style={[s.actionSub, { color: C.violet500 }]}>Browse all skills</Text>
          </TouchableOpacity>
        </View>

        {/* Trending */}
        <View style={s.section}>
          <View style={s.sectionHdr}>
            <TrendingUp size={20} color={C.violet600} />
            <Text style={s.sectionTitle}>Trending This Week</Text>
          </View>
          {isLoading && trending.length === 0
            ? [1, 2, 3].map(i => <View key={i} style={[s.trendRow, s.skeleton]} />)
            : trending.map((sk, i) => (
                <View key={i} style={s.trendRow}>
                  <Text style={s.trendIcon}>{TREND_ICONS[sk.name] ?? '⭐'}</Text>
                  <Text style={s.trendName}>{sk.name}</Text>
                  <View style={s.trendBadge}>
                    <Text style={s.trendPct}>{sk.swapCount} swaps</Text>
                  </View>
                </View>
              ))}
        </View>

        {/* Featured Categories */}
        <View style={s.section}>
          <View style={s.sectionHdr}>
            <Text style={s.sectionTitle}>Featured Categories</Text>
            <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push('/skills')}>
              <Text style={s.seeAllTxt}>See all</Text>
              <ChevronRight size={14} color={C.violet600} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat, idx) => (
              <TouchableOpacity
                key={cat}
                style={s.featCard}
                onPress={() => router.push('/skills')}
              >
                <View style={[s.featImg, { backgroundColor: FEATURED_COLORS[cat] || '#F3F4F6' }]}>
                  <Text style={s.featEmoji}>{FEATURED_EMOJIS[cat] || '✨'}</Text>
                </View>
                <View style={s.featInfo}>
                  <Text style={s.featTitle}>{cat}</Text>
                  <Text style={s.featUsers}>Explore</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Events */}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  hero: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  locLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  locVal: { fontSize: 15, fontWeight: '600', color: '#fff' },
  heroMsg: { marginBottom: 20 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: C.gray800 },
  body: { padding: 16, gap: 20 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: C.gray100 },
  statCardSkeleton: { height: 90, backgroundColor: C.gray100 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal: { fontSize: 22, fontWeight: '700', color: C.violet600 },
  statLbl: { fontSize: 11, color: C.gray500 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionFull: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  actionGradient: { padding: 20, gap: 4 },
  actionLight: { backgroundColor: C.violet50, padding: 20, borderWidth: 1, borderColor: '#DDD6FE', borderRadius: 16, gap: 4 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 8 },
  actionSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  section: { gap: 12 },
  sectionHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.gray900, flex: 1 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.violet50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  seeAllTxt: { fontSize: 13, color: C.violet600, fontWeight: '600' },
  trendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: C.gray100 },
  trendIcon: { fontSize: 20, marginRight: 12 },
  trendName: { flex: 1, fontSize: 15, fontWeight: '500', color: C.gray800 },
  trendBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  trendPct: { color: '#16A34A', fontWeight: '600', fontSize: 13 },
  skeleton: { height: 48, backgroundColor: C.gray100 },
  evCard: { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.gray100 },
  evTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  evTitle: { fontSize: 15, fontWeight: '600', color: C.gray900 },
  evDate: { fontSize: 12, color: C.gray400, marginTop: 2 },
  evBadge: { backgroundColor: C.violet100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, height: 26 },
  evBadgeTxt: { color: C.violet600, fontSize: 12, fontWeight: '600' },
  evBot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  evAttRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evAtt: { fontSize: 12, color: C.gray500 },
  evBtn: { backgroundColor: C.violet600, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  evBtnJoined: { backgroundColor: C.violet100 },
  evBtnTxt: { color: C.white, fontSize: 12, fontWeight: '600' },
  evBtnTxtJoined: { color: C.violet600 },
  featCard: { width: 110, backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.gray100, marginRight: 10 },
  featImg: { width: '100%', height: 72, alignItems: 'center', justifyContent: 'center' },
  featEmoji: { fontSize: 32 },
  featInfo: { padding: 8 },
  featTitle: { fontSize: 13, fontWeight: '600', color: C.gray900, marginBottom: 2 },
  featUsers: { fontSize: 11, color: C.gray400 },
});
