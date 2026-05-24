import React, { useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LogIn, UserPlus, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

interface Props { feature: string; }

export function GuestGate({ feature }: Props) {
  const { isDark } = useTheme();
  const router = useRouter();

  const opacity = useRef(new Animated.Value(1)).current;
  const scale   = useRef(new Animated.Value(1)).current;

  const s = useMemo(() => StyleSheet.create({
    fill: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 999,
      backgroundColor: isDark ? 'rgba(4,0,16,0.88)' : 'rgba(20,5,50,0.78)',
    },
    blur: { ...StyleSheet.absoluteFillObject },
    tint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? 'rgba(4,0,16,0.35)' : 'rgba(20,5,50,0.28)',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },

    card: {
      width: '100%', maxWidth: 370, borderRadius: 28, overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(139,92,246,0.25)' : 'rgba(124,58,237,0.18)',
      shadowColor: isDark ? '#7C3AED' : '#5B21B6',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: isDark ? 0.45 : 0.18,
      shadowRadius: 32,
      elevation: 18,
      backgroundColor: isDark ? 'rgba(20,8,40,0.82)' : 'rgba(255,255,255,0.72)',
    },

    inner: {
      paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center',
      backgroundColor: isDark ? 'rgba(20,8,40,0.82)' : 'rgba(255,255,255,0.72)',
    },

    shimmer: {
      position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
      backgroundColor: isDark ? 'rgba(167,139,250,0.20)' : 'rgba(124,58,237,0.12)',
    },

    iconHalo: {
      width: 80, height: 80, borderRadius: 40, marginBottom: 20,
      backgroundColor: isDark ? 'rgba(109,28,237,0.30)' : 'rgba(237,233,254,0.70)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(167,139,250,0.35)' : 'rgba(124,58,237,0.20)',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#8B5CF6',
      shadowOpacity: isDark ? 0.7 : 0.15,
      shadowOffset: { width: 0, height: 0 }, shadowRadius: 18,
    },
    iconCore: {
      width: 58, height: 58, borderRadius: 29,
      backgroundColor: isDark ? 'rgba(124,58,237,0.40)' : 'rgba(221,214,254,0.65)',
      alignItems: 'center', justifyContent: 'center',
    },

    pill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12,
      backgroundColor: isDark ? 'rgba(139,92,246,0.22)' : 'rgba(237,233,254,0.60)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(196,181,253,0.30)' : 'rgba(124,58,237,0.25)',
    },
    pillTxt: {
      fontSize: 10, fontWeight: '800', letterSpacing: 1.8,
      color: isDark ? '#C4B5FD' : '#6D28D9',
    },

    title: {
      fontSize: 23, fontWeight: '900', textAlign: 'center', letterSpacing: 0.1, marginBottom: 8,
      color: isDark ? '#FFFFFF' : '#4C1D95',
    },
    sub: {
      fontSize: 13.5, textAlign: 'center', lineHeight: 21, marginBottom: 24, maxWidth: 260,
      color: isDark ? 'rgba(196,181,253,0.80)' : '#6B7280',
    },

    divRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, width: '100%' },
    divLine: {
      flex: 1, height: 1,
      backgroundColor: isDark ? 'rgba(167,139,250,0.20)' : 'rgba(124,58,237,0.15)',
    },
    divTxt: {
      fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
      color: isDark ? 'rgba(196,181,253,0.50)' : '#8B5CF6',
    },

    options: { width: '100%', gap: 9 },
    opt: {
      flexDirection: 'row', alignItems: 'center', gap: 13,
      padding: 14, borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.065)' : 'rgba(245,243,255,0.60)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(196,181,253,0.18)' : 'rgba(124,58,237,0.20)',
    },
    optIcon: {
      width: 42, height: 42, borderRadius: 12,
      backgroundColor: isDark ? 'rgba(109,28,237,0.40)' : 'rgba(237,233,254,0.65)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(167,139,250,0.35)' : 'rgba(124,58,237,0.25)',
      alignItems: 'center', justifyContent: 'center',
    },
    optBody: { flex: 1 },
    optTitle: {
      fontSize: 14.5, fontWeight: '800', marginBottom: 1,
      color: isDark ? '#FFFFFF' : '#3B0764',
    },
    optSub: {
      fontSize: 11.5, lineHeight: 16,
      color: isDark ? 'rgba(196,181,253,0.65)' : '#6B7280',
    },
  }), [isDark]);

  const iconColor    = isDark ? '#C4B5FD' : '#7C3AED';
  const chevronColor = isDark ? 'rgba(196,181,253,0.45)' : '#8B5CF6';

  const Opt = ({ Icon, title, sub, onPress }: { Icon: any; title: string; sub: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={s.opt}>
        <View style={s.optIcon}><Icon size={20} color={iconColor} strokeWidth={2.2} /></View>
        <View style={s.optBody}>
          <Text style={s.optTitle}>{title}</Text>
          <Text style={s.optSub}>{sub}</Text>
        </View>
        <ChevronRight size={16} color={chevronColor} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.fill} pointerEvents="box-none">
      <BlurView
        style={s.blur}
        intensity={isDark ? 28 : 18}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      />
      <View style={s.tint} />

      <View style={s.center} pointerEvents="box-none">
        <Animated.View style={[s.card, { opacity, transform: [{ scale }] }]}>
          <View style={s.inner}>
            <View style={s.shimmer} />

            <View style={s.iconHalo}>
              <View style={s.iconCore}>
                <LogIn size={28} color={iconColor} strokeWidth={2.2} />
              </View>
            </View>

            <View style={s.pill}>
              <LogIn size={10} color={isDark ? '#C4B5FD' : '#6D28D9'} strokeWidth={2.5} />
              <Text style={s.pillTxt}>{feature.toUpperCase()} · LOCKED</Text>
            </View>

            <Text style={s.title}>Login to Unlock</Text>
            <Text style={s.sub}>
              Join the Sawa Skills community to access {feature} and connect with others.
            </Text>

            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>GET STARTED</Text>
              <View style={s.divLine} />
            </View>

            <View style={s.options}>
              <Opt Icon={LogIn}    title="Log In"            sub="Sign in to your existing account"        onPress={() => router.replace('/auth')} />
              <Opt Icon={UserPlus} title="Create an Account" sub="Join for free and start swapping skills" onPress={() => router.replace('/auth')} />
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
