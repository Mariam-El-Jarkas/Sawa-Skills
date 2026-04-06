import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Home, BookOpen, Newspaper, ArrowLeftRight, MessageCircle } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { LoginPrompt } from '../../components/LoginPrompt';
import { useAuth } from '../../contexts/AuthContext';
import { C } from '../../components/theme';

function TabIcon({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) {
  return (
    <View style={[ts.iconWrap, focused && ts.iconActive]}>
      <Icon size={focused ? 20 : 22} color={color} strokeWidth={2} />
    </View>
  );
}

export default function TabsLayout() {
  const { showLoginPrompt } = useAuth();
  return (
    <>
      <Header />
      <Tabs screenOptions={{
        headerShown: false,
        tabBarStyle: ts.bar,
        tabBarActiveTintColor: C.violet600,
        tabBarInactiveTintColor: C.gray500,
        tabBarLabelStyle: ts.label,
        tabBarShowLabel: true,
      }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} color={color} focused={focused} /> }} />
        <Tabs.Screen name="skills" options={{ title: 'Skills', tabBarIcon: ({ color, focused }) => <TabIcon Icon={BookOpen} color={color} focused={focused} /> }} />
        <Tabs.Screen name="news" options={{ title: 'News', tabBarIcon: ({ color, focused }) => <TabIcon Icon={Newspaper} color={color} focused={focused} /> }} />
        <Tabs.Screen name="swaps" options={{ title: 'Swaps', tabBarIcon: ({ color, focused }) => <TabIcon Icon={ArrowLeftRight} color={color} focused={focused} /> }} />
        <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: ({ color, focused }) => <TabIcon Icon={MessageCircle} color={color} focused={focused} /> }} />
      </Tabs>
      {showLoginPrompt && <LoginPrompt />}
    </>
  );
}

const ts = StyleSheet.create({
  bar: { backgroundColor: C.white, borderTopColor: C.gray200, borderTopWidth: 1, height: 60, paddingBottom: 6, paddingTop: 4 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 8 },
  iconActive: { backgroundColor: 'rgba(124,58,237,0.1)' },
  label: { fontSize: 11, fontWeight: '600' },
});
