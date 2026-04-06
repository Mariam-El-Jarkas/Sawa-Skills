import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { Clock, CheckCircle, XCircle, MessageCircle, Plus, ShieldCheck, Users, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { InlineGuestLoginPrompt } from '../../components/InlineGuestLoginPrompt';
import { C } from '../../components/theme';

const initialSwaps = [
  { id: 1, user: 'Sarah M.', userSkill: 'Cooking', mySkill: 'Guitar Lessons', status: 'pending' as const, date: '2026-03-05', compatibility: 85 },
  { id: 2, user: 'John D.', userSkill: 'Arabic Tutoring', mySkill: 'Web Development', status: 'active' as const, date: '2026-03-03', compatibility: 92 },
  { id: 3, user: 'Maya K.', userSkill: 'Photography', mySkill: 'Guitar Lessons', status: 'completed' as const, date: '2026-03-01', compatibility: 95 },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: C.amber100, text: C.amber700 },
  active: { bg: C.violet100, text: C.violet600 },
  completed: { bg: '#D1FAE5', text: C.emerald600 },
};

export default function SwapsScreen() {
  const router = useRouter();
  const { isLoggedIn, setShowLoginPrompt } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [swaps, setSwaps] = useState(initialSwaps);
  const [ratingSwap, setRatingSwap] = useState<number | null>(null);
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingTxt, setRatingTxt] = useState('');
  const [showVerify, setShowVerify] = useState(false);

  const displayed = isLoggedIn ? (filter === 'all' ? swaps : swaps.filter(s => s.status === filter)) : [];

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <View style={s.body}>
        <Text style={s.title}>My Swaps</Text>
        <Text style={s.subtitle}>{displayed.length} swaps</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
          {(['all', 'pending', 'active', 'completed'] as const).map(f => (
            <TouchableOpacity key={f} style={[s.filterPill, filter === f && s.filterPillActive]} onPress={() => { if (!isLoggedIn) { setShowLoginPrompt(true); return; } setFilter(f); }}>
              <Text style={[s.filterTxt, filter === f && s.filterTxtActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!isLoggedIn && <InlineGuestLoginPrompt featureName="Swaps" />}

        {isLoggedIn && displayed.map(swap => {
          const sc = STATUS_COLORS[swap.status];
          return (
            <View key={swap.id} style={s.swapCard}>
              <View style={s.swapTop}>
                <View style={s.swapUser}>
                  <View style={s.swapAvatar}><Text style={s.swapAvatarTxt}>{swap.user[0]}</Text></View>
                  <View>
                    <Text style={s.swapUserName}>{swap.user}</Text>
                    <Text style={s.swapDate}>{swap.date}</Text>
                  </View>
                </View>
                <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[s.statusTxt, { color: sc.text }]}>{swap.status}</Text>
                </View>
              </View>

              <View style={s.swapSkills}>
                <View style={s.swapSkillItem}>
                  <Text style={s.swapSkillLabel}>THEY OFFER</Text>
                  <Text style={s.swapSkillName}>{swap.userSkill}</Text>
                </View>
                <View style={s.swapArrow}><Text style={s.swapArrowTxt}>⇄</Text></View>
                <View style={s.swapSkillItem}>
                  <Text style={s.swapSkillLabel}>YOU OFFER</Text>
                  <Text style={s.swapSkillName}>{swap.mySkill}</Text>
                </View>
              </View>

              <View style={s.compatRow}>
                <Text style={s.compatTxt}>Match compatibility</Text>
                <Text style={s.compatVal}>{swap.compatibility}%</Text>
              </View>
              <View style={s.compatBar}>
                <View style={[s.compatFill, { width: `${swap.compatibility}%` as any }]} />
              </View>

              <View style={s.swapActions}>
                {swap.status === 'pending' && (
                  <>
                    <TouchableOpacity style={s.acceptBtn} onPress={() => setShowVerify(true)}>
                      <CheckCircle size={16} color={C.white} />
                      <Text style={s.acceptTxt}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.rejectBtn} onPress={() => setSwaps(swaps.filter(sw => sw.id !== swap.id))}>
                      <XCircle size={16} color={C.white} />
                      <Text style={s.rejectTxt}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
                {swap.status === 'active' && (
                  <>
                    <TouchableOpacity style={s.chatBtn} onPress={() => router.push('/chat')}>
                      <MessageCircle size={16} color={C.white} />
                      <Text style={s.chatTxt}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.rateBtn} onPress={() => { setRatingSwap(swap.id); setRatingVal(0); setRatingTxt(''); }}>
                      <Text style={s.rateTxt}>Rate</Text>
                    </TouchableOpacity>
                  </>
                )}
                {swap.status === 'completed' && (
                  <TouchableOpacity style={s.rateFullBtn} onPress={() => { setRatingSwap(swap.id); setRatingVal(0); setRatingTxt(''); }}>
                    <Text style={s.rateFullTxt}>Rate Experience</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {isLoggedIn && displayed.length === 0 && (
          <View style={s.empty}>
            <Clock size={48} color={C.gray300} />
            <Text style={s.emptyTxt}>No {filter !== 'all' ? filter : ''} swaps yet</Text>
          </View>
        )}
      </View>

      {/* Rating Modal */}
      <Modal visible={ratingSwap !== null} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.ratingSheet}>
            <Text style={s.ratingTitle}>Rate Swap</Text>
            <View style={s.starsRow}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRatingVal(star)}>
                  <Text style={[s.star, star <= ratingVal && s.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.ratingInput} placeholder="Write a review (optional)" value={ratingTxt} onChangeText={setRatingTxt} multiline numberOfLines={3} placeholderTextColor={C.gray400} />
            <View style={s.ratingBtns}>
              <TouchableOpacity style={s.ratingCancel} onPress={() => setRatingSwap(null)}><Text style={s.ratingCancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.ratingSubmit} onPress={() => setRatingSwap(null)}><Text style={s.ratingSubmitTxt}>Submit</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Modal */}
      <Modal visible={showVerify} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.verifySheet}>
            <View style={s.verifyHeader}>
              <TouchableOpacity style={s.verifyClose} onPress={() => setShowVerify(false)}><X size={20} color={C.white} /></TouchableOpacity>
              <View style={s.verifyIcon}><ShieldCheck size={32} color={C.white} /></View>
              <Text style={s.verifyTitle}>Verification Required</Text>
              <Text style={s.verifySub}>Please verify your account to continue.</Text>
            </View>
            <View style={s.verifyBody}>
              <Text style={s.verifyDesc}>To ensure a safe community, we require all members to confirm their identity before performing swaps.</Text>
              {[{ icon: ShieldCheck, title: 'Adult Verification', sub: '18 Years or Older' }, { icon: Users, title: 'Minor Verification', sub: 'Under 18 (Parental Approval)' }].map(({ icon: Icon, title, sub }) => (
                <TouchableOpacity key={title} style={s.verifyOption} onPress={() => { setShowVerify(false); router.push('/profile'); }}>
                  <View style={s.verifyOptIcon}><Icon size={20} color={C.violet600} /></View>
                  <View><Text style={s.verifyOptTitle}>{title}</Text><Text style={s.verifyOptSub}>{sub}</Text></View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowVerify(false)}><Text style={s.verifyLater}>Maybe Later</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: C.gray900 },
  subtitle: { fontSize: 13, color: C.gray500, marginTop: -8 },
  filterScroll: { marginBottom: 4 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.gray200, marginRight: 8 },
  filterPillActive: { backgroundColor: C.violet600, borderColor: C.violet600 },
  filterTxt: { fontSize: 13, fontWeight: '500', color: C.gray700 },
  filterTxtActive: { color: C.white, fontWeight: '600' },
  swapCard: { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.gray100, gap: 12 },
  swapTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  swapUser: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swapAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  swapAvatarTxt: { color: C.white, fontWeight: '700', fontSize: 16 },
  swapUserName: { fontWeight: '600', fontSize: 15, color: C.gray900 },
  swapDate: { fontSize: 12, color: C.gray400 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTxt: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  swapSkills: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gray50, borderRadius: 12, padding: 12 },
  swapSkillItem: { flex: 1 },
  swapSkillLabel: { fontSize: 9, fontWeight: '700', color: C.gray400, letterSpacing: 1, marginBottom: 2 },
  swapSkillName: { fontSize: 14, fontWeight: '600', color: C.gray900 },
  swapArrow: { paddingHorizontal: 8 },
  swapArrowTxt: { fontSize: 20, color: C.violet600 },
  compatRow: { flexDirection: 'row', justifyContent: 'space-between' },
  compatTxt: { fontSize: 12, color: C.gray500 },
  compatVal: { fontSize: 12, fontWeight: '700', color: C.violet600 },
  compatBar: { height: 6, backgroundColor: C.gray100, borderRadius: 3, overflow: 'hidden' },
  compatFill: { height: 6, backgroundColor: C.violet600, borderRadius: 3 },
  swapActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.violet600, paddingVertical: 10, borderRadius: 10 },
  acceptTxt: { color: C.white, fontWeight: '600', fontSize: 14 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.red600, paddingVertical: 10, borderRadius: 10 },
  rejectTxt: { color: C.white, fontWeight: '600', fontSize: 14 },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.violet600, paddingVertical: 10, borderRadius: 10 },
  chatTxt: { color: C.white, fontWeight: '600', fontSize: 14 },
  rateBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.violet100 },
  rateTxt: { color: C.violet600, fontWeight: '600', fontSize: 14 },
  rateFullBtn: { flex: 1, backgroundColor: C.violet600, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  rateFullTxt: { color: C.white, fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTxt: { color: C.gray500, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  ratingSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  ratingTitle: { fontSize: 20, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 32, color: C.gray200 },
  starActive: { color: C.yellow400 },
  ratingInput: { backgroundColor: C.gray50, borderRadius: 12, padding: 12, fontSize: 14, height: 80, textAlignVertical: 'top' },
  ratingBtns: { flexDirection: 'row', gap: 10 },
  ratingCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.gray100, alignItems: 'center' },
  ratingCancelTxt: { fontWeight: '600', color: C.gray700 },
  ratingSubmit: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.violet600, alignItems: 'center' },
  ratingSubmitTxt: { fontWeight: '600', color: C.white },
  verifySheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  verifyHeader: { backgroundColor: C.violet600, padding: 24, alignItems: 'center', gap: 8 },
  verifyClose: { position: 'absolute', top: 16, right: 16 },
  verifyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  verifyTitle: { fontSize: 20, fontWeight: '700', color: C.white },
  verifySub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  verifyBody: { padding: 20, gap: 12 },
  verifyDesc: { fontSize: 13, color: C.gray600, textAlign: 'center' },
  verifyOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: C.violet100 },
  verifyOptIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
  verifyOptTitle: { fontWeight: '700', fontSize: 14 },
  verifyOptSub: { fontSize: 11, color: C.gray500, marginTop: 2 },
  verifyLater: { textAlign: 'center', color: C.gray400, fontSize: 13, paddingVertical: 8 },
});
