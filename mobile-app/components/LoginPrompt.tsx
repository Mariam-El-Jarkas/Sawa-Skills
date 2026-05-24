import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LogIn } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export function LoginPrompt({ message = 'Log in to interact with this content and join the community.' }: { message?: string }) {
  const { showLoginPrompt, setShowLoginPrompt } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();

  const s = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: isDark ? 'rgba(4,0,16,0.85)' : 'rgba(20,5,50,0.75)',
    },
    blur: { ...StyleSheet.absoluteFillObject },
    tint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? 'rgba(4,0,16,0.32)' : 'rgba(20,5,50,0.25)',
    },

    card: {
      width: '100%',
      maxWidth: 340,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(139,92,246,0.25)' : 'rgba(124,58,237,0.18)',
      shadowColor: isDark ? '#7C3AED' : '#5B21B6',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.45 : 0.15,
      shadowRadius: 24,
      elevation: 16,
      backgroundColor: isDark ? 'rgba(20,8,40,0.82)' : 'rgba(255,255,255,0.72)',
    },

    inner: {
      padding: 28,
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(20,8,40,0.82)' : 'rgba(255,255,255,0.72)',
    },

    shimmer: {
      position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
      backgroundColor: isDark ? 'rgba(167,139,250,0.20)' : 'rgba(124,58,237,0.12)',
    },

    iconHalo: {
      width: 64, height: 64, borderRadius: 32, marginBottom: 16,
      backgroundColor: isDark ? 'rgba(109,28,237,0.30)' : 'rgba(237,233,254,0.70)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(167,139,250,0.35)' : 'rgba(124,58,237,0.20)',
      alignItems: 'center', justifyContent: 'center',
    },
    iconCore: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: isDark ? 'rgba(124,58,237,0.40)' : 'rgba(221,214,254,0.65)',
      alignItems: 'center', justifyContent: 'center',
    },

    title: {
      fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8,
      color: isDark ? '#FFFFFF' : '#4C1D95',
    },
    msg: {
      fontSize: 13.5, textAlign: 'center', lineHeight: 20, marginBottom: 24,
      color: isDark ? 'rgba(196,181,253,0.80)' : '#6B7280',
    },

    row: { flexDirection: 'row', gap: 10, width: '100%' },

    cancelBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(237,233,254,0.60)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(196,181,253,0.20)' : 'rgba(124,58,237,0.20)',
    },
    cancelTxt: {
      fontWeight: '600', fontSize: 14,
      color: isDark ? 'rgba(196,181,253,0.80)' : '#6D28D9',
    },

    loginBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
      backgroundColor: '#7C3AED',
      shadowColor: '#7C3AED', shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
      elevation: 6,
    },
    loginTxt: { fontWeight: '700', fontSize: 14, color: '#fff' },
  }), [isDark]);

  const iconColor = isDark ? '#C4B5FD' : '#7C3AED';

  return (
    <Modal transparent visible={showLoginPrompt} animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <BlurView
          style={StyleSheet.absoluteFillObject}
          intensity={isDark ? 28 : 18}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        />
        <View style={s.tint} />

        <View style={s.card}>
          <View style={s.inner}>
            <View style={s.shimmer} />

            <View style={s.iconHalo}>
              <View style={s.iconCore}>
                <LogIn size={24} color={iconColor} strokeWidth={2.2} />
              </View>
            </View>

            <Text style={s.title}>Login Required</Text>
            <Text style={s.msg}>{message}</Text>

            <View style={s.row}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowLoginPrompt(false)}>
                <Text style={s.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.loginBtn} onPress={() => { setShowLoginPrompt(false); router.push('/auth'); }}>
                <Text style={s.loginTxt}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
