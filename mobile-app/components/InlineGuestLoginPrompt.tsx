import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LogIn } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

export function InlineGuestLoginPrompt({ featureName }: { featureName: string }) {
  const router = useRouter();
  const { C } = useTheme();

  const s = useMemo(() => StyleSheet.create({
    box:    { alignItems: 'center', padding: 32, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.gray100, margin: 16 },
    icon:   { width: 56, height: 56, borderRadius: 28, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    title:  { fontSize: 16, fontWeight: '600', color: C.gray900, marginBottom: 8, textAlign: 'center' },
    sub:    { fontSize: 13, color: C.gray500, marginBottom: 24, textAlign: 'center' },
    btn:    { backgroundColor: C.violet600, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
    btnTxt: { color: C.white, fontWeight: '600', fontSize: 14 },
  }), [C]);

  return (
    <View style={s.box}>
      <View style={s.icon}><LogIn size={28} color={C.violet600} /></View>
      <Text style={s.title}>Log in to access {featureName}</Text>
      <Text style={s.sub}>Join the community to interact with {featureName.toLowerCase()} and discover new opportunities.</Text>
      <TouchableOpacity style={s.btn} onPress={() => router.push('/auth')}>
        <Text style={s.btnTxt}>Log In or Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}
