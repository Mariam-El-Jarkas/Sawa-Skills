import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { ShieldCheck, CheckCircle, Users, X, UserCheck } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onLearnMore?: () => void;
  otherUserName?: string | null;
  otherUserAge?: number | null;
  otherUserGender?: string | null;
}

export const VerifySwapModal: React.FC<Props> = ({
  isVisible, onClose, onConfirm, onLearnMore,
  otherUserName, otherUserAge, otherUserGender,
}) => {
  const { C } = useTheme();

  const hasSafetyInfo = !!(otherUserAge || otherUserGender);

  const s = useMemo(() => StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    verifySheet: { backgroundColor: C.gray100, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
    verifyHeader: { backgroundColor: C.violet600, padding: 24, alignItems: 'center', gap: 8 },
    verifyClose: { position: 'absolute', top: 16, right: 16 },
    verifyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    verifyTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    verifySub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    verifyBody: { padding: 20, gap: 12 },
    safetyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.violet50, borderRadius: 14, borderWidth: 1.5, borderColor: C.violet200, padding: 14, marginBottom: 4 },
    safetyIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
    safetyLabel: { fontSize: 11, fontWeight: '700', color: C.violet600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
    safetyValue: { fontSize: 14, fontWeight: '700', color: C.gray900 },
    safetyMeta: { fontSize: 12, color: C.gray500, marginTop: 1 },
    verifyDesc: { fontSize: 13, color: C.gray600, textAlign: 'center', marginBottom: 4 },
    verifyOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: C.violet200, marginBottom: 4 },
    verifyOptIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
    verifyOptTitle: { fontWeight: '700', fontSize: 14, color: C.gray900 },
    verifyOptSub: { fontSize: 11, color: C.gray500, marginTop: 2 },
    verifyLater: { textAlign: 'center', color: C.gray400, fontSize: 13, paddingVertical: 8 },
  }), [C]);

  const metaParts: string[] = [];
  if (otherUserAge) metaParts.push(`Age ${otherUserAge}`);
  if (otherUserGender && otherUserGender !== 'Prefer not to say') metaParts.push(otherUserGender);

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={s.verifySheet}>
          <View style={s.verifyHeader}>
            <TouchableOpacity style={s.verifyClose} onPress={onClose}><X size={20} color="#fff" /></TouchableOpacity>
            <View style={s.verifyIcon}><ShieldCheck size={32} color="#fff" /></View>
            <Text style={s.verifyTitle}>Confirm Acceptance</Text>
            <Text style={s.verifySub}>Review details before accepting this swap.</Text>
          </View>
          <View style={s.verifyBody}>
            {hasSafetyInfo && (
              <View style={s.safetyCard}>
                <View style={s.safetyIconWrap}><UserCheck size={20} color={C.violet600} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.safetyLabel}>You're swapping with</Text>
                  <Text style={s.safetyValue}>{otherUserName ?? 'This user'}</Text>
                  {metaParts.length > 0 && (
                    <Text style={s.safetyMeta}>{metaParts.join(' · ')}</Text>
                  )}
                </View>
              </View>
            )}
            <Text style={s.verifyDesc}>By accepting, you agree to participate in this skill exchange. Make sure you are ready to fulfill your side of the swap.</Text>
            <TouchableOpacity style={s.verifyOption} onPress={onConfirm}>
              <View style={s.verifyOptIcon}><CheckCircle size={20} color={C.violet600} /></View>
              <View>
                <Text style={s.verifyOptTitle}>Accept Swap</Text>
                <Text style={s.verifyOptSub}>Confirm and start the exchange</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={s.verifyOption} onPress={onLearnMore}>
              <View style={s.verifyOptIcon}><Users size={20} color={C.violet600} /></View>
              <View>
                <Text style={s.verifyOptTitle}>Learn More</Text>
                <Text style={s.verifyOptSub}>View your verification status</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.verifyLater}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
