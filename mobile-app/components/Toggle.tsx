import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { C } from './theme';

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  const animatedValue = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: checked ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // Color and position animation doesn't support native driver for these props
    }).start();
  }, [checked]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22], // Adjusted for 44px width and 20px thumb
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [C.gray200, C.violet600],
  });

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onChange(!checked)}
    >
      <Animated.View style={[s.track, { backgroundColor }]}>
        <Animated.View style={[s.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.white,
    // Add a slight shadow for elevation look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
