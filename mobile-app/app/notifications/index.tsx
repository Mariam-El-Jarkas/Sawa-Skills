import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Check, X, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Toggle } from '../../components/Toggle';
import { C, G } from '../../components/theme';
import { LinearGradient } from 'expo-linear-gradient';

const notifs = [
  { id: 1, type: 'swap', title: 'New Swap Request', message: 'Sarah M. wants to swap Cooking for Guitar Lessons', time: '10 minutes ago', unread: true },
  { id: 2, type: 'message', title: 'New Message', message: 'John D. sent you a message', time: '1 hour ago', unread: true },
  { id: 3, type: 'news', title: 'Skill News: Cooking', message: 'New cooking classes available in Beirut', time: '2 hours ago', unread: true },
  { id: 4, type: 'swap', title: 'Swap Completed', message: 'Your swap with Maya K. has been completed', time: 'Yesterday', unread: false },
  { id: 5, type: 'volunteer', title: 'Volunteer Session Reminder', message: 'Your volunteer session starts tomorrow at 2 PM', time: 'Yesterday', unread: false },
];

const TYPE_EMOJI: Record<string, string> = { swap: '🔄', message: '💬', news: '📰', volunteer: '❤️' };
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  swap: { bg: '#DBEAFE', text: '#2563EB' },
  message: { bg: '#DCFCE7', text: '#16A34A' },
  news: { bg: '#EDE9FE', text: C.violet600 },
  volunteer: { bg: '#FFEDD5', text: '#EA580C' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({ swaps: true, messages: true, news: true, volunteer: true });
  const [requests, setRequests] = useState([
    { id: 1, name: 'Ali K.', skills: 'Design', time: '2 hours ago' },
    { id: 2, name: 'Nour F.', skills: 'Web Dev', time: '5 hours ago' },
  ]);

  return (
    <View style={s.screen}>
      <LinearGradient colors={G.header} style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={C.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Connection Requests */}
        {requests.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>CONNECTION REQUESTS</Text>
            {requests.map(req => (
              <View key={req.id} style={s.requestCard}>
                <View style={s.reqAvatar}><Text style={s.reqAvatarTxt}>{req.name[0]}</Text></View>
                <View style={s.reqInfo}>
                  <Text style={s.reqName}>{req.name}</Text>
                  <Text style={s.reqSkills}>{req.skills}</Text>
                  <Text style={s.reqTime}>{req.time}</Text>
                </View>
                <View style={s.reqBtns}>
                  <TouchableOpacity style={s.acceptBtn} onPress={() => setRequests(r => r.filter(x => x.id !== req.id))}>
                    <Check size={16} color={C.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.rejectBtn} onPress={() => setRequests(r => r.filter(x => x.id !== req.id))}>
                    <X size={16} color={C.gray600} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notifications */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>RECENT</Text>
          {notifs.map(n => {
            const tc = TYPE_COLORS[n.type];
            return (
              <View key={n.id} style={[s.notifCard, n.unread && s.notifCardUnread]}>
                <View style={[s.notifIcon, { backgroundColor: tc.bg }]}>
                  <Text style={s.notifEmoji}>{TYPE_EMOJI[n.type]}</Text>
                </View>
                <View style={s.notifContent}>
                  <View style={s.notifTitleRow}>
                    <Text style={s.notifTitle}>{n.title}</Text>
                    {n.unread && <View style={s.unreadDot} />}
                  </View>
                  <Text style={s.notifMsg}>{n.message}</Text>
                  <Text style={s.notifTime}>{n.time}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Settings */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>NOTIFICATION SETTINGS</Text>
          <View style={s.settingsCard}>
            {[['swaps', 'Swap Requests'], ['messages', 'Messages'], ['news', 'Skill News'], ['volunteer', 'Volunteer Updates']].map(([key, label]) => (
              <View key={key} style={s.toggleRow}>
                <Text style={s.toggleLabel}>{label}</Text>
                <Toggle checked={settings[key as keyof typeof settings]} onChange={v => setSettings(p => ({ ...p, [key]: v }))} />
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.white },
  section: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 1 },
  requestCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.gray100 },
  reqAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  reqAvatarTxt: { color: C.white, fontWeight: '700' },
  reqInfo: { flex: 1, gap: 2 },
  reqName: { fontWeight: '600', fontSize: 14 },
  reqSkills: { fontSize: 12, color: C.gray500 },
  reqTime: { fontSize: 11, color: C.gray400 },
  reqBtns: { flexDirection: 'row', gap: 8 },
  acceptBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.gray100, alignItems: 'center', justifyContent: 'center' },
  notifCard: { flexDirection: 'row', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.gray100 },
  notifCardUnread: { borderColor: '#DDD6FE', borderWidth: 1.5 },
  notifIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifEmoji: { fontSize: 18 },
  notifContent: { flex: 1, gap: 3 },
  notifTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '600', color: C.gray900 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.violet600 },
  notifMsg: { fontSize: 13, color: C.gray600 },
  notifTime: { fontSize: 11, color: C.gray400 },
  settingsCard: { backgroundColor: C.white, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: C.gray100 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 14, color: C.gray700 },
});
