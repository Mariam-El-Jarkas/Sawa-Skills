import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { SplashScreen } from '../components/SplashScreen';
import { ToastProvider } from '../components/modals/AppToast';

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
          {splashDone && (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth/index" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="profile/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="notifications/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="volunteer/index" options={{ animation: 'slide_from_right' }} />
            </Stack>
          )}
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
