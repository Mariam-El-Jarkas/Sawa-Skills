import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MapPin, Star, Globe, Trash2 } from 'lucide-react-native';
import { SkillListing } from '../../services/skillsService';
import { C } from '../theme';

interface Props {
  listing: SkillListing;
  isOwnListing?: boolean;
  isRequested?: boolean;
  onRequestSwap?: (listing: SkillListing) => void;
  onViewProfile?: (userId: number) => void;
  onDelete?: (id: number) => void;
  onGoToSwaps?: () => void;
  onManageListing?: () => void;
}

export const ListingCard: React.FC<Props> = ({ 
  listing, isOwnListing, isRequested, onRequestSwap, onViewProfile, onDelete, onGoToSwaps, onManageListing
}) => {
  return (
    <View style={s.skillCard}>
      <View style={s.skillTop}>
        <View style={s.skillAvatarWrap}>
          <View style={s.skillAvatar}>
            {listing.profilePicture
              ? <Image source={{ uri: listing.profilePicture }} style={s.skillAvatarImg} />
              : <Text style={s.skillAvatarTxt}>{listing.ownerInitials}</Text>}
          </View>
        </View>
        <View style={s.skillInfo}>
          <View style={s.skillInfoTop}>
            <View>
              <Text style={s.skillUser}>{listing.ownerName}</Text>
              <View style={s.locRow}>
                {listing.availability === 'Remote' ? <Globe size={12} color={C.gray500} /> : <MapPin size={12} color={C.gray500} />}
                <Text style={s.locTxt}>{listing.location ?? listing.availability ?? 'Flexible'}</Text>
              </View>
            </View>
            {!isOwnListing && (
              <View style={s.ratingRow}>
                <Star size={14} color={C.yellow400} fill={C.yellow400} />
                <Text style={s.ratingTxt}>{listing.avgRating > 0 ? listing.avgRating.toFixed(1) : '—'}</Text>
              </View>
            )}
            {isOwnListing && onDelete && (
              <TouchableOpacity 
                onPress={() => onDelete(listing.id)}
                hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                style={{ padding: 6 }}
              >
                <Trash2 size={16} color={C.gray400} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={s.offersTxt}>Offers: <Text style={s.offersSkill}>{listing.offeredSkill}</Text></Text>
          <Text style={s.wantsTxt}>Wants: <Text style={s.wantsSkill}>{listing.wantedSkill}</Text></Text>
        </View>
      </View>
      <View style={s.skillBtns}>
        {isOwnListing ? (
          <TouchableOpacity 
            style={[s.reqBtn, s.ownListingBadge]} 
            onPress={onManageListing}
            activeOpacity={0.7}
          >
            <Text style={s.reqBtnTxtOwn}>My Listing • Tap to Manage</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.reqBtn, isRequested && s.reqBtnDone]}
            onPress={() => isRequested ? onGoToSwaps?.() : onRequestSwap?.(listing)}
          >
            <Text style={[s.reqBtnTxt, isRequested && s.reqBtnTxtDone]}>
              {isRequested ? 'Requested ✓' : 'Request Swap'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.profileBtn} onPress={() => onViewProfile?.(listing.ownerId)}>
          <Text style={s.profileBtnTxt}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  skillCard: { backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#DDD6FE', marginBottom: 12 },
  skillTop: { flexDirection: 'row' },
  skillAvatarWrap: { width: 80, alignItems: 'center', justifyContent: 'center', padding: 12 },
  skillAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  skillAvatarTxt: { color: C.white, fontWeight: '700', fontSize: 18 },
  skillAvatarImg: { width: 56, height: 56, borderRadius: 28 },
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
  reqBtn: { flex: 1, paddingVertical: 8, backgroundColor: C.violet600, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  reqBtnDone: { backgroundColor: C.violet100 },
  reqBtnTxt: { color: C.white, fontSize: 13, fontWeight: '600' },
  reqBtnTxtDone: { color: C.violet600 },
  ownListingBadge: { backgroundColor: C.gray100 },
  reqBtnTxtOwn: { color: C.gray500, fontSize: 13, fontWeight: '600' },
  profileBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6FE', justifyContent: 'center' },
  profileBtnTxt: { color: C.violet600, fontSize: 13, fontWeight: '500' },
});
