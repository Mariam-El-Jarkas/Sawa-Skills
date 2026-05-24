import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Plus, FileText, ArrowRight } from 'lucide-react-native';
import { ListingCard } from '../cards/ListingCard';
import { useTheme } from '../../contexts/ThemeContext';

interface MySkill { id: number; skillName: string; category?: string | null; }

interface Props {
  isLoading: boolean;
  myListings: any[];
  myOffered: MySkill[];
  myWanted: MySkill[];
  onAddListing: () => void;
  onAddOffered: () => void;
  onAddWanted: () => void;
  onDeleteListing: (id: number) => void;
  onViewProfile: (userId?: number) => void;
  onGoToProfile?: () => void;
  isDeletingId?: number | null;
}

export function MyExchangeView({
  isLoading, myListings,
  onAddListing, onDeleteListing, onViewProfile, onGoToProfile, isDeletingId,
}: Props) {
  const { C } = useTheme();

  const s = useMemo(() => StyleSheet.create({
    container: { gap: 16 },
    pageHdr: { gap: 4 },
    pageTitle: { fontSize: 20, fontWeight: '700', color: C.gray900 },
    pageSub: { fontSize: 13, color: C.gray500 },
    createBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: C.violet600, paddingVertical: 15, borderRadius: 16,
      shadowColor: C.violet600, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    createBtnTxt: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 1 },
    emptyCard: {
      alignItems: 'center', paddingVertical: 36, gap: 10,
      backgroundColor: C.gray50, borderRadius: 16, borderWidth: 1,
      borderColor: C.gray200, borderStyle: 'dashed' as any,
    },
    emptyIcon: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: C.violet50, alignItems: 'center', justifyContent: 'center',
    },
    emptyTitle: { fontSize: 15, fontWeight: '600', color: C.gray700 },
    emptyHint: { fontSize: 13, color: C.gray400, textAlign: 'center', paddingHorizontal: 24 },
    emptyBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: C.violet50, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20,
    },
    emptyBtnTxt: { fontSize: 13, fontWeight: '600', color: C.violet600 },
    skillsNotice: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: C.violet50, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: C.violet100,
    },
    skillsNoticeLeft: { flex: 1, gap: 2 },
    skillsNoticeTitle: { fontSize: 13, fontWeight: '700', color: C.gray900 },
    skillsNoticeSub: { fontSize: 12, color: C.gray600 },
  }), [C]);

  if (isLoading) return <ActivityIndicator size="small" color={C.violet600} style={{ marginTop: 32 }} />;

  return (
    <View style={s.container}>
      <View style={s.pageHdr}>
        <Text style={s.pageTitle}>My Requests</Text>
        <Text style={s.pageSub}>Your active skill exchange listings</Text>
      </View>

      <TouchableOpacity style={s.createBtn} onPress={onAddListing}>
        <Plus size={20} color="#FFFFFF" />
        <Text style={s.createBtnTxt}>Create New Listing</Text>
      </TouchableOpacity>

      <Text style={s.sectionLabel}>ACTIVE LISTINGS</Text>

      {Array.isArray(myListings) && myListings.length === 0 ? (
        <View style={s.emptyCard}>
          <View style={s.emptyIcon}><FileText size={24} color={C.violet600} /></View>
          <Text style={s.emptyTitle}>No listings yet</Text>
          <Text style={s.emptyHint}>Create your first listing to start exchanging skills with others.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={onAddListing}>
            <Plus size={14} color={C.violet600} />
            <Text style={s.emptyBtnTxt}>Create Listing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        Array.isArray(myListings) && myListings.map(l => (
          <ListingCard
            key={l.id}
            listing={l}
            isOwnListing
            onDelete={isDeletingId === l.id ? undefined : onDeleteListing}
            onViewProfile={() => onViewProfile()}
          />
        ))
      )}

      <TouchableOpacity style={s.skillsNotice} onPress={onGoToProfile} activeOpacity={0.7}>
        <View style={s.skillsNoticeLeft}>
          <Text style={s.skillsNoticeTitle}>Manage your skills</Text>
          <Text style={s.skillsNoticeSub}>Add offered & wanted skills from your Profile</Text>
        </View>
        <ArrowRight size={16} color={C.violet500} />
      </TouchableOpacity>
    </View>
  );
}
