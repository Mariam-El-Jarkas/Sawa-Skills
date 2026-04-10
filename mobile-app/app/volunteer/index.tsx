import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Modal, StyleSheet, Alert, DeviceEventEmitter } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Calendar, Users, X, CheckCircle, ArrowLeft, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { C, G } from '../../components/theme';

import { volunteerService, VolunteerSession } from '../../services/volunteerService';
import { Toggle } from '../../components/Toggle';

export default function VolunteerScreen() {
  const router = useRouter();
  const { isLoggedIn, token, setShowLoginPrompt } = useAuth();
  const { profile, applyForVolunteer } = useProfile();
  
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionSubmitted, setSessionSubmitted] = useState(false);
  
  const [appData, setAppData] = useState({ why: '', experience: '', skills: '' });
  const [sessionData, setSessionData] = useState({ 
    name: '', 
    description: '', 
    skills: '', 
    date: '', 
    time: '', 
    location: '',
    createGroupChat: true 
  });

  const [opportunities, setOpportunities] = useState<VolunteerSession[]>([]);
  const [mySessions, setMySessions] = useState<VolunteerSession[]>([]);

  const loadData = () => {
    volunteerService.getAllSessions().then(setOpportunities).catch(console.error);
    if (isLoggedIn && token) {
      volunteerService.getMySessions(token).then(setMySessions).catch(console.error);
    }
  };

  useEffect(() => {
    loadData();
  }, [isLoggedIn, token]);

  const handleJoin = async (session: VolunteerSession) => {
    if (!isLoggedIn || !token) { setShowLoginPrompt(true); return; }
    
    try {
      await volunteerService.joinSession(session.id, token);
      
      // Update local state to show "Joined" immediately
      setOpportunities(prev => prev.map(o => 
        o.id === session.id ? { ...o, isJoined: true, participants: o.participants + 1 } : o
      ));
      
      Alert.alert('Success', 'You have joined the session!', [
        { 
          text: session.groupChatId ? 'Go to Chat' : 'OK', 
          onPress: () => {
            if (session.groupChatId) {
              router.push({ pathname: '/chat', params: { openId: session.groupChatId } });
            }
          }
        }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to join session');
    }
  };

  const handleAppSubmit = async () => {
    if (!appData.why || !appData.experience || !appData.skills) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await applyForVolunteer(appData.why, appData.experience, appData.skills);
      setApplicationSubmitted(true);
      setShowApplicationForm(false);
      setTimeout(() => setApplicationSubmitted(false), 3000);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSessionSubmit = async () => {
    if (!token) { setShowLoginPrompt(true); return; }
    if (!sessionData.name || !sessionData.date) {
      Alert.alert('Error', 'Name and Date are required');
      return;
    }
    try {
      const created = await volunteerService.createSession(sessionData, token);
      setMySessions(prev => [created, ...prev]);
      setOpportunities(prev => [created, ...prev]);
      setSessionSubmitted(true);
      setShowSessionForm(false);
      setSessionData({ name: '', description: '', skills: '', date: '', time: '', location: '', createGroupChat: true });
      setTimeout(() => setSessionSubmitted(false), 3000);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create session');
    }
  };

  return (
    <View style={s.screen}>
      <LinearGradient colors={G.header} style={s.header}>
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
            {profile?.isVolunteer ? (
              <View style={[s.applyBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[s.applyBtnTxt, { color: C.white }]}>Application Under Review ✓</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={s.applyBtn}
                onPress={() => { if (!isLoggedIn) { setShowLoginPrompt(true); return; } setShowApplicationForm(true); }}
              >
                <Text style={s.applyBtnTxt}>Become a Volunteer</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <View style={s.body}>
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
                      <TouchableOpacity
                        style={[s.joinBtn, opp.isJoined ? s.joinBtnDone : null]}
                        onPress={() => handleJoin(opp)}
                      >
                        <Text style={[s.joinBtnTxt, opp.isJoined ? s.joinBtnTxtDone : null]}>
                          {opp.isJoined ? 'Joined ✓' : 'Join'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* My Sessions */}
          {isLoggedIn && (
            <View style={s.section}>
              <View style={s.sectionHdr}>
                <Text style={s.sectionTitle}>My Sessions</Text>
                <TouchableOpacity style={s.createSessionBtn} onPress={() => setShowSessionForm(true)}>
                  <Plus size={16} color={C.white} />
                  <Text style={s.createSessionTxt}>Create</Text>
                </TouchableOpacity>
              </View>
              {mySessions.map(sess => (
                <View key={sess.id} style={s.mySessionCard}>
                  <View style={s.mySessionInfo}>
                    <Text style={s.mySessionTitle}>{sess.title}</Text>
                    <View style={s.mySessionMeta}>
                      <View style={s.oppMetaItem}><Calendar size={12} color={C.gray400} /><Text style={s.oppMetaTxt}>{sess.date}</Text></View>
                      <View style={s.oppMetaItem}><Users size={12} color={C.gray400} /><Text style={s.oppMetaTxt}>{sess.participants} participants</Text></View>
                    </View>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={[s.statusTxt, { color: '#2563EB' }]}>{sess.status}</Text>
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
      </Modal>

      {/* Create Session Modal */}
      <Modal visible={showSessionForm} transparent animationType="slide">
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

                <View style={s.toggleField}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Create group chat for this session</Text>
                    <Text style={s.toggleSub}>Participants will be added automatically</Text>
                  </View>
                  <Toggle 
                    checked={sessionData.createGroupChat} 
                    onChange={v => setSessionData(p => ({ ...p, createGroupChat: v }))} 
                  />
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
      </Modal>

      {/* Toast */}
      {(applicationSubmitted || sessionSubmitted) && (
        <View style={s.toast}>
          <CheckCircle size={22} color={C.white} />
          <View>
            <Text style={s.toastTitle}>{applicationSubmitted ? 'Application Submitted!' : 'Session Created!'}</Text>
            <Text style={s.toastSub}>{applicationSubmitted ? "We'll review your application shortly" : 'Your session is now live'}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.white },
  heroBanner: { margin: 16, borderRadius: 20, overflow: 'hidden' },
  heroContent: { padding: 24, alignItems: 'center', gap: 10 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: C.white, textAlign: 'center' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  applyBtn: { backgroundColor: C.white, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
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
  toggleField: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.violet50, padding: 16, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: C.violet100 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: C.violet600 },
  toggleSub: { fontSize: 11, color: C.violet400, marginTop: 2 },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.gray100, alignItems: 'center' },
  cancelBtnTxt: { fontWeight: '600', color: C.gray700 },
  submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.violet600, alignItems: 'center' },
  submitBtnTxt: { fontWeight: '700', color: C.white },
  toast: { position: 'absolute', bottom: 90, left: 16, right: 16, backgroundColor: C.violet600, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  toastTitle: { color: C.white, fontWeight: '700', fontSize: 14 },
  toastSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});
