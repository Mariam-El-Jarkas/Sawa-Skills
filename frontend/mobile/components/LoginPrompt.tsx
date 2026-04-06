import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { C } from './theme';

export function LoginPrompt({ message = 'Please log in to use this feature.' }: { message?: string }) {
  const { showLoginPrompt, setShowLoginPrompt } = useAuth();
  const router = useRouter();
  return (
    <Modal transparent visible={showLoginPrompt} animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>Login Required</Text>
          <Text style={s.msg}>{message}</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.cancel} onPress={() => setShowLoginPrompt(false)}>
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.login} onPress={() => { setShowLoginPrompt(false); router.push('/auth'); }}>
              <Text style={s.loginTxt}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { backgroundColor: C.white, borderRadius: 16, padding: 24, width: '100%', maxWidth: 360 },
  title: { fontSize: 18, fontWeight: '600', color: C.gray900, marginBottom: 8, textAlign: 'center' },
  msg: { fontSize: 14, color: C.gray600, marginBottom: 24, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  cancel: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: C.gray300, alignItems: 'center' },
  cancelTxt: { color: C.gray600, fontWeight: '500' },
  login: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: C.violet600, alignItems: 'center' },
  loginTxt: { color: C.white, fontWeight: '600' },
});
