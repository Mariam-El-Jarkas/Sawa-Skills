import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SplashScreen } from '../components/SplashScreen';
import { ToastProvider } from '../components/modals/AppToast';
import { LoginPrompt } from '../components/LoginPrompt';

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
              {splashDone && (
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="auth/index" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="profile/[userId]" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="notifications/index" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="volunteer/index" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="post/[postId]" options={{ animation: 'slide_from_right' }} />
                </Stack>
              )}
              {/* Rendered at root level so it appears above ALL stack screens */}
              <LoginPrompt />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
