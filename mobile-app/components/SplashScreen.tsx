import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { G } from './theme';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const opacity      = useRef(new Animated.Value(0)).current;
  const scale        = useRef(new Animated.Value(0.6)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 500, delay: 350, useNativeDriver: true }),
        Animated.timing(progressWidth, { toValue: 256, duration: 1400, delay: 500, useNativeDriver: false }),
      ]),
    ]).start(() => setTimeout(onComplete, 300));
  }, []);

  return (
    <Animated.View style={[s.wrap, { opacity }]}>
      <LinearGradient colors={G.splash} style={StyleSheet.absoluteFill} />

      {/* Logo + text stacked so text sits inside the logo's bottom whitespace */}
      <Animated.View style={[s.logoGroup, { transform: [{ scale }] }]}>
        <Image
          source={require('../assets/images/logo-main.png')}
          style={s.logoImage}
          resizeMode="contain"
          tintColor="#ffffff"
        />

        {/* Pulled up by negative margin to overlap the empty space inside the image */}
        <Animated.View style={[s.textBlock, { opacity: textOpacity }]}>
          <Text style={s.appName}>Sawa Skills</Text>
          <Text style={s.tagline}>Skill Swap & Volunteer Platform</Text>
        </Animated.View>
      </Animated.View>

      {/* Progress bar sits below the whole group */}
      <Animated.View style={{ opacity: textOpacity }}>
        <View style={s.barTrack}>
          <Animated.View style={[s.barFill, { width: progressWidth }]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },

  // Wraps logo + text as one unit so they scale together
  logoGroup: {
    alignItems: 'center',
  },

  logoImage: {
    width: 220,
    height: 220,
  },

  // Negative marginTop pulls text up into the bottom empty area of the logo image
  textBlock: {
    alignItems: 'center',
    gap: 6,
    marginTop: -72,
  },

  appName: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.2,
  },

  barTrack: {
    width: 256,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
});
