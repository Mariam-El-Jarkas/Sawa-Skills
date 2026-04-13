import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { ShieldCheck, CheckCircle, Users, X } from 'lucide-react-native';
import { C } from '../theme';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onLearnMore?: () => void;
}

export const VerifySwapModal: React.FC<Props> = ({ isVisible, onClose, onConfirm, onLearnMore }) => {
  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={s.verifySheet}>
          <View style={s.verifyHeader}>
            <TouchableOpacity style={s.verifyClose} onPress={onClose}><X size={20} color={C.white} /></TouchableOpacity>
            <View style={s.verifyIcon}><ShieldCheck size={32} color={C.white} /></View>
            <Text style={s.verifyTitle}>Confirm Acceptance</Text>
            <Text style={s.verifySub}>Review details before accepting this swap.</Text>
          </View>
          <View style={s.verifyBody}>
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

const s = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  verifySheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  verifyHeader: { backgroundColor: C.violet600, padding: 24, alignItems: 'center', gap: 8 },
  verifyClose: { position: 'absolute', top: 16, right: 16 },
  verifyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  verifyTitle: { fontSize: 20, fontWeight: '700', color: C.white },
  verifySub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  verifyBody: { padding: 20, gap: 12 },
  verifyDesc: { fontSize: 13, color: C.gray600, textAlign: 'center', marginBottom: 8 },
  verifyOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: C.violet100, marginBottom: 4 },
  verifyOptIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
  verifyOptTitle: { fontWeight: '700', fontSize: 14 },
  verifyOptSub: { fontSize: 11, color: C.gray500, marginTop: 2 },
  verifyLater: { textAlign: 'center', color: C.gray400, fontSize: 13, paddingVertical: 8 },
});
