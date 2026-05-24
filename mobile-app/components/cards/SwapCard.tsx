import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Clock, CheckCircle, XCircle, MessageCircle, Eye, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { resolveUrl } from '../../utils/helpers';

interface SwapData {
  id: number;
  status: string;
  date: string;
  otherUserId: number;
  otherUserName: string;
  otherUserInitials: string;
  otherUserPicture?: string | null;
  theyOffer: string;
  youOffer: string;
  isRequester: boolean;
  isFinished?: boolean;
  everyoneFinished?: boolean;
  hasRated?: boolean;
}

interface Props {
  swap: SwapData;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  onFinish?: (id: number) => void;
  onRate?: (id: number) => void;
  onChat?: (otherUserId: number) => void;
  onViewProfile?: (userId: number) => void;
}

export const SwapCard: React.FC<Props> = ({
  swap, onAccept, onReject, onFinish, onRate, onChat, onViewProfile
}) => {
  const { C } = useTheme();

  const statusColors = useMemo(() => ({
    pending:                  { bg: C.amber100,  text: C.amber700 },
    pending_parent_approval:  { bg: C.violet50,  text: C.violet600 },
    active:                   { bg: C.violet100, text: C.violet600 },
    completed:                { bg: C.violet100, text: C.violet600 },
    rejected:                 { bg: C.gray200,   text: C.gray500 },
  }), [C]);

  const s = useMemo(() => StyleSheet.create({
    swapCard: { backgroundColor: C.gray100, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.gray200, gap: 12, marginBottom: 12 },
    swapTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    swapUser: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    swapAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
    swapAvatarTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
    swapUserName: { fontWeight: '600', fontSize: 15, color: C.gray900 },
    swapDate: { fontSize: 12, color: C.gray400 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusTxt: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' as any },
    swapSkills: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gray50, borderRadius: 12, padding: 12 },
    swapSkillItem: { flex: 1 },
    swapSkillLabel: { fontSize: 9, fontWeight: '700', color: C.gray400, letterSpacing: 1, marginBottom: 2 },
    swapSkillName: { fontSize: 14, fontWeight: '600', color: C.gray900 },
    swapArrow: { paddingHorizontal: 8 },
    swapArrowTxt: { fontSize: 20, color: C.violet600 },
    swapActions: { flexDirection: 'row', gap: 8 },
    acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.violet600, paddingVertical: 10, borderRadius: 10 },
    acceptTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.red600, paddingVertical: 10, borderRadius: 10 },
    rejectTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
    chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.violet600, paddingVertical: 10, borderRadius: 10 },
    chatTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
    rateFullBtn: { flex: 1, backgroundColor: C.violet600, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    rateFullTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
    finishBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.violet600, paddingVertical: 10, borderRadius: 10 },
    finishTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
    waitingBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.gray200, paddingVertical: 10, borderRadius: 10 },
    waitingTxt: { color: C.gray500, fontWeight: '600', fontSize: 14 },
    parentBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.violet50, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.violet200 },
    parentBannerTxt: { flex: 1, fontSize: 12, color: C.violet600, fontWeight: '500' },
    ratedBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
    ratedBadgeTxt: { color: C.violet600, fontWeight: '600', fontSize: 14 },
  }), [C]);

  const sc = statusColors[swap.status as keyof typeof statusColors] ?? statusColors.pending;

  return (
    <View style={s.swapCard}>
      <View style={s.swapTop}>
        <View style={s.swapUser}>
          <View style={s.swapAvatar}>
      {resolveUrl(swap.otherUserPicture ?? null)
        ? <Image source={{ uri: resolveUrl(swap.otherUserPicture ?? null)! }} style={{ width: '100%', height: '100%', borderRadius: 20 }} resizeMode="cover" />
        : <Text style={s.swapAvatarTxt}>{swap.otherUserInitials}</Text>}
    </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.swapUserName}>{swap.otherUserName}</Text>
              {onViewProfile && (
                <TouchableOpacity onPress={() => onViewProfile(swap.otherUserId)}>
                  <Eye size={16} color={C.violet600} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={s.swapDate}>{swap.date}</Text>
          </View>
        </View>
        <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[s.statusTxt, { color: sc.text }]}>
            {swap.status === 'pending_parent_approval' ? 'Awaiting Parent' : swap.status}
          </Text>
        </View>
      </View>

      <View style={s.swapSkills}>
        <View style={s.swapSkillItem}>
          <Text style={s.swapSkillLabel}>THEY OFFER</Text>
          <Text style={s.swapSkillName}>{swap.theyOffer}</Text>
        </View>
        <View style={s.swapArrow}><Text style={s.swapArrowTxt}>⇄</Text></View>
        <View style={s.swapSkillItem}>
          <Text style={s.swapSkillLabel}>YOU OFFER</Text>
          <Text style={s.swapSkillName}>{swap.youOffer}</Text>
        </View>
      </View>

      <View style={s.swapActions}>
        {swap.status === 'pending_parent_approval' && (
          <View style={{ flexDirection: 'column', gap: 8, flex: 1 }}>
            <View style={s.parentBanner}>
              <ShieldAlert size={16} color={C.violet600} />
              <Text style={s.parentBannerTxt}>
                Waiting for parental approval. An email was sent to the parent/guardian.
              </Text>
            </View>
            <TouchableOpacity style={s.rejectBtn} onPress={() => onReject?.(swap.id)}>
              <XCircle size={16} color="#fff" />
              <Text style={s.rejectTxt}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        )}
        {swap.status === 'pending' && !swap.isRequester && (
          <>
            <TouchableOpacity style={s.acceptBtn} onPress={() => onAccept?.(swap.id)}>
              <CheckCircle size={16} color="#fff" />
              <Text style={s.acceptTxt}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.rejectBtn} onPress={() => onReject?.(swap.id)}>
              <XCircle size={16} color="#fff" />
              <Text style={s.rejectTxt}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
        {swap.status === 'pending' && swap.isRequester && (
          <TouchableOpacity style={s.rejectBtn} onPress={() => onReject?.(swap.id)}>
            <XCircle size={16} color="#fff" />
            <Text style={s.rejectTxt}>Cancel</Text>
          </TouchableOpacity>
        )}
        {swap.status === 'active' && (
          <>
            <TouchableOpacity style={s.chatBtn} onPress={() => onChat?.(swap.otherUserId)}>
              <MessageCircle size={16} color="#fff" />
              <Text style={s.chatTxt}>Chat</Text>
            </TouchableOpacity>
            {!swap.isFinished ? (
              <TouchableOpacity style={s.finishBtn} onPress={() => onFinish?.(swap.id)}>
                <CheckCircle size={16} color="#fff" />
                <Text style={s.finishTxt}>Finish Swap</Text>
              </TouchableOpacity>
            ) : !swap.everyoneFinished ? (
              <View style={s.waitingBtn}>
                <Clock size={16} color={C.gray500} />
                <Text style={s.waitingTxt}>Waiting...</Text>
              </View>
            ) : null}
          </>
        )}
        {swap.status === 'completed' && !swap.hasRated && (
          <TouchableOpacity style={s.rateFullBtn} onPress={() => onRate?.(swap.id)}>
            <Text style={s.rateFullTxt}>Rate Experience</Text>
          </TouchableOpacity>
        )}
        {swap.status === 'completed' && swap.hasRated && (
          <View style={s.ratedBadge}>
            <CheckCircle size={16} color={C.violet600} />
            <Text style={s.ratedBadgeTxt}>Rated</Text>
          </View>
        )}
      </View>
    </View>
  );
};
