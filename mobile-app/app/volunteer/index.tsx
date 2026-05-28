import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useToast } from '../../components/modals/AppToast';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Calendar, Users, X, CheckCircle, ArrowLeft, Plus } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../components/theme';

import { VerificationGate } from '../../components/VerificationGate';
import { volunteerService, VolunteerSession } from '../../services/volunteerService';

function parseTime12h(timeStr: string): string {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '00:00:00';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const p = match[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}:00`;
}

export default function VolunteerScreen() {
  const { C, G } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(C), [C]);
  const router = useRouter();
  const { isLoggedIn, user, token, setShowLoginPrompt } = useAuth();
  const { profile, applyForVolunteer } = useProfile();
  const isVerified = !!(user?.isAgeVerified || user?.isMinorVerified);
  const isVolunteer = !!(profile?.isVolunteer);
  
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showVerifyGate, setShowVerifyGate] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [confirmingOppId, setConfirmingOppId] = useState<number | null>(null);
  const [pendingApprovalIds, setPendingApprovalIds] = useState<Set<number>>(new Set());
  const { showToast } = useToast();
  
  const [appData, setAppData] = useState({ why: '', experience: '', skills: '' });
  const [sessionData, setSessionData] = useState({
    name: '',
    description: '',
    skills: '',
    date: '',
    time: '',
    location: '',
  });

  const [opportunities, setOpportunities] = useState<VolunteerSession[]>([]);
  const [mySessions, setMySessions] = useState<VolunteerSession[]>([]);

  const loadData = useCallback(() => {
    volunteerService.getAllSessions(token ?? undefined).then(setOpportunities).catch(console.error);
    if (isLoggedIn && token) {
      volunteerService.getMySessions(token).then(setMySessions).catch(console.error);
    }
  }, [isLoggedIn, token]);

  // Re-fetch every time screen comes into focus so isJoined is always current
  useFocusEffect(loadData);

  const handleJoin = (session: VolunteerSession) => {
    if (!isLoggedIn || !token) { setShowLoginPrompt(true); return; }
    if (!isVerified) { setShowVerifyGate(true); return; }
    if (session.isOrganizer) {
      showToast('You cannot join your own session', 'error');
      return;
    }
    if (session.isJoined) return;
    setConfirmingOppId(session.id);
  };

  const confirmJoin = async (session: VolunteerSession) => {
    try {
      await volunteerService.joinSession(session.id, token!);
      setOpportunities(prev => prev.map(o =>
        o.id === session.id ? { ...o, isJoined: true, participants: o.participants + 1 } : o
      ));
      setConfirmingOppId(null);
      showToast('Joined Successfully!', 'success');
    } catch (e: any) {
      setConfirmingOppId(null);
      const msg: string = e.message ?? '';
      if (msg.startsWith('PENDING_PARENT_APPROVAL:')) {
        setPendingApprovalIds(prev => new Set(prev).add(session.id));
        showToast(msg.replace('PENDING_PARENT_APPROVAL:', '').trim(), 'success');
      } else {
        showToast(msg || 'Failed to join session', 'error');
      }
    }
  };

  const handleAppSubmit = async () => {
    if (!isLoggedIn || !token) { setShowLoginPrompt(true); return; }
    if (!appData.why.trim() || !appData.experience.trim() || !appData.skills.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    try {
      await applyForVolunteer(appData.why.trim(), appData.experience.trim(), appData.skills.trim());
      showToast('Application submitted! We\'ll review it shortly.', 'success');
      setShowApplicationForm(false);
      setAppData({ why: '', experience: '', skills: '' });
    } catch (e: any) {
      const msg: string = e.message ?? '';
      if (msg.startsWith('PENDING_PARENT_APPROVAL:')) {
        showToast(msg.replace('PENDING_PARENT_APPROVAL:', '').trim(), 'success');
        setShowApplicationForm(false);
        setAppData({ why: '', experience: '', skills: '' });
      } else {
        showToast(msg || 'Failed to submit application. Please try again.', 'error');
      }
    }
  };

  const handleSessionSubmit = async () => {
    if (!token) { setShowLoginPrompt(true); return; }
    if (!sessionData.name || !sessionData.date) {
      showToast('Name and Date are required', 'error');
      return;
    }
    try {
      const isoDateTime = `${sessionData.date}T${parseTime12h(sessionData.time)}`;
      const locationType: 'REMOTE' | 'IN_PERSON' = sessionData.location.trim() ? 'IN_PERSON' : 'REMOTE';
      const created = await volunteerService.createSession({
        name: sessionData.name,
        description: sessionData.description,
        skills: sessionData.skills,
        isoDateTime,
        locationType,
        location: sessionData.location || undefined,
      }, token);
      setMySessions(prev => [created, ...prev]);
      setOpportunities(prev => [created, ...prev]);
      showToast('Session Created!', 'success');
      setShowSessionForm(false);
      setSessionData({ name: '', description: '', skills: '', date: '', time: '', location: '' });
      
      // Navigate to chat immediately
      if (created.groupChatId) {
        setTimeout(() => {
          router.push({ pathname: '/chat', params: { openId: created.groupChatId.toString() } });
        }, 500);
      }
    } catch (e: any) {
      showToast(e.message ?? 'Failed to create session', 'error');
    }
  };

  return (
    <View style={s.screen}>
      <LinearGradient colors={G.header} style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color={C.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Volunteer</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#6D28D9', '#8B5CF6']} style={s.heroBanner}>
          <View style={s.heroContent}>
            <Heart size={36} color={C.white} />
            <Text style={s.heroTitle}>Give Back to Your Community</Text>
            <Text style={s.heroSub}>Share your skills for free and make a difference in Lebanon</Text>
            {isVolunteer ? (
              <View style={[s.applyBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <CheckCircle size={16} color={C.white} />
                <Text style={[s.applyBtnTxt, { color: C.white }]}>Volunteer Badge Active</Text>
              </View>
            ) : profile?.volunteerStatus === 'PENDING' ? (
              <View style={[s.applyBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[s.applyBtnTxt, { color: C.white }]}>Application Under Review…</Text>
              </View>
            ) : !isLoggedIn ? (
              <TouchableOpacity style={s.applyBtn} onPress={() => setShowLoginPrompt(true)}>
                <Text style={s.applyBtnTxt}>Log In to Apply</Text>
              </TouchableOpacity>
            ) : !isVerified ? (
              <View style={[s.applyBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }]}>
                <Text style={[s.applyBtnTxt, { color: 'rgba(255,255,255,0.75)' }]}>Verify Your Account First</Text>
              </View>
            ) : (
              <TouchableOpacity style={s.applyBtn} onPress={() => setShowApplicationForm(true)}>
                <Text style={s.applyBtnTxt}>Become a Volunteer</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <View style={s.body}>
          {/* My Sessions */}
          {isLoggedIn && (isVolunteer || user?.isAgeVerified) && (
            <View style={s.section}>
              <View style={s.sectionHdr}>
                <Text style={s.sectionTitle}>My Sessions</Text>
                <TouchableOpacity style={s.createSessionBtn} onPress={() => setShowSessionForm(true)}>
                  <Plus size={14} color="#fff" />
                  <Text style={s.createSessionTxt}>Create</Text>
                </TouchableOpacity>
              </View>
              {mySessions.length === 0 ? (
                <Text style={{ color: C.gray400, fontSize: 13 }}>No sessions yet. Create one!</Text>
              ) : mySessions.map(s2 => (
                <View key={s2.id} style={s.mySessionCard}>
                  <View style={s.mySessionInfo}>
                    <Text style={s.mySessionTitle}>{s2.title}</Text>
                    <View style={s.mySessionMeta}>
                      <Text style={{ fontSize: 12, color: C.gray500 }}>{s2.date}</Text>
                    </View>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: s2.status === 'upcoming' ? C.violet100 : C.gray100 }]}>
                    <Text style={[s.statusTxt, { color: s2.status === 'upcoming' ? C.violet600 : C.gray500 }]}>
                      {s2.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Volunteer Opportunities</Text>
              {opportunities.map(opp => (
                <View key={opp.id} style={s.oppCard}>
                  <View style={s.oppBody}>
                    <Text style={s.oppTitle}>{opp.title}</Text>
                    <Text style={s.oppDesc}>{opp.description}</Text>
                    <View style={s.oppMeta}>
                      <View style={s.oppMetaItem}><Users size={12} color={C.gray400} /><Text style={s.oppMetaTxt}>By {opp.organizer}</Text></View>
                      <View style={s.oppMetaItem}><Calendar size={12} color={C.gray400} /><Text style={s.oppMetaTxt}>{opp.date}</Text></View>
                    </View>
                    <View style={s.oppFooter}>
                      {opp.isOrganizer ? (
                        <View style={s.organizerBadge}>
                          <Text style={s.organizerBadgeTxt}>Your Session</Text>
                        </View>
                      ) : confirmingOppId === opp.id ? (
                        <View style={{ width: '100%', gap: 8 }}>
                          {(opp.organizerAge || opp.organizerGender) && (
                            <View style={s.confirmSafety}>
                              <Text style={s.confirmSafetyTxt}>
                                <Text style={{ fontWeight: '700' }}>{opp.organizer}</Text>
                                {opp.organizerAge ? ` · Age ${opp.organizerAge}` : ''}
                                {opp.organizerGender && opp.organizerGender !== 'Prefer not to say' ? ` · ${opp.organizerGender}` : ''}
                              </Text>
                            </View>
                          )}
                          <View style={s.confirmActions}>
                            <TouchableOpacity style={s.cancelJoinBtn} onPress={() => setConfirmingOppId(null)}>
                              <Text style={s.cancelJoinTxt}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.confirmJoinBtn} onPress={() => confirmJoin(opp)}>
                              <Text style={s.confirmJoinTxt}>Confirm Join</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : opp.isJoined && opp.groupChatId ? (
                        <TouchableOpacity
                          style={[s.joinBtn, s.joinBtnDone]}
                          onPress={() => router.push({ pathname: '/chat', params: { openId: opp.groupChatId.toString() } })}
                        >
                          <Text style={[s.joinBtnTxt, s.joinBtnTxtDone]}>Open Chat</Text>
                        </TouchableOpacity>
                      ) : pendingApprovalIds.has(opp.id) ? (
                        <View style={[s.joinBtn, { backgroundColor: C.violet600, opacity: 0.75 }]}>
                          <Text style={[s.joinBtnTxt, { color: '#fff' }]}>⏳ Awaiting Approval</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[s.joinBtn, opp.isJoined ? s.joinBtnDone : null]}
                          onPress={() => handleJoin(opp)}
                        >
                          <Text style={[s.joinBtnTxt, opp.isJoined ? s.joinBtnTxtDone : null]}>
                            {opp.isJoined ? 'Joined ✓' : 'Join'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Application Form Modal */}
      <Modal visible={showApplicationForm} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.modalOverlay}>
          <View style={s.formSheet}>
            <View style={s.formHdr}>
              <Text style={s.formTitle}>Volunteer Application</Text>
              <TouchableOpacity onPress={() => setShowApplicationForm(false)}>
                <X size={22} color={C.gray700} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.formBody}>
                {[
                  { label: 'WHY DO YOU WANT TO VOLUNTEER?', key: 'why', placeholder: 'Share your motivation...' },
                  { label: 'RELEVANT EXPERIENCE', key: 'experience', placeholder: 'Describe your experience...' },
                  { label: 'SKILLS YOU WANT TO SHARE', key: 'skills', placeholder: 'e.g. Cooking, Guitar, Coding...' },
                ].map(({ label, key, placeholder }) => (
                  <View key={key}>
                    <Text style={s.fieldLabel}>{label}</Text>
                    <TextInput
                      style={s.fieldInput}
                      value={appData[key as keyof typeof appData]}
                      onChangeText={v => setAppData(p => ({ ...p, [key]: v }))}
                      placeholder={placeholder}
                      placeholderTextColor={C.gray400}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                ))}
                <View style={s.formBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setShowApplicationForm(false)}>
                    <Text style={s.cancelBtnTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.submitBtn} onPress={handleAppSubmit}>
                    <Text style={s.submitBtnTxt}>Submit Application</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Session Modal */}
      <Modal visible={showSessionForm} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.modalOverlay}>
          <View style={s.formSheet}>
            <View style={s.formHdr}>
              <Text style={s.formTitle}>Create Volunteer Session</Text>
              <TouchableOpacity onPress={() => setShowSessionForm(false)}>
                <X size={22} color={C.gray700} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.formBody}>
                {[
                  { label: 'SESSION NAME', key: 'name', placeholder: 'e.g. Arabic for Beginners' },
                  { label: 'DESCRIPTION', key: 'description', placeholder: 'Share details about the session...' },
                  { label: 'SKILLS INVOLVED', key: 'skills', placeholder: 'e.g. Arabic, Teaching' },
                  { label: 'DATE (YYYY-MM-DD)', key: 'date', placeholder: '2026-03-15' },
                  { label: 'TIME', key: 'time', placeholder: 'e.g. 3:00 PM' },
                  { label: 'LOCATION (OPTIONAL)', key: 'location', placeholder: 'e.g. Beirut Library or Zoom' },
                ].map(({ label, key, placeholder }) => (
                  <View key={key}>
                    <Text style={s.fieldLabel}>{label}</Text>
                    <TextInput
                      style={[s.fieldInput, key === 'description' ? s.fieldTextarea : null]}
                      value={sessionData[key as keyof typeof sessionData] as string}
                      onChangeText={v => setSessionData(p => ({ ...p, [key]: v }))}
                      placeholder={placeholder}
                      placeholderTextColor={C.gray400}
                      multiline={key === 'description'}
                      numberOfLines={key === 'description' ? 3 : 1}
                    />
                  </View>
                ))}

                <View style={s.groupChatInfo}>
                  <Text style={s.groupChatInfoTxt}>💬 A group chat will be created automatically for this session</Text>
                </View>

                <View style={s.formBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setShowSessionForm(false)}>
                    <Text style={s.cancelBtnTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.submitBtn} onPress={handleSessionSubmit}>
                    <Text style={s.submitBtnTxt}>Create Session</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Verification gate — shown when an unverified user tries to join a session */}
      {showVerifyGate && (
        <View style={StyleSheet.absoluteFillObject}>
          <VerificationGate feature="Volunteer Sessions" />
          {/* Tap outside the card to dismiss */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowVerifyGate(false)}
          />
        </View>
      )}
    </View>
  );
}

function createStyles(C: ThemeColors) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.white },
  heroBanner: { margin: 16, borderRadius: 20, overflow: 'hidden' },
  heroContent: { padding: 24, alignItems: 'center', gap: 10 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.white, textAlign: 'center' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.white, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  applyBtnTxt: { color: C.violet600, fontWeight: '700', fontSize: 15 },
  body: { paddingHorizontal: 16, gap: 20, paddingBottom: 20 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.gray900 },
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  createSessionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.violet600, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  createSessionTxt: { color: C.white, fontWeight: '700', fontSize: 13 },
  oppCard: { backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.gray100 },
  oppBody: { padding: 14, gap: 8 },
  oppTitle: { fontSize: 16, fontWeight: '700', color: C.gray900 },
  oppDesc: { fontSize: 13, color: C.gray600, lineHeight: 18 },
  oppMeta: { flexDirection: 'row', gap: 14 },
  oppMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  oppMetaTxt: { fontSize: 12, color: C.gray500 },
  oppFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  joinBtn: { backgroundColor: C.violet600, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  joinBtnDone: { backgroundColor: C.violet100 },
  joinBtnTxt: { color: C.white, fontWeight: '700', fontSize: 13 },
  joinBtnTxtDone: { color: C.violet600 },
  confirmSafety: { backgroundColor: C.violet50, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: C.violet100 },
  confirmSafetyTxt: { fontSize: 12, color: C.emerald600 },
  confirmActions: { flexDirection: 'row', gap: 8 },
  cancelJoinBtn: { backgroundColor: C.gray100, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  cancelJoinTxt: { color: C.gray700, fontWeight: '600', fontSize: 13 },
  confirmJoinBtn: { backgroundColor: C.violet600, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  confirmJoinTxt: { color: C.white, fontWeight: '700', fontSize: 13 },
  mySessionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.gray100 },
  mySessionInfo: { gap: 4 },
  mySessionTitle: { fontWeight: '700', fontSize: 15, color: C.gray900 },
  mySessionMeta: { flexDirection: 'row', gap: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTxt: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  formSheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  formHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  formTitle: { fontSize: 18, fontWeight: '700' },
  formBody: { padding: 20, gap: 14 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.gray400, letterSpacing: 1, marginBottom: 6 },
  fieldInput: { backgroundColor: C.gray50, borderRadius: 12, padding: 12, fontSize: 14, color: C.gray900, borderWidth: 1, borderColor: C.gray200 },
  fieldTextarea: { minHeight: 80, textAlignVertical: 'top' },
  organizerBadge: { backgroundColor: C.violet100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  organizerBadgeTxt: { color: C.violet600, fontWeight: '700', fontSize: 13 },
  groupChatInfo: { backgroundColor: C.violet50, borderRadius: 12, padding: 12, marginTop: 4, borderWidth: 1, borderColor: C.violet100 },
  groupChatInfoTxt: { fontSize: 13, color: C.violet600, fontWeight: '500' },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.gray100, alignItems: 'center' },
  cancelBtnTxt: { fontWeight: '600', color: C.gray700 },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.violet600, alignItems: 'center' },
  submitBtnTxt: { fontWeight: '700', color: C.white },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
}); }
