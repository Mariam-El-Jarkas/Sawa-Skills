import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, MapPin, TrendingUp, Heart, Sparkles, Users, Calendar, Award } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { C, G } from '../../components/theme';

const featuredSkills = [
  { id: 1, title: 'Cooking', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', users: 234 },
  { id: 2, title: 'Music', image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400', users: 189 },
  { id: 3, title: 'Languages', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400', users: 456 },
];
const trendingSkills = [
  { name: 'Photography', trend: '+24%', icon: '📸' },
  { name: 'Web Design', trend: '+18%', icon: '🎨' },
  { name: 'Arabic', trend: '+15%', icon: '🗣️' },
];
const upcomingEvents = [
  { id: 1, title: 'Cooking Masterclass', date: 'Mar 5, 2026', attendees: 24, category: 'Cooking' },
  { id: 2, title: 'Language Exchange Meetup', date: 'Mar 8, 2026', attendees: 45, category: 'Languages' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn, user, setShowLoginPrompt } = useAuth();
  const [joinedEvents, setJoinedEvents] = useState<number[]>([]);
  const [location] = useState('Beirut');

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
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
          <TextInput style={s.searchInput} placeholder="Search skills, people, categories..." placeholderTextColor={C.gray400} />
        </View>
      </LinearGradient>

      <View style={s.body}>
        {/* Stats */}
        <View style={s.statsRow}>
          {(isLoggedIn
            ? [{ val: '24', lbl: 'Swaps', IconComp: Users }, { val: '12', lbl: 'Connects', IconComp: Heart }, { val: '4.8', lbl: 'Rating', IconComp: Award }]
            : [{ val: '500+', lbl: 'Skills', IconComp: Sparkles }, { val: '2k+', lbl: 'Members', IconComp: Users }, { val: '12+', lbl: 'Cities', IconComp: MapPin }]
          ).map(({ val, lbl, IconComp }) => (
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
          {trendingSkills.map((sk, i) => (
            <View key={i} style={s.trendRow}>
              <Text style={s.trendIcon}>{sk.icon}</Text>
              <Text style={s.trendName}>{sk.name}</Text>
              <View style={s.trendBadge}><Text style={s.trendPct}>{sk.trend}</Text></View>
            </View>
          ))}
        </View>

        {/* Featured Categories */}
        <View style={s.section}>
          <View style={s.sectionHdr}>
            <Text style={s.sectionTitle}>Featured Categories</Text>
            <TouchableOpacity onPress={() => router.push('/skills')}><Text style={s.seeAll}>See all →</Text></TouchableOpacity>
          </View>
          <View style={s.featRow}>
            {featuredSkills.map(sk => (
              <View key={sk.id} style={s.featCard}>
                <Image source={{ uri: sk.image }} style={s.featImg} />
                <View style={s.featInfo}>
                  <Text style={s.featTitle}>{sk.title}</Text>
                  <Text style={s.featUsers}>{sk.users} users</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Events */}
        <View style={[s.section, { marginBottom: 32 }]}>
          <View style={s.sectionHdr}>
            <Calendar size={20} color={C.violet600} />
            <Text style={s.sectionTitle}>Upcoming Events</Text>
          </View>
          {upcomingEvents.map(ev => (
            <View key={ev.id} style={s.evCard}>
              <View style={s.evTop}>
                <View>
                  <Text style={s.evTitle}>{ev.title}</Text>
                  <Text style={s.evDate}>{ev.date}</Text>
                </View>
                <View style={s.evBadge}><Text style={s.evBadgeTxt}>{ev.category}</Text></View>
              </View>
              <View style={s.evBot}>
                <View style={s.evAttRow}>
                  <Users size={14} color={C.gray500} />
                  <Text style={s.evAtt}>{ev.attendees} attending</Text>
                </View>
                <TouchableOpacity
                  style={[s.evBtn, joinedEvents.includes(ev.id) && s.evBtnJoined]}
                  onPress={() => {
                    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
                    if (!joinedEvents.includes(ev.id)) setJoinedEvents([...joinedEvents, ev.id]);
                  }}
                >
                  <Text style={[s.evBtnTxt, joinedEvents.includes(ev.id) && s.evBtnTxtJoined]}>
                    {joinedEvents.includes(ev.id) ? 'Joined ✓' : 'Join Event'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
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
  seeAll: { fontSize: 14, color: C.violet600, fontWeight: '600' },
  trendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: C.gray100 },
  trendIcon: { fontSize: 20, marginRight: 12 },
  trendName: { flex: 1, fontSize: 15, fontWeight: '500', color: C.gray800 },
  trendBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  trendPct: { color: '#16A34A', fontWeight: '600', fontSize: 13 },
  featRow: { flexDirection: 'row', gap: 10 },
  featCard: { flex: 1, backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.gray100 },
  featImg: { width: '100%', height: 80 },
  featInfo: { padding: 8 },
  featTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  featUsers: { fontSize: 11, color: C.gray400 },
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
});
