import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Animated, StyleSheet, Platform, DeviceEventEmitter } from 'react-native';
import { Home, BookOpen, Newspaper, ArrowLeftRight, MessageCircle } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { LoginPrompt } from '../../components/LoginPrompt';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { C } from '../../components/theme';

// ── Animated tab icon ─────────────────────────────────────────────────────────

interface TabIconProps {
  Icon: any;
  color: string;
  focused: boolean;
  label: string;
  isCenter?: boolean;
}

function TabIcon({ Icon, color, focused, label, isCenter }: TabIconProps) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const labelOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pillOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    const animations = [
      Animated.spring(scale, {
        toValue: focused ? 1.1 : 0.9,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(labelOpacity, {
        toValue: focused ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ];
    if (!isCenter) {
      animations.push(Animated.timing(pillOpacity, {
        toValue: focused ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }));
    }
    Animated.parallel(animations).start();
  }, [focused, isCenter]);

  if (isCenter) {
    return (
      <View style={ts.centerWrap}>
        <Animated.View style={[ts.centerBtn, { transform: [{ scale }] }]}>
          <Icon size={26} color={focused ? C.white : C.violet200} strokeWidth={2.5} />
        </Animated.View>
        <Animated.Text style={[ts.centerLabel, { opacity: labelOpacity }]}>
          {label}
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={ts.iconContainer}>
      <Animated.View style={[ts.pillWrap, { opacity: pillOpacity }]}>
        <View style={ts.pill} />
      </Animated.View>
      <Animated.View style={[ts.iconWrap, { transform: [{ scale }] }]}>
        <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
      </Animated.View>
      <Animated.Text style={[ts.label, { color, opacity: labelOpacity }]}>
        {label}
      </Animated.Text>
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  const { showLoginPrompt, isLoggedIn } = useAuth();
  const { conversations, fetchConversations } = useChat();

  // Fetch conversations on login to compute badge
  useEffect(() => {
    if (isLoggedIn) fetchConversations();

    const sub = DeviceEventEmitter.addListener('chat_read_event', () => {
      fetchConversations();
    });

    // Poll every 30 s so the badge picks up new incoming messages while on other tabs
    const poll = isLoggedIn ? setInterval(fetchConversations, 30_000) : null;

    return () => {
      sub.remove();
      if (poll) clearInterval(poll);
    };
  }, [isLoggedIn, fetchConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  return (
    <>
      <Header />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: ts.bar,
          tabBarActiveTintColor: C.violet600,
          tabBarInactiveTintColor: C.gray400,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={Home} color={color} focused={focused} label="Home" />
            ),
          }}
        />
        <Tabs.Screen
          name="skills"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={BookOpen} color={color} focused={focused} label="Skills" />
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={Newspaper} color={color} focused={focused} label="News" isCenter />
            ),
          }}
        />
        <Tabs.Screen
          name="swaps"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={ArrowLeftRight} color={color} focused={focused} label="Swaps" />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <TabIcon Icon={MessageCircle} color={color} focused={focused} label="Chat" />
            ),
            tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
            tabBarBadgeStyle: { backgroundColor: C.violet600, color: '#fff', fontSize: 10 },
          }}
        />
      </Tabs>
      {showLoginPrompt && <LoginPrompt />}
    </>
  );
}

const ts = StyleSheet.create({
  bar: {
    backgroundColor: C.white,
    borderTopColor: C.gray100,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 68,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 48,
  },
  pillWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.violet600,
    marginBottom: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  // Center (News) button — raised pill
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 4 : 0,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.violet600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    shadowColor: C.violet600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.violet600,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
