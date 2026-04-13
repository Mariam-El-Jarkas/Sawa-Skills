import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Plus, Eye } from 'lucide-react-native';
import { ListingCard } from '../cards/ListingCard';
import { C } from '../theme';

interface MySkill {
  id: number;
  skillName: string;
  category?: string | null;
}

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
  isDeletingId?: number | null;
}

export function MyExchangeView({
  isLoading, myListings, myOffered, myWanted,
  onAddListing, onAddOffered, onAddWanted,
  onDeleteListing, onViewProfile, isDeletingId
}: Props) {
  if (isLoading) {
    return <ActivityIndicator size="small" color={C.violet600} style={{ marginTop: 16 }} />;
  }

  return (
    <View style={s.myExchange}>
      <Text style={s.meTitle}>My Exchange</Text>
      <Text style={s.meSub}>Manage your listings and skills</Text>
      <TouchableOpacity style={s.createBtn} onPress={onAddListing}>
        <Plus size={20} color="#fff" />
        <Text style={s.createBtnTxt}>Create New Listing</Text>
      </TouchableOpacity>

      <Text style={s.meSection}>ACTIVE LISTINGS</Text>
      {myListings.length === 0 && <Text style={s.emptyTxt}>No listings yet.</Text>}
      {myListings.map(l => (
        <ListingCard
          key={l.id}
          listing={l}
          isOwnListing
          onDelete={isDeletingId === l.id ? undefined : onDeleteListing}
          onViewProfile={() => onViewProfile()}
        />
      ))}

      <Text style={[s.meSection, { marginTop: 20 }]}>SKILLS I OFFER</Text>
      <TouchableOpacity onPress={onAddOffered} style={s.addLink}><Text style={s.addLinkTxt}>+ Add</Text></TouchableOpacity>
      {myOffered.length === 0 && <Text style={s.emptyTxt}>No offered skills yet.</Text>}
      {myOffered.map(sk => (
        <View key={sk.id} style={s.skillRow}>
          <View style={s.skillRowInfo}>
            <Text style={s.skillRowName}>{sk.skillName}</Text>
            {sk.category && <Text style={s.skillRowDesc}>{sk.category}</Text>}
          </View>
          <TouchableOpacity onPress={() => onViewProfile()} style={s.visibilityBtn}>
            <Eye size={18} color={C.violet600} />
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[s.meSection, { marginTop: 20 }]}>SKILLS I WANT</Text>
      <TouchableOpacity onPress={onAddWanted} style={s.addLink}><Text style={s.addLinkTxt}>+ Add</Text></TouchableOpacity>
      {myWanted.length === 0 && <Text style={s.emptyTxt}>No wanted skills yet.</Text>}
      {myWanted.map(sk => (
        <View key={sk.id} style={s.skillRow}>
          <View style={s.skillRowInfo}>
            <Text style={s.skillRowName}>{sk.skillName}</Text>
            {sk.category && <Text style={s.skillRowDesc}>{sk.category}</Text>}
          </View>
          <TouchableOpacity onPress={() => onViewProfile()} style={s.visibilityBtn}>
            <Eye size={18} color={C.violet600} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  myExchange: { gap: 12 },
  meTitle: { fontSize: 22, fontWeight: '700', color: C.gray900 },
  meSub: { fontSize: 13, color: C.gray500, marginTop: -8 },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.violet600, paddingVertical: 14, borderRadius: 14 },
  createBtnTxt: { color: C.white, fontWeight: '700', fontSize: 15 },
  meSection: { fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 1, marginBottom: 8 },
  emptyTxt: { color: C.gray500, fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  addLink: { alignSelf: 'flex-end', marginTop: -8 },
  addLinkTxt: { color: C.violet600, fontWeight: '700', fontSize: 13 },
  skillRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.gray100, gap: 8, marginBottom: 4 },
  skillRowInfo: { flex: 1 },
  skillRowName: { fontWeight: '700', fontSize: 14 },
  skillRowDesc: { fontSize: 11, color: C.gray500 },
  visibilityBtn: { padding: 4 },
});
