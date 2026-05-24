import React, { useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  isSubmitting?: boolean;
}

export const RatingModal: React.FC<Props> = ({ isVisible, onClose, onSubmit, isSubmitting }) => {
  const { C } = useTheme();
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingTxt, setRatingTxt] = useState('');

  const s = useMemo(() => StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    ratingSheet: { backgroundColor: C.gray100, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
    ratingTitle: { fontSize: 20, fontWeight: '700', color: C.gray900 },
    starsRow: { flexDirection: 'row', gap: 8 },
    star: { fontSize: 32, color: C.gray300 },
    starActive: { color: C.yellow400 },
    ratingInput: { backgroundColor: C.gray50, borderRadius: 12, padding: 12, fontSize: 14, height: 80, textAlignVertical: 'top' as any, color: C.gray900 },
    ratingBtns: { flexDirection: 'row', gap: 10 },
    ratingCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.gray200, alignItems: 'center' },
    ratingCancelTxt: { fontWeight: '600', color: C.gray700 },
    ratingSubmit: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.violet600, alignItems: 'center' },
    ratingDisabled: { opacity: 0.5 },
    ratingSubmitTxt: { fontWeight: '600', color: '#fff' },
  }), [C]);

  const handleResetAndClose = () => { setRatingVal(0); setRatingTxt(''); onClose(); };
  const handleSubmit = () => { if (ratingVal === 0) return; onSubmit(ratingVal, ratingTxt); };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.modalOverlay}>
        <View style={s.ratingSheet}>
          <Text style={s.ratingTitle}>Rate Swap</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRatingVal(star)}>
                <Text style={[s.star, star <= ratingVal && s.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={s.ratingInput} placeholder="Write a review (optional)" value={ratingTxt} onChangeText={setRatingTxt} multiline numberOfLines={3} placeholderTextColor={C.gray400} />
          <View style={s.ratingBtns}>
            <TouchableOpacity style={s.ratingCancel} onPress={handleResetAndClose}>
              <Text style={s.ratingCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.ratingSubmit, (ratingVal === 0 || isSubmitting) && s.ratingDisabled]} onPress={handleSubmit} disabled={ratingVal === 0 || isSubmitting}>
              <Text style={s.ratingSubmitTxt}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
