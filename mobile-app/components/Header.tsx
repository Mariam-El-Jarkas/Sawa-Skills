import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, LogIn } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { C, G } from './theme';

export function Header() {
  const { isLoggedIn, user, unreadNotificationsCount } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={G.header} style={[s.header, { paddingTop: insets.top + 8 }]}>
      <Text style={s.title}>Sawa Skills</Text>
      <View style={s.right}>
        {isLoggedIn ? (
          <>
            <TouchableOpacity onPress={() => router.push('/profile')} style={s.avatar}>
              <Text style={s.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={s.bellWrap}>
              <Bell size={24} color={C.white} />
              {unreadNotificationsCount > 0 && (
                <View style={s.badge}><Text style={s.badgeText}>{unreadNotificationsCount}</Text></View>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={s.loginRow} onPress={() => router.push('/auth')}>
            <LogIn size={16} color={C.white} />
            <Text style={s.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: C.white },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.violet600, fontWeight: '700', fontSize: 14 },
  bellWrap: { position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.pink500, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: C.white, fontSize: 9, fontWeight: '700' },
  loginRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  loginText: { color: C.white, fontSize: 14 },
});
