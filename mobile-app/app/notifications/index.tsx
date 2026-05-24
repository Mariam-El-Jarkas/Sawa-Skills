import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { ArrowLeft, Check, Bell, Heart, MessageCircle, Repeat2, Sparkles, ArrowLeftRight, ShieldCheck, ShieldX } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService, AppNotification } from '../../services/notificationService';
import { profileService } from '../../services/profileService';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, UserCheck } from 'lucide-react-native';
import { relativeTime } from '../../utils/helpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Type metadata ─────────────────────────────────────────────────────────────

function getTypeMeta(C: any): Record<string, { label: string; bg: string; color: string; Icon: any }> {
  return {
    LIKE_POST:    { label: 'Like',     bg: C.violet100, color: C.violet600, Icon: Heart },
    LIKE_COMMENT: { label: 'Like',     bg: C.violet100, color: C.violet600, Icon: Heart },
    LIKE_STORY:   { label: 'Like',     bg: C.violet100, color: C.violet600, Icon: Heart },
    COMMENT:      { label: 'Comment',  bg: C.violet50,  color: C.violet600, Icon: MessageCircle },
    COMMENT_REPLY:{ label: 'Reply',    bg: C.violet50,  color: C.violet600, Icon: MessageCircle },
    STORY_REPLY:  { label: 'Story',    bg: C.violet50,  color: C.violet600, Icon: MessageCircle },
    REPOST:       { label: 'Repost',   bg: C.violet50,  color: C.violet500, Icon: Repeat2 },
    ML_MATCH:     { label: 'For You',  bg: C.violet50,  color: C.violet600, Icon: Sparkles },
    POLL_VOTE:    { label: 'Poll',     bg: C.violet50,  color: C.violet600, Icon: Check },
    POLL_VOTE_STORY: { label: 'Poll',  bg: C.violet50,  color: C.violet600, Icon: Check },
    CONNECTION_REQUEST: { label: 'Connect',  bg: C.violet50,  color: C.violet600, Icon: UserPlus },
    CONNECTION_ACCEPTED: { label: 'Connect', bg: C.violet100, color: C.violet500, Icon: UserCheck },
    SWAP_REQUEST:    { label: 'Swap',     bg: C.violet50,  color: C.violet600, Icon: ArrowLeftRight },
    SWAP_ACCEPTED:   { label: 'Swap',     bg: C.violet100, color: C.violet500, Icon: ArrowLeftRight },
    MESSAGE:         { label: 'Message',  bg: C.violet50,  color: C.violet600, Icon: MessageCircle },
    PARENT_APPROVED:       { label: 'Approved', bg: C.violet100, color: C.violet600, Icon: ShieldCheck },
    PARENT_DECLINED:       { label: 'Declined', bg: C.gray100,   color: C.gray500,   Icon: ShieldX },
    VERIFICATION_APPROVED: { label: 'Verified', bg: C.violet100, color: C.violet600, Icon: ShieldCheck },
    VERIFICATION_REJECTED: { label: 'Rejected', bg: C.gray100,   color: C.gray500,   Icon: ShieldX },
  };
}

function getMeta(type: string, C: any) {
  return getTypeMeta(C)[type] ?? { label: type, bg: C.gray100, color: C.gray600, Icon: Bell };
}


// ── Component ─────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { C, G } = useTheme();
  const insets = useSafeAreaInsets();
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

  const handleApprove = async (notification: AppNotification) => {
    if (!token || !notification.referenceId) return;
    try {
      await profileService.approveConnection(notification.referenceId, token);
      await handleMarkRead(notification.id);
      load(true);
    } catch { /* silent */ }
  };

  const handleDecline = async (notification: AppNotification) => {
    if (!token || !notification.referenceId) return;
    try {
      await profileService.declineConnection(notification.referenceId, token);
      await handleMarkRead(notification.id);
      load(true);
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const s = useMemo(() => StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.gray50 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: C.white },
    markAllBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
    markAllTxt: { color: C.white, fontSize: 12, fontWeight: '600' },
    list: { padding: 12, gap: 8 },
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.gray100 },
    cardUnread: { borderColor: C.violet400, borderWidth: 1.5, backgroundColor: C.violet50 },
    iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardBody: { flex: 1, gap: 2 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardLabel: { fontSize: 12, fontWeight: '700', color: C.gray500, textTransform: 'uppercase', letterSpacing: 0.5 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.violet600 },
    cardMsg: { fontSize: 14, color: C.gray800, lineHeight: 19 },
    cardTime: { fontSize: 11, color: C.gray400 },
    readBtn: { padding: 6, backgroundColor: C.violet50, borderRadius: 10 },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    approveBtn: { backgroundColor: C.violet600, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    approveTxt: { color: C.white, fontSize: 13, fontWeight: '700' },
    declineBtn: { backgroundColor: C.gray100, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    declineTxt: { color: C.gray700, fontSize: 13, fontWeight: '600' },
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
    emptyTxt: { fontSize: 14, color: C.gray500 },
  }), [C]);

  if (!isLoggedIn) {
    return (
      <View style={s.screen}>
        <LinearGradient colors={G.header} style={[s.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={C.white} /></TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
        </LinearGradient>
        <View style={s.empty}><Text style={s.emptyTxt}>Log in to see your notifications.</Text></View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <LinearGradient colors={G.header} style={[s.header, { paddingTop: insets.top + 12 }]}>
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
                const meta = getMeta(n.type, C);
                const Icon = meta.Icon;
                return (
                  <View key={n.id}>
                    <TouchableOpacity
                      style={[s.card, !n.read && s.cardUnread]}
                      onPress={() => {
                        if (!n.read) handleMarkRead(n.id);
                        
                        if (n.type.includes('POST') || n.type.includes('COMMENT') || n.type === 'ML_MATCH' || n.type === 'POLL_VOTE') {
                           if (n.referenceId) {
                             router.push(`/(tabs)/news?openPostId=${n.referenceId}`);
                             return;
                           }
                        }
                        
                        if (n.type === 'STORY_REPLY' || n.type === 'MESSAGE') {
                          router.push(`/(tabs)/chat?openUserId=${n.actorId}`);
                          return;
                        }

                        if (n.type === 'PARENT_APPROVED_SESSION') {
                          if (n.referenceId) {
                            router.push({ pathname: '/(tabs)/chat', params: { openId: String(n.referenceId) } } as any);
                          } else {
                            router.push('/volunteer');
                          }
                          return;
                        }

                        if (n.type === 'PARENT_APPROVED' && n.message?.toLowerCase().includes('session')) {
                          router.push('/(tabs)/chat');
                          return;
                        }

                        if (n.type === 'SWAP_REQUEST' || n.type === 'SWAP_ACCEPTED'
                            || n.type === 'PARENT_APPROVED' || n.type === 'PARENT_DECLINED') {
                          router.push('/(tabs)/swaps');
                          return;
                        }

                        if (n.type === 'VERIFICATION_APPROVED' || n.type === 'VERIFICATION_REJECTED') {
                          // Navigate to own profile to see the updated badge
                          if (n.user?.id) router.push(`/profile/${n.user.id}`);
                          return;
                        }

                        if (n.actorId) router.push(`/profile/${n.actorId}`);
                      }}
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

                        {n.type === 'CONNECTION_REQUEST' && !n.read && (
                          <View style={s.actionRow}>
                            <TouchableOpacity style={s.approveBtn} onPress={() => handleApprove(n)}>
                              <Text style={s.approveTxt}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.declineBtn} onPress={() => handleDecline(n)}>
                              <Text style={s.declineTxt}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                      {!n.read && n.type !== 'CONNECTION_REQUEST' && (
                        <TouchableOpacity style={s.readBtn} onPress={() => handleMarkRead(n.id)}>
                          <Check size={14} color={C.violet600} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  </View>
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

