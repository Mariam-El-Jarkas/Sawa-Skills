import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Star, Award, MapPin, Mail, Phone, Edit, LogOut, Trash2, ArrowLeft, Users, MessageCircle, UserMinus, CheckCircle2, ShieldCheck, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Toggle } from '../../components/Toggle';
import { C, G } from '../../components/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { isLoggedIn, logout, user, verifyAge, verifyMinor } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [about, setAbout] = useState('Passionate about learning and teaching. I love sharing my skills and learning new ones from the community.');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyType, setVerifyType] = useState<'adult' | 'minor' | null>(null);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyData, setVerifyData] = useState({ fullName: '', dob: '' });
  const [parentEmail, setParentEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [settings, setSettings] = useState({ swapRequests: true, messages: true, skillNews: true, publicProfile: true, allowMessages: true });
  const [connections, setConnections] = useState([
    { id: 1, name: 'Sarah M.', skills: 'Cooking, Music', avatar: 'SM', swaps: 5 },
    { id: 2, name: 'John D.', skills: 'Photography, Art', avatar: 'JD', swaps: 3 },
    { id: 3, name: 'Maya K.', skills: 'Languages, Writing', avatar: 'MK', swaps: 2 },
  ]);

  React.useEffect(() => { if (!isLoggedIn) router.replace('/auth'); }, [isLoggedIn]);
  if (!isLoggedIn) return null;

  const reviews = [
    { id: 1, user: 'Sarah M.', rating: 5, text: 'Great teacher! Very patient and knowledgeable.', date: '2026-02-25' },
    { id: 2, user: 'John D.', rating: 4, text: 'Learned a lot in our session. Highly recommend!', date: '2026-02-20' },
  ];

  if (showConnections) {
    return (
      <View style={s.screen}>
        <LinearGradient colors={G.header} style={s.connHdr}>
          <TouchableOpacity onPress={() => setShowConnections(false)}><ArrowLeft size={24} color={C.white} /></TouchableOpacity>
          <Text style={s.connHdrTitle}>My Connections</Text>
        </LinearGradient>
        <ScrollView>
          <View style={s.connBody}>
            <Text style={s.connCount}>{connections.length} connections</Text>
            {connections.map(c => (
              <View key={c.id} style={s.connCard}>
                <View style={s.connAvatar}><Text style={s.connAvatarTxt}>{c.avatar}</Text></View>
                <View style={s.connInfo}>
                  <Text style={s.connName}>{c.name}</Text>
                  <Text style={s.connSkills}>{c.skills}</Text>
                  <Text style={s.connSwaps}>{c.swaps} swaps together</Text>
                </View>
                <View style={s.connBtns}>
                  <TouchableOpacity style={s.connBtn} onPress={() => { setShowConnections(false); router.push('/chat'); }}>
                    <MessageCircle size={18} color={C.violet600} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.connBtn} onPress={() => setConnections(connections.filter(x => x.id !== c.id))}>
                    <UserMinus size={18} color={C.red600} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (showSettings) {
    return (
      <View style={s.screen}>
        <LinearGradient colors={G.header} style={s.connHdr}>
          <TouchableOpacity onPress={() => setShowSettings(false)}><ArrowLeft size={24} color={C.white} /></TouchableOpacity>
          <Text style={s.connHdrTitle}>Settings</Text>
        </LinearGradient>
        <ScrollView>
          <View style={s.settingsBody}>
            <View style={s.settingsCard}>
              <Text style={s.settingsSection}>ACCOUNT</Text>
              <View style={s.settingsRow}><Mail size={16} color={C.gray400} /><Text style={s.settingsLabel}>alex.morgan@example.com</Text></View>
              <View style={s.settingsRow}><Phone size={16} color={C.gray400} /><Text style={s.settingsLabel}>+961 123 456 789</Text></View>
            </View>
            <View style={s.settingsCard}>
              <Text style={s.settingsSection}>NOTIFICATIONS</Text>
              {[['swapRequests', 'Swap Requests'], ['messages', 'Messages'], ['skillNews', 'Skill News']].map(([key, label]) => (
                <View key={key} style={s.toggleRow}>
                  <Text style={s.toggleLabel}>{label}</Text>
                  <Toggle checked={settings[key as keyof typeof settings] as boolean} onChange={v => setSettings(p => ({ ...p, [key]: v }))} />
                </View>
              ))}
            </View>
            <View style={s.settingsCard}>
              <Text style={s.settingsSection}>PRIVACY</Text>
              {[['publicProfile', 'Public profile'], ['allowMessages', 'Allow messages']].map(([key, label]) => (
                <View key={key} style={s.toggleRow}>
                  <Text style={s.toggleLabel}>{label}</Text>
                  <Toggle checked={settings[key as keyof typeof settings] as boolean} onChange={v => setSettings(p => ({ ...p, [key]: v }))} />
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.settingsAction} onPress={() => { logout(); router.replace('/'); }}>
              <LogOut size={18} color={C.violet600} />
              <Text style={s.settingsActionTxt}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.settingsActionDanger}>
              <Trash2 size={18} color={C.red600} />
              <Text style={s.settingsActionDangerTxt}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <LinearGradient colors={['#6D28D9', '#8B5CF6', '#C4B5FD']} style={s.banner}>
          <View style={s.bannerTop}>
            <View style={s.profileRow}>
              <View style={s.profileAvatarWrap}>
                <Text style={s.profileAvatarTxt}>AM</Text>
              </View>
              <View style={s.profileInfo}>
                <Text style={s.profileName}>{user?.name || 'Alex Morgan'}</Text>
                {user?.isAgeVerified && (
                  <View style={s.verifiedBadge}><CheckCircle2 size={12} color={C.white} /><Text style={s.verifiedTxt}>Verified 18+</Text></View>
                )}
                <View style={s.ratingRow}>
                  <Star size={14} color={C.yellow400} fill={C.yellow400} />
                  <Text style={s.ratingTxt}>4.8 (18 reviews)</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={s.settingsBtn}>
              <Settings size={22} color={C.white} />
            </TouchableOpacity>
          </View>
          <View style={s.bannerMeta}>
            <View style={s.metaItem}><MapPin size={14} color={C.white} /><Text style={s.metaTxt}>Beirut, Lebanon</Text></View>
            <View style={s.metaItem}><Award size={14} color={C.white} /><Text style={s.metaTxt}>Volunteer Badge</Text></View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={s.statsCard}>
          {[{ val: '24', lbl: 'Swaps' }, { val: '4.8', lbl: 'Rating' }, { val: '18', lbl: 'Reviews' }].map(({ val, lbl }) => (
            <View key={lbl} style={s.statItem}>
              <Text style={s.statVal}>{val}</Text>
              <Text style={s.statLbl}>{lbl}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>
          {/* Connections Button */}
          <LinearGradient colors={G.violet} style={s.connBtn2}>
            <TouchableOpacity style={s.connBtn2Inner} onPress={() => setShowConnections(true)}>
              <Users size={22} color={C.white} />
              <View>
                <Text style={s.connBtn2Title}>My Connections</Text>
                <Text style={s.connBtn2Sub}>{connections.length} active connections</Text>
              </View>
              <ArrowLeft size={18} color={C.white} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Verify Banner */}
          {!user?.isAgeVerified && !user?.isMinorVerified && (
            <View style={s.verifyBanner}>
              <View style={s.verifyBannerContent}>
                <Text style={s.verifyBannerTitle}>Verify Your Account</Text>
                <Text style={s.verifyBannerSub}>Get a badge and unlock full features by confirming your identity.</Text>
                <TouchableOpacity style={s.verifyBannerBtn} onPress={() => { setVerifyStep(0); setVerifyType(null); setShowVerifyModal(true); }}>
                  <Text style={s.verifyBannerBtnTxt}>Start Verification</Text>
                </TouchableOpacity>
              </View>
              <ShieldCheck size={64} color="rgba(124,58,237,0.15)" style={{ position: 'absolute', right: -8, bottom: -8 }} />
            </View>
          )}

          {/* About */}
          <View>
            <View style={s.sectionHdr}>
              <Text style={s.sectionTitle}>About</Text>
              <TouchableOpacity onPress={() => setIsEditingAbout(!isEditingAbout)}><Edit size={16} color={C.violet600} /></TouchableOpacity>
            </View>
            {isEditingAbout ? (
              <View style={s.editAbout}>
                <TextInput style={s.aboutInput} value={about} onChangeText={setAbout} multiline numberOfLines={4} />
                <View style={s.editAboutBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setIsEditingAbout(false)}><Text style={s.cancelBtnTxt}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={() => setIsEditingAbout(false)}><Text style={s.saveBtnTxt}>Save</Text></TouchableOpacity>
                </View>
              </View>
            ) : <Text style={s.aboutTxt}>{about}</Text>}
          </View>

          {/* Skills */}
          {[{ title: 'Skills I Offer', skills: ['Web Development', 'Guitar', 'English Tutoring'], style: s.offerPill, txtStyle: s.offerPillTxt },
            { title: 'Skills I Want', skills: ['Photography', 'Arabic', 'Cooking'], style: s.wantPill, txtStyle: s.wantPillTxt }].map(({ title, skills, style: pStyle, txtStyle }) => (
            <View key={title}>
              <Text style={s.sectionTitle}>{title}</Text>
              <View style={s.pillsRow}>
                {skills.map(sk => <View key={sk} style={pStyle}><Text style={txtStyle}>{sk}</Text></View>)}
              </View>
            </View>
          ))}

          {/* Reviews */}
          <View>
            <Text style={s.sectionTitle}>Reviews</Text>
            {reviews.map(r => (
              <View key={r.id} style={s.reviewCard}>
                <View style={s.reviewHdr}>
                  <View style={s.reviewAvatar}><Text style={s.reviewAvatarTxt}>{r.user[0]}</Text></View>
                  <View style={s.reviewInfo}>
                    <Text style={s.reviewUser}>{r.user}</Text>
                    <View style={s.starsRow}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={12} color={i <= r.rating ? C.yellow400 : C.gray200} fill={i <= r.rating ? C.yellow400 : 'transparent'} />)}
                    </View>
                  </View>
                  <Text style={s.reviewDate}>{new Date(r.date).toLocaleDateString()}</Text>
                </View>
                <Text style={s.reviewTxt}>{r.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); router.replace('/'); }}>
            <LogOut size={18} color={C.red600} />
            <Text style={s.logoutTxt}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Verify Modal */}
      <Modal visible={showVerifyModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.verifySheet}>
            <View style={s.verifyModalHdr}>
              <View style={s.verifyStepBadge}><Text style={s.verifyStepTxt}>{verifyStep}/4</Text></View>
              <Text style={s.verifyModalTitle}>Account Verification</Text>
              <TouchableOpacity onPress={() => { setShowVerifyModal(false); setVerifyStep(0); setVerifyType(null); }}>
                <X size={22} color={C.gray500} />
              </TouchableOpacity>
            </View>

            {verifyStep === 0 && (
              <View style={s.verifyContent}>
                <Text style={s.verifyChooseTitle}>Choose Verification Type</Text>
                {[{ type: 'adult' as const, title: 'Adult Verification', sub: '18 years or older', Icon: ShieldCheck },
                  { type: 'minor' as const, title: 'Minor Verification', sub: 'Under 18 (Parental approval)', Icon: Users }].map(({ type, title, sub, Icon }) => (
                  <TouchableOpacity key={type} style={s.verifyChoice} onPress={() => { setVerifyType(type); setVerifyStep(1); }}>
                    <View style={s.verifyChoiceIcon}><Icon size={24} color={C.violet600} /></View>
                    <View><Text style={s.verifyChoiceTitle}>{title}</Text><Text style={s.verifyChoiceSub}>{sub}</Text></View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {verifyType === 'adult' && verifyStep === 1 && (
              <View style={s.verifyContent}>
                <Text style={s.verifyChooseTitle}>Identity Information</Text>
                <TextInput style={s.verifyInput} placeholder="Full Legal Name" value={verifyData.fullName} onChangeText={v => setVerifyData({ ...verifyData, fullName: v })} placeholderTextColor={C.gray400} />
                <TextInput style={s.verifyInput} placeholder="Date of Birth (YYYY-MM-DD)" value={verifyData.dob} onChangeText={v => setVerifyData({ ...verifyData, dob: v })} placeholderTextColor={C.gray400} />
                <View style={s.verifyBtns}>
                  <TouchableOpacity style={s.verifyBack} onPress={() => setVerifyStep(0)}><Text style={s.verifyBackTxt}>Back</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.verifyNext, !verifyData.fullName && s.verifyNextDisabled]} onPress={() => setVerifyStep(2)} disabled={!verifyData.fullName}>
                    <Text style={s.verifyNextTxt}>Next Step</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {verifyType === 'adult' && verifyStep >= 2 && verifyStep <= 3 && (
              <View style={s.verifyContent}>
                <Text style={s.verifyChooseTitle}>{verifyStep === 2 ? 'Upload Document' : 'Selfie Confirmation'}</Text>
                <Text style={s.verifyChoiceSub}>{verifyStep === 2 ? 'Attach a clear photo of your ID / Passport.' : 'Take a quick selfie to confirm your identity.'}</Text>
                <View style={s.uploadBox}><Text style={s.uploadBoxTxt}>📷 Tap to {verifyStep === 2 ? 'upload document' : 'take selfie'}</Text></View>
                <View style={s.verifyBtns}>
                  <TouchableOpacity style={s.verifyBack} onPress={() => setVerifyStep(verifyStep - 1)}><Text style={s.verifyBackTxt}>Back</Text></TouchableOpacity>
                  <TouchableOpacity style={s.verifyNext} onPress={() => setVerifyStep(verifyStep + 1)}><Text style={s.verifyNextTxt}>Confirm</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {verifyType === 'adult' && verifyStep === 4 && (
              <View style={[s.verifyContent, { alignItems: 'center' }]}>
                <View style={s.successIcon}><CheckCircle2 size={40} color={C.emerald600} /></View>
                <Text style={s.verifyChooseTitle}>Processing Application</Text>
                <Text style={s.verifyChoiceSub}>Our team will review your documents within 24 hours.</Text>
                <TouchableOpacity style={s.verifyNext} onPress={async () => { setIsVerifying(true); await verifyAge(); setIsVerifying(false); setShowVerifyModal(false); setVerifyStep(0); setVerifyType(null); }}>
                  <Text style={s.verifyNextTxt}>{isVerifying ? 'Processing...' : 'Got it!'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {verifyType === 'minor' && verifyStep === 1 && (
              <View style={s.verifyContent}>
                <Text style={s.verifyChooseTitle}>Parental Approval</Text>
                <TextInput style={s.verifyInput} placeholder="Parent/Guardian Email" value={parentEmail} onChangeText={setParentEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={C.gray400} />
                <View style={s.verifyBtns}>
                  <TouchableOpacity style={s.verifyBack} onPress={() => setVerifyStep(0)}><Text style={s.verifyBackTxt}>Back</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.verifyNext, !parentEmail.includes('@') && s.verifyNextDisabled]} onPress={() => setVerifyStep(2)} disabled={!parentEmail.includes('@')}>
                    <Text style={s.verifyNextTxt}>Send Approval</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {verifyType === 'minor' && verifyStep === 2 && (
              <View style={[s.verifyContent, { alignItems: 'center' }]}>
                <Text style={s.verifyChooseTitle}>Email Sent!</Text>
                <Text style={s.verifyChoiceSub}>We've sent an approval link to {parentEmail}.</Text>
                <TouchableOpacity style={s.verifyNext} onPress={async () => { setIsVerifying(true); await verifyMinor(parentEmail); setIsVerifying(false); setShowVerifyModal(false); setVerifyStep(0); setVerifyType(null); }}>
                  <Text style={s.verifyNextTxt}>I'm Waiting!</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  banner: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 60 },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatarWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  profileAvatarTxt: { fontSize: 24, fontWeight: '700', color: C.violet600 },
  profileInfo: { gap: 4 },
  profileName: { fontSize: 22, fontWeight: '700', color: C.white },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  verifiedTxt: { fontSize: 10, fontWeight: '700', color: C.white },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingTxt: { fontSize: 13, color: C.white },
  settingsBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  bannerMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  statsCard: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 20, marginHorizontal: 16, marginTop: -32, padding: 16, borderWidth: 2, borderColor: '#DDD6FE', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, zIndex: 1 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: C.violet600 },
  statLbl: { fontSize: 12, color: C.gray500 },
  body: { padding: 16, gap: 20, paddingBottom: 40 },
  connBtn2: { borderRadius: 16 },
  connBtn2Inner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  connBtn2Title: { color: C.white, fontWeight: '700', fontSize: 15 },
  connBtn2Sub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  verifyBanner: { backgroundColor: '#EDE9FE', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#DDD6FE', overflow: 'hidden' },
  verifyBannerContent: { gap: 6 },
  verifyBannerTitle: { fontSize: 16, fontWeight: '700', color: C.violet600 },
  verifyBannerSub: { fontSize: 13, color: C.violet500 },
  verifyBannerBtn: { backgroundColor: C.violet600, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  verifyBannerBtnTxt: { color: C.white, fontWeight: '700', fontSize: 13 },
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: C.gray900, marginBottom: 8 },
  aboutTxt: { fontSize: 14, color: C.gray600, lineHeight: 20 },
  editAbout: { gap: 8 },
  aboutInput: { backgroundColor: C.gray50, borderWidth: 1, borderColor: C.gray200, borderRadius: 12, padding: 12, fontSize: 14, color: C.gray900, minHeight: 80, textAlignVertical: 'top' },
  editAboutBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: C.gray100, alignItems: 'center' },
  cancelBtnTxt: { color: C.gray700, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: C.violet600, alignItems: 'center' },
  saveBtnTxt: { color: C.white, fontWeight: '600' },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  offerPill: { backgroundColor: C.violet100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  offerPillTxt: { color: C.violet600, fontSize: 13, fontWeight: '500' },
  wantPill: { backgroundColor: C.violet50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  wantPillTxt: { color: C.violet600, fontSize: 13, fontWeight: '500' },
  reviewCard: { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: '#DDD6FE', marginBottom: 8 },
  reviewHdr: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarTxt: { color: C.white, fontWeight: '700', fontSize: 14 },
  reviewInfo: { flex: 1 },
  reviewUser: { fontWeight: '600', fontSize: 13 },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  reviewDate: { fontSize: 11, color: C.gray400 },
  reviewTxt: { fontSize: 13, color: C.gray600 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.red50, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#FEE2E2', marginTop: 8 },
  logoutTxt: { color: C.red600, fontWeight: '600', fontSize: 15 },
  connHdr: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 20 },
  connHdrTitle: { fontSize: 20, fontWeight: '700', color: C.white },
  connBody: { padding: 16, gap: 10 },
  connCount: { fontSize: 13, color: C.gray500 },
  connCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 2, borderColor: '#DDD6FE' },
  connAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  connAvatarTxt: { color: C.white, fontWeight: '700', fontSize: 16 },
  connInfo: { flex: 1, gap: 2 },
  connName: { fontWeight: '600', fontSize: 14 },
  connSkills: { fontSize: 12, color: C.gray500 },
  connSwaps: { fontSize: 11, color: C.violet600, fontWeight: '600' },
  connBtns: { flexDirection: 'row', gap: 6 },
  connBtn: { padding: 8, borderRadius: 10, backgroundColor: C.gray50 },
  settingsBody: { padding: 16, gap: 12, paddingBottom: 40 },
  settingsCard: { backgroundColor: C.white, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: C.gray100 },
  settingsSection: { fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 1 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsLabel: { fontSize: 14, color: C.gray700 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 14, color: C.gray700 },
  settingsAction: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.gray100 },
  settingsActionTxt: { fontSize: 15, color: C.gray800 },
  settingsActionDanger: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.red50, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#FEE2E2' },
  settingsActionDangerTxt: { fontSize: 15, color: C.red600 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  verifySheet: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, gap: 20 },
  verifyModalHdr: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  verifyStepBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
  verifyStepTxt: { fontSize: 12, fontWeight: '700', color: C.violet600 },
  verifyModalTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  verifyContent: { gap: 14 },
  verifyChooseTitle: { fontSize: 18, fontWeight: '700', color: C.gray900 },
  verifyChoice: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: 2, borderColor: C.violet100 },
  verifyChoiceIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
  verifyChoiceTitle: { fontWeight: '700', fontSize: 15 },
  verifyChoiceSub: { fontSize: 12, color: C.gray500, marginTop: 2 },
  verifyInput: { backgroundColor: C.gray50, borderRadius: 14, padding: 14, fontSize: 14, color: C.gray900, borderWidth: 1, borderColor: C.gray100 },
  verifyBtns: { flexDirection: 'row', gap: 10 },
  verifyBack: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.gray100, alignItems: 'center' },
  verifyBackTxt: { fontWeight: '700', color: C.gray700 },
  verifyNext: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: C.violet600, alignItems: 'center' },
  verifyNextDisabled: { opacity: 0.5 },
  verifyNextTxt: { fontWeight: '700', color: C.white },
  uploadBox: { height: 100, borderRadius: 16, borderWidth: 2, borderColor: C.gray200, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gray50 },
  uploadBoxTxt: { fontSize: 14, color: C.gray400 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
});
