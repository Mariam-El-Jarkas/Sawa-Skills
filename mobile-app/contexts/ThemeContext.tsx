import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { C, CD, G, GD, ThemeColors, ThemeGradients } from '../components/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  C: ThemeColors;
  G: ThemeGradients;
  setTheme: (mode: ThemeMode) => void;
}

const STORAGE_KEY = '@theme_mode';

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  isDark: false,
  C,
  G,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') setMode(v);
    }).catch(() => {});
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const colors = useMemo(() => isDark ? CD : C, [isDark]);
  const gradients = useMemo(() => isDark ? GD : G, [isDark]);

  const setTheme = useCallback((m: ThemeMode) => {
    setMode(m);
    SecureStore.setItemAsync(STORAGE_KEY, m).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, isDark, C: colors, G: gradients, setTheme }),
    [mode, isDark, colors, gradients, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
