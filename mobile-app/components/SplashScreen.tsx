import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { G } from './theme';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }),
        Animated.timing(progressWidth, { toValue: 256, duration: 1400, delay: 500, useNativeDriver: false }),
      ]),
    ]).start(() => setTimeout(onComplete, 300));
  }, []);

  return (
    <Animated.View style={[s.wrap, { opacity }]}>
      <LinearGradient colors={G.splash} style={StyleSheet.absoluteFill} />
      <Animated.View style={[s.logoWrap, { transform: [{ scale }] }]}>
        <View style={s.logoCard}>
          <Text style={s.logoText}>SS</Text>
        </View>
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center', gap: 8 }}>
        <Text style={s.appName}>Sawa Skills</Text>
        <Text style={s.tagline}>Skill Swap & Volunteer Platform</Text>
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity }}>
        <View style={s.barTrack}>
          <Animated.View style={[s.barFill, { width: progressWidth }]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, zIndex: 100, alignItems: 'center', justifyContent: 'center', gap: 32 },
  logoWrap: {},
  logoCard: { width: 128, height: 128, backgroundColor: '#fff', borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16 },
  logoText: { fontSize: 48, fontWeight: '700', color: '#7B4BBF' },
  appName: { fontSize: 40, fontWeight: '700', color: '#fff' },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  barTrack: { width: 256, height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: '#fff', borderRadius: 4 },
});
