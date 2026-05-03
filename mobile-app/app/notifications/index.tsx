import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { ArrowLeft, Check, Bell, Heart, MessageCircle, Repeat2, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService, AppNotification } from '../../services/notificationService';
import { C, G } from '../../components/theme';
import { LinearGradient } from 'expo-linear-gradient';

// ── Type metadata ─────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; bg: string; color: string; Icon: any }> = {
  LIKE_POST:  { label: 'Like',     bg: '#FEE2E2', color: C.red600,    Icon: Heart },
  COMMENT:    { label: 'Comment',  bg: C.violet50, color: C.violet600, Icon: MessageCircle },
  REPOST:     { label: 'Repost',   bg: '#DCFCE7',  color: '#16A34A',   Icon: Repeat2 },
  ML_MATCH:   { label: 'For You',  bg: C.violet50, color: C.violet600, Icon: Sparkles },
};

function getMeta(type: string) {
  return TYPE_META[type] ?? { label: type, bg: C.gray100, color: C.gray600, Icon: Bell };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { isLoggedIn, token, setUnreadNotificationsCount } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!token) { setIsLoading(false); return; }
    if (!silent) setIsLoading(true);
    try {
      const data = await notificationService.getAll(token);
      setNotifications(data);
      const unread = data.filter(n => !n.read).length;
      setUnreadNotificationsCount(unread);
    } catch { /* silent */ } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setIsRefreshing(true); load(true); };

  const handleMarkRead = async (id: number) => {
    if (!token) return;
    try {
      await notificationService.markRead(id, token);
      setNotifications(prev => {
        const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
        setUnreadNotificationsCount(next.filter(x => !x.read).length);
        return next;
      });
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await notificationService.markAllRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotificationsCount(0);
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isLoggedIn) {
    return (
      <View style={s.screen}>
        <LinearGradient colors={G.header} style={s.header}>
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={C.white} /></TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
        </LinearGradient>
        <View style={s.empty}><Text style={s.emptyTxt}>Log in to see your notifications.</Text></View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <LinearGradient colors={G.header} style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={C.white} /></TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={s.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={s.markAllTxt}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator size="large" color={C.violet600} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[C.violet600]} tintColor={C.violet600} />}
        >
          {notifications.length === 0 ? (
            <View style={s.empty}>
              <Bell size={40} color={C.gray300} />
              <Text style={s.emptyTxt}>No notifications yet</Text>
            </View>
          ) : (
            <View style={s.list}>
              {notifications.map(n => {
                const meta = getMeta(n.type);
                const Icon = meta.Icon;
                return (
                  <TouchableOpacity
                    key={n.id}
                    style={[s.card, !n.read && s.cardUnread]}
                    onPress={() => !n.read && handleMarkRead(n.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[s.iconWrap, { backgroundColor: meta.bg }]}>
                      <Icon size={18} color={meta.color} />
                    </View>
                    <View style={s.cardBody}>
                      <View style={s.cardTitleRow}>
                        <Text style={s.cardLabel}>{meta.label}</Text>
                        {!n.read && <View style={s.dot} />}
                      </View>
                      <Text style={s.cardMsg}>{n.message}</Text>
                      <Text style={s.cardTime}>{relativeTime(n.createdAt)}</Text>
                    </View>
                    {!n.read && (
                      <TouchableOpacity style={s.readBtn} onPress={() => handleMarkRead(n.id)}>
                        <Check size={14} color={C.violet600} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 20 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: C.white },
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  markAllTxt: { color: C.white, fontSize: 12, fontWeight: '600' },
  list: { padding: 12, gap: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.gray100 },
  cardUnread: { borderColor: C.violet200, borderWidth: 1.5, backgroundColor: '#FDFBFF' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1, gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardLabel: { fontSize: 12, fontWeight: '700', color: C.gray500, textTransform: 'uppercase', letterSpacing: 0.5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.violet600 },
  cardMsg: { fontSize: 14, color: C.gray800, lineHeight: 19 },
  cardTime: { fontSize: 11, color: C.gray400 },
  readBtn: { padding: 6, backgroundColor: C.violet50, borderRadius: 10 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTxt: { fontSize: 14, color: C.gray500 },
});
