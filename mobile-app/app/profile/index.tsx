import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Image, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  CheckCircle2, ShieldCheck, X, Camera, ChevronRight, Clock, Pencil, Mail, Phone, Edit, Edit2, ArrowLeft, Settings, Star, Award, LogOut, Trash2, Users, MessageCircle, UserMinus, MapPin
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { profileService, PublicProfile } from '../../services/profileService';
import { Toggle } from '../../components/Toggle';
import { validateLebanesePhone } from '../../utils/validation';
import { C, G } from '../../components/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { userId: userIdParam } = useLocalSearchParams<{ userId?: string }>();
  const { isLoggedIn, logout, user, token, verifyAge, verifyMinor } = useAuth();
  const {
    profile, loading, refresh,
    updateBio, updateContact, uploadPicture, deleteProfilePicture,
    applyForVolunteer, requestEmailChange, verifyCurrentEmail, confirmEmailChange,
    submitSupportRequest
  } = useProfile(userIdParam);

  const isOwnProfile = !userIdParam || String(userIdParam) === String(user?.id);

  // ── View ──────────────────────────────────────────────────────────────────
  const [view, setView] = useState<'main' | 'connections' | 'settings'>('main');

  // ── Bio editing ───────────────────────────────────────────────────────────
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // ── Contact editing (Combined) ──────────────────────────────────────────
  const [showContactModal, setShowContactModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [emailStep, setEmailStep] = useState<'idle' | 'otp_current' | 'otp_new' | 'done' | 'recovery'>('idle');
  const [recoveryStep, setRecoveryStep] = useState<'options' | 'phone_input' | 'phone_otp' | 'support_form' | 'support_sent'>('options');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [supportForm, setSupportForm] = useState({
    oldEmail: '',
    newEmail: '',
    issueDescription: '',
    joinDate: '',
    location: '',
    usedFeatures: '',
    additionalProof: ''
  });
  const [contactBusy, setContactBusy] = useState(false);
  const [contactError, setContactError] = useState('');

  // ── Profile picture ───────────────────────────────────────────────────────
  const [uploadingPic, setUploadingPic] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showPicOptions, setShowPicOptions] = useState(false);

  // ── Volunteer ─────────────────────────────────────────────────────────────
  const [applyingVolunteer, setApplyingVolunteer] = useState(false);

  // ── Verification modal ────────────────────────────────────────────────────
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyType, setVerifyType] = useState<'adult' | 'minor' | 'volunteer' | null>(null);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyData, setVerifyData] = useState({ fullName: '', dob: '' });
  const [parentEmail, setParentEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [volApp, setVolApp] = useState({ why: '', experience: '', skills: '' });
  const [verifyImages, setVerifyImages] = useState({ idFront: null as string | null, idBack: null as string | null, selfie: null as string | null });

  // ── Notification / privacy toggles (local for now) ───────────────────────
  const [notif, setNotif] = useState({ swapRequests: true, messages: true, skillNews: true });
  const [privacy, setPrivacy] = useState({ publicProfile: true, allowMessages: true });

  const myConnections = profile?.connections || [];

  // ── Sync inputs when profile loads ───────────────────────────────────────
  useEffect(() => { setBioInput(profile?.bio ?? ''); }, [profile?.bio]);
  useEffect(() => { setPhoneInput(profile?.phone ?? ''); }, [profile?.phone]);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => { if (!isLoggedIn) router.replace('/auth'); }, [isLoggedIn]);
  if (!isLoggedIn) return null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const fmtRating = (r: number) => r > 0 ? r.toFixed(1) : '—';
  const fmtCount = (n: number) => n > 0 ? String(n) : '0';

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePickPicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2, // Fix 2MB limit constraint safely
      base64: true,
    });
    if (result.canceled || !result.assets[0].base64) return;
    setPreviewImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    setShowPreviewModal(true);
  };

  const handleConfirmPicture = async () => {
    if (!previewImage) return;
    setUploadingPic(true);
    try {
      await uploadPicture(previewImage);
      setShowPreviewModal(false);
      setPreviewImage(null);
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await updateBio(bioInput.trim());
      setIsEditingBio(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingBio(false);
    }
  };

  const handleUpdateContact = async () => {
    const trimmedPhone = phoneInput.trim();
    const trimmedEmail = newEmailInput.trim().toLowerCase();
    
    // Local Validation
    const phoneError = validateLebanesePhone(trimmedPhone);
    if (phoneError) {
      setContactError(phoneError);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setContactBusy(true);
    setContactError('');
    try {
      // 1. Save Phone if changed
      if (trimmedPhone !== (profile?.phone ?? '')) {
        await updateContact(trimmedPhone);
      }

      // 2. Handle Email flow if changed
      if (trimmedEmail !== (profile?.email ?? '').toLowerCase()) {
        if (!emailRegex.test(trimmedEmail)) {
          setContactError('Please enter a valid email address');
          setContactBusy(false);
          return;
        }
        await requestEmailChange(trimmedEmail);
        setEmailStep('otp_current');
        setOtpInput('');
      } else if (phoneInput.trim() !== (profile?.phone ?? '')) {
        // Only phone changed, show success step
        setEmailStep('done');
        setTimeout(() => {
          setShowContactModal(false);
          setEmailStep('idle');
        }, 2000);
      } else {
        setShowContactModal(false);
      }
    } catch (e: any) {
      setContactError(e.message);
    } finally {
      setContactBusy(false);
    }
  };

  const handleVerifyCurrent = async () => {
    if (!otpInput.trim()) { setContactError('Enter the verification code'); return; }
    setContactBusy(true);
    setContactError('');
    try {
      await verifyCurrentEmail(otpInput.trim());
      setEmailStep('otp_new');
      setOtpInput('');
    } catch (e: any) {
      setContactError(e.message);
    } finally {
      setContactBusy(false);
    }
  };

  const handleConfirmEmail = async () => {
    if (!otpInput.trim()) { setContactError('Enter the verification code'); return; }
    setContactBusy(true);
    setContactError('');
    try {
      await confirmEmailChange(otpInput.trim());
      setEmailStep('done');
      setTimeout(() => {
        setShowContactModal(false);
        setEmailStep('idle');
      }, 2000);
    } catch (e: any) {
      setContactError(e.message);
    } finally {
      setContactBusy(false);
    }
  };

  const handleProofPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setSupportForm(p => ({ ...p, additionalProof: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const handleVerifyImagePick = async (field: 'idFront' | 'idBack' | 'selfie') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setVerifyImages(p => ({ ...p, [field]: `data:image/jpeg;base64,${result.assets[0].base64}` }));
    }
  };

  const handleSubmitSupport = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !supportForm.oldEmail.trim() || 
      !supportForm.newEmail.trim() || 
      !supportForm.issueDescription.trim() ||
      !supportForm.joinDate.trim() ||
      !supportForm.location.trim() ||
      !supportForm.usedFeatures.trim()
    ) {
      setContactError('Please fill in all required fields');
      return;
    }
    if (!emailRegex.test(supportForm.oldEmail.trim()) || !emailRegex.test(supportForm.newEmail.trim())) {
      setContactError('Invalid email format in form');
      return;
    }
    if (supportForm.issueDescription.length > 2000) {
      setContactError('Description is too long (max 2000 chars)');
      return;
    }

    setContactBusy(true);
    setContactError('');
    try {
      const sanitizedForm = {
        ...supportForm,
        oldEmail: supportForm.oldEmail.trim(),
        newEmail: supportForm.newEmail.trim(),
        issueDescription: supportForm.issueDescription.trim()
      };
      await submitSupportRequest(sanitizedForm);
      setRecoveryStep('support_sent');
    } catch (e: any) {
      setContactError(e.message);
    } finally {
      setContactBusy(false);
    }
  };



  // ─────────────────────────────────────────────────────────────────────────
  // Render Logic
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.screen}>
      {view === 'connections' && (
        <>
          <LinearGradient colors={G.header} style={s.subHdr}>
            <TouchableOpacity onPress={() => setView('main')}><ArrowLeft size={24} color={C.white} /></TouchableOpacity>
            <Text style={s.subHdrTitle}>My Connections</Text>
          </LinearGradient>
          <ScrollView>
            <View style={s.subBody}>
              <Text style={s.connCount}>{myConnections.length} connections</Text>
              {myConnections.map(c => (
                <View key={c.id} style={s.connCard}>
                  <View style={s.connAvatar}><Text style={s.connAvatarTxt}>{c.avatarInitials || '?'}</Text></View>
                  <View style={s.connInfo}>
                    <Text style={s.connName}>{c.otherUserName}</Text>
                    <Text style={s.connSkills}>{c.skills?.join(', ') || 'No skills listed'}</Text>
                    <Text style={s.connSwaps}>0 swaps together</Text>
                  </View>
                  <View style={s.connBtns}>
                    <TouchableOpacity style={s.connActionBtn} onPress={() => { setView('main'); router.push('/chat'); }}>
                      <MessageCircle size={18} color={C.violet600} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.connActionBtn} onPress={() => { Alert.alert('Info', 'Removing connections not yet implemented.'); }}>
                      <UserMinus size={18} color={C.red600} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {view === 'settings' && (
        <>
          <LinearGradient colors={G.header} style={s.subHdr}>
            <TouchableOpacity onPress={() => setView('main')}>
              <ArrowLeft size={24} color={C.white} />
            </TouchableOpacity>
            <Text style={s.subHdrTitle}>Settings</Text>
          </LinearGradient>
          <ScrollView>
            <View style={s.subBody}>
              {/* ── Contact Information ── */}
              <View style={s.settingsCard}>
                <View style={s.sectionHdr}>
                  <Text style={s.settingsSection}>CONTACT INFORMATION</Text>
                  <TouchableOpacity onPress={() => {
                    setNewEmailInput(profile?.email ?? '');
                    setPhoneInput(profile?.phone ?? '');
                    setOtpInput('');
                    setContactError('');
                    setEmailStep('idle');
                    setShowContactModal(true);
                  }}>
                    <Edit2 size={16} color={C.violet600} />
                  </TouchableOpacity>
                </View>

                <View style={s.settingsRow}>
                  <Mail size={16} color={C.gray400} />
                  <Text style={s.settingsLabel} numberOfLines={1}>{profile?.email ?? '—'}</Text>
                </View>

                <View style={s.settingsRow}>
                  <Phone size={16} color={C.gray400} />
                  <Text style={s.settingsLabel}>{profile?.phone ?? 'Not set'}</Text>
                </View>
              </View>

              {/* ── Notifications ── */}
              <View style={s.settingsCard}>
                <Text style={s.settingsSection}>NOTIFICATIONS</Text>
                {([['swapRequests', 'Swap Requests'], ['messages', 'Messages'], ['skillNews', 'Skill News']] as const).map(([key, label]) => (
                  <View key={key} style={s.toggleRow}>
                    <Text style={s.toggleLabel}>{label}</Text>
                    <Toggle checked={notif[key]} onChange={v => setNotif(p => ({ ...p, [key]: v }))} />
                  </View>
                ))}
              </View>

              {/* ── Privacy ── */}
              <View style={s.settingsCard}>
                <Text style={s.settingsSection}>PRIVACY</Text>
                {([['publicProfile', 'Public profile'], ['allowMessages', 'Allow messages']] as const).map(([key, label]) => (
                  <View key={key} style={s.toggleRow}>
                    <Text style={s.toggleLabel}>{label}</Text>
                    <Toggle checked={privacy[key]} onChange={v => setPrivacy(p => ({ ...p, [key]: v }))} />
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
        </>
      )}

      {view === 'main' && (
        <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Banner ── */}
        <LinearGradient colors={['#6D28D9', '#8B5CF6', '#C4B5FD']} style={s.banner}>
          <View style={s.bannerTop}>
            <TouchableOpacity onPress={() => router.replace('/')} style={s.settingsBtn}>
              <ArrowLeft size={22} color={C.white} />
            </TouchableOpacity>

            <View style={s.profileRow}>

              {/* Avatar / picture */}
              <View style={{ alignItems: 'center', gap: 6 }}>
                <TouchableOpacity style={s.avatarWrap} onPress={handlePickPicture} disabled={uploadingPic}>
                  {profile?.profilePicture ? (
                    <Image source={{ uri: profile.profilePicture }} style={s.avatarImg} />
                  ) : (
                    <Text style={s.avatarTxt}>{getInitials(profile?.name || user?.name)}</Text>
                  )}
                  {uploadingPic && (
                    <View style={s.cameraOverlay}>
                      <ActivityIndicator size="small" color={C.white} />
                    </View>
                  )}
                </TouchableOpacity>
                {isOwnProfile && (
                  <TouchableOpacity onPress={() => setShowPicOptions(true)}>
                    <Text style={{ color: C.white, fontSize: 12, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>Edit Picture</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.profileInfo}>
                <Text style={s.profileName}>{profile?.name || user?.name || '—'}</Text>
                  <View style={s.badgeRow}>
                    {profile?.isAgeVerified && (
                      <View style={s.verifiedBadge}>
                        <CheckCircle2 size={12} color={C.white} />
                        <Text style={s.verifiedTxt}>Verified 18+</Text>
                      </View>
                    )}
                    {profile?.isMinorVerified && (
                      <View style={[s.verifiedBadge, { backgroundColor: 'rgba(16,185,129,0.3)' }]}>
                        <CheckCircle2 size={12} color={C.white} />
                        <Text style={s.verifiedTxt}>Minor Verified</Text>
                      </View>
                    )}
                    {profile?.isVolunteer && (
                      <View style={[s.verifiedBadge, { backgroundColor: 'rgba(245,158,11,0.3)' }]}>
                        <Award size={12} color={C.white} />
                        <Text style={s.verifiedTxt}>Volunteer</Text>
                      </View>
                    )}
                  </View>
                <View style={s.ratingRow}>
                  <Star size={14} color={C.yellow400} fill={C.yellow400} />
                  <Text style={s.ratingTxt}>
                    {profile ? `${fmtRating(profile.avgRating)} (${fmtCount(profile.reviewCount)} reviews)` : '—'}
                  </Text>
                </View>
              </View>
            </View>
            {isOwnProfile && (
              <TouchableOpacity onPress={() => setView('settings')} style={s.settingsBtn}>
                <Settings size={22} color={C.white} />
              </TouchableOpacity>
            )}
          </View>

          <View style={s.bannerMeta}>
            {profile?.location && (
              <View style={s.metaItem}><MapPin size={14} color={C.white} /><Text style={s.metaTxt}>{profile.location}</Text></View>
            )}
            {profile?.volunteerStatus === 'APPROVED' && (
              <View style={s.metaItem}><Award size={14} color={C.yellow400} /><Text style={s.metaTxt}>Volunteer</Text></View>
            )}
          </View>
        </LinearGradient>

        {/* ── Stats ── */}
        <View style={s.statsCard}>
          {loading && !profile ? (
            <ActivityIndicator color={C.violet600} style={{ flex: 1 }} />
          ) : (
            [
              { val: fmtCount(profile?.swapCount ?? 0), lbl: 'Swaps' },
              { val: fmtRating(profile?.avgRating ?? 0), lbl: 'Rating' },
              { val: fmtCount(profile?.reviewCount ?? 0), lbl: 'Reviews' },
            ].map(({ val, lbl }) => (
              <View key={lbl} style={s.statItem}>
                <Text style={s.statVal}>{val}</Text>
                <Text style={s.statLbl}>{lbl}</Text>
              </View>
            ))
          )}
        </View>

        <View style={s.body}>

          {/* ── Connections button ── */}
          {isOwnProfile && (
            <LinearGradient colors={G.violet} style={s.connBtn}>
              <TouchableOpacity style={s.connBtnInner} onPress={() => setView('connections')}>
                <Users size={22} color={C.white} />
                <View>
                  <Text style={s.connBtnTitle}>My Connections</Text>
                  <Text style={s.connBtnSub}>{myConnections.length} active connections</Text>
                </View>
                <ChevronRight size={18} color={C.white} />
              </TouchableOpacity>
            </LinearGradient>
          )}

          {/* ── Verification banner ── */}
          {isOwnProfile && ((!profile?.isAgeVerified && !profile?.isMinorVerified) || !profile?.isVolunteer) && (
            <View style={[s.verifyBanner, profile?.ageVerificationStatus === 'PENDING' && { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
              <View style={s.verifyBannerContent}>
                <Text style={[s.verifyBannerTitle, profile?.ageVerificationStatus === 'PENDING' && { color: '#B45309' }]}>
                  {profile?.ageVerificationStatus === 'PENDING' ? 'Verification Pending' : 'Verify Your Account'}
                </Text>
                <Text style={[s.verifyBannerSub, profile?.ageVerificationStatus === 'PENDING' && { color: '#D97706' }]}>
                  {profile?.ageVerificationStatus === 'PENDING' 
                    ? 'Our team is reviewing your documents. Please check back later.' 
                    : 'Get a badge and unlock full features.'}
                </Text>
                {profile?.ageVerificationStatus !== 'PENDING' && (
                  <TouchableOpacity
                    style={s.verifyBannerBtn}
                    onPress={() => { setVerifyStep(0); setVerifyType(null); setShowVerifyModal(true); }}
                  >
                    <Text style={s.verifyBannerBtnTxt}>Start Verification</Text>
                  </TouchableOpacity>
                )}
              </View>
              {profile?.ageVerificationStatus === 'PENDING' ? (
                <Clock size={64} color="rgba(217,119,6,0.1)" style={{ position: 'absolute', right: -8, bottom: -8 }} />
              ) : (
                <ShieldCheck size={64} color="rgba(124,58,237,0.15)" style={{ position: 'absolute', right: -8, bottom: -8 }} />
              )}
            </View>
          )}

          {/* ── About / Bio ── */}
          <View>
            <View style={s.sectionHdr}>
              <Text style={s.sectionTitle}>About</Text>
              {isOwnProfile && (
                <TouchableOpacity onPress={() => { setIsEditingBio(!isEditingBio); setBioInput(profile?.bio ?? ''); }}>
                  <Edit size={16} color={C.violet600} />
                </TouchableOpacity>
              )}
            </View>
            {isEditingBio ? (
              <View style={s.editAbout}>
                <TextInput
                  style={s.aboutInput}
                  value={bioInput}
                  onChangeText={setBioInput}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  placeholderTextColor={C.gray400}
                  placeholder="Tell the community about yourself..."
                />
                <Text style={s.charCount}>{bioInput.length}/500</Text>
                <View style={s.editAboutBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setIsEditingBio(false)}>
                    <Text style={s.cancelBtnTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.saveBtn, savingBio && s.btnDisabled]}
                    onPress={handleSaveBio}
                    disabled={savingBio}
                  >
                    {savingBio
                      ? <ActivityIndicator size="small" color={C.white} />
                      : <Text style={s.saveBtnTxt}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={s.aboutTxt}>
                {profile?.bio || 'No bio yet. Tap the edit icon to add one.'}
              </Text>
            )}
          </View>

          {/* ── Skills (from DB) ── */}
          {[
            { title: 'Skills I Offer', skills: profile?.offeredSkills ?? [], pill: s.offerPill, txt: s.offerPillTxt },
            { title: 'Skills I Want',  skills: profile?.wantedSkills  ?? [], pill: s.wantPill,  txt: s.wantPillTxt  },
          ].map(({ title, skills, pill, txt }) => (
            <View key={title}>
              <Text style={s.sectionTitle}>{title}</Text>
              {skills.length > 0 ? (
                <View style={s.pillsRow}>
                  {skills.map(sk => <View key={sk} style={pill}><Text style={txt}>{sk}</Text></View>)}
                </View>
              ) : (
                <Text style={s.emptyTxt}>None added yet.</Text>
              )}
            </View>
          ))}

          {/* ── Reviews ── */}
          <View>
            <Text style={s.sectionTitle}>Reviews</Text>
            {loading && !profile ? (
              <ActivityIndicator color={C.violet600} />
            ) : profile?.reviews?.length ? (
              profile.reviews.map(r => (
                <View key={r.id} style={s.reviewCard}>
                  <View style={s.reviewHdr}>
                    <View style={s.reviewAvatar}>
                      <Text style={s.reviewAvatarTxt}>{r.reviewerName[0]}</Text>
                    </View>
                    <View style={s.reviewInfo}>
                      <Text style={s.reviewUser}>{r.reviewerName}</Text>
                      <View style={s.starsRow}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={12} color={i <= r.rating ? C.yellow400 : C.gray200} fill={i <= r.rating ? C.yellow400 : 'transparent'} />
                        ))}
                      </View>
                    </View>
                    <Text style={s.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                  </View>
                  {r.comment ? <Text style={s.reviewTxt}>{r.comment}</Text> : null}
                </View>
              ))
            ) : (
              <Text style={s.emptyTxt}>No reviews yet.</Text>
            )}
          </View>

          {/* ── Logout ── */}
          {isOwnProfile && (
            <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); router.replace('/'); }}>
              <LogOut size={18} color={C.red600} />
              <Text style={s.logoutTxt}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    )}

      {/* ── Verification Modal ── */}
      <Modal visible={showVerifyModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.verifySheet}>
            <View style={s.verifyModalHdr}>
              <View style={s.verifyStepBadge}>
                {verifyStep === 0 ? <ShieldCheck size={18} color={C.violet600} /> : <Text style={s.verifyStepTxt}>{verifyStep}/{verifyType === 'adult' ? 4 : 2}</Text>}
              </View>
              <Text style={s.verifyModalTitle}>
                {verifyType === 'adult' ? 'Adult Verification' : verifyType === 'minor' ? 'Minor Verification' : verifyType === 'volunteer' ? 'Volunteer Application' : 'Account Verification'}
              </Text>
              <TouchableOpacity onPress={() => { setShowVerifyModal(false); setVerifyStep(0); setVerifyType(null); }}>
                <X size={22} color={C.gray500} />
              </TouchableOpacity>
            </View>

            {verifyStep === 0 && (
              <View style={s.verifyContent}>
                <Text style={s.verifyChooseTitle}>Choose Verification Type</Text>
                {([
                  { type: 'adult'     as const, title: 'Adult Verification',     sub: '18 years or older',               Icon: ShieldCheck, hide: profile?.isAgeVerified || profile?.isMinorVerified },
                  { type: 'minor'     as const, title: 'Minor Verification',     sub: 'Under 18 — parental approval',     Icon: Users, hide: profile?.isAgeVerified || profile?.isMinorVerified },
                  { type: 'volunteer' as const, title: 'Volunteer Verification', sub: 'Apply to join our volunteer team', Icon: Award, hide: profile?.isVolunteer },
                ] as const).filter(opt => !opt.hide).map(({ type, title, sub, Icon }) => (
                  <TouchableOpacity key={type} style={s.verifyChoice} onPress={() => { setVerifyType(type); setVerifyStep(1); }}>
                    <View style={s.verifyChoiceIcon}><Icon size={24} color={C.violet600} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.verifyChoiceTitle}>{title}</Text>
                      <Text style={s.verifyChoiceSub}>{sub}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {verifyType === 'adult' && verifyStep === 1 && (
              <View style={s.verifyContent}>
                <Text style={s.verifyChooseTitle}>Identity Information</Text>
                <TextInput style={s.verifyInput} placeholder="Full Legal Name" value={verifyData.fullName} onChangeText={v => setVerifyData({ ...verifyData, fullName: v })} placeholderTextColor={C.gray400} />
                <TextInput 
                  style={s.verifyInput} 
                  placeholder="Date of Birth (YYYY-MM-DD)" 
                  value={verifyData.dob} 
                  onChangeText={v => setVerifyData({ ...verifyData, dob: v })} 
                  placeholderTextColor={C.gray400} 
                  maxLength={10}
                />
                <View style={s.verifyBtns}>
                  <TouchableOpacity style={s.verifyBack} onPress={() => setVerifyStep(0)}><Text style={s.verifyBackTxt}>Back</Text></TouchableOpacity>
                  <TouchableOpacity 
                    style={[s.verifyNext, (!verifyData.fullName || verifyData.dob.length < 10) && s.verifyNextDisabled]} 
                    onPress={() => setVerifyStep(2)} 
                    disabled={!verifyData.fullName || verifyData.dob.length < 10}
                  >
                    <Text style={s.verifyNextTxt}>Next Step</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {verifyType === 'adult' && verifyStep >= 2 && verifyStep <= 3 && (
              <View style={s.verifyContent}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                  {[1, 2, 3, 4].map(sNum => (
                    <View key={sNum} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: sNum <= verifyStep ? C.violet600 : C.gray100 }} />
                  ))}
                </View>
                <Text style={s.verifyChooseTitle}>{verifyStep === 2 ? 'Step 2: Upload Document' : 'Step 3: Selfie Confirmation'}</Text>
                <Text style={s.verifyChoiceSub}>{verifyStep === 2 ? 'Attach a clear photo of your ID / Passport.' : 'Take a quick selfie to confirm your identity.'}</Text>
                 <TouchableOpacity 
                   style={[s.uploadBox, (verifyStep === 2 ? (verifyImages.idFront || verifyImages.idBack) : verifyImages.selfie) && { borderColor: C.emerald600 }]} 
                   onPress={() => handleVerifyImagePick(verifyStep === 2 ? (verifyImages.idFront ? 'idBack' : 'idFront') : 'selfie')}
                 >
                   {((verifyStep === 2 && (verifyImages.idFront || verifyImages.idBack)) || (verifyStep === 3 && verifyImages.selfie)) ? (
                     <Image 
                       source={{ uri: (verifyStep === 2 ? (verifyImages.idBack || verifyImages.idFront) : verifyImages.selfie) || '' }} 
                       style={{ width: '100%', height: '100%', borderRadius: 12 }} 
                     />
                   ) : (
                     <>
                       <Camera size={24} color={C.gray400} />
                       <Text style={s.uploadBoxTxt}>Tap to {verifyStep === 2 ? (verifyImages.idFront ? 'upload back of ID' : 'upload front of ID') : 'take selfie'}</Text>
                     </>
                   )}
                 </TouchableOpacity>
                  <View style={s.verifyBtns}>
                  <TouchableOpacity style={s.verifyBack} onPress={() => setVerifyStep(verifyStep - 1)}><Text style={s.verifyBackTxt}>Back</Text></TouchableOpacity>
                  <TouchableOpacity 
                    style={[s.verifyNext, ((verifyStep === 2 && !verifyImages.idFront) || (verifyStep === 3 && !verifyImages.selfie)) && s.verifyNextDisabled]} 
                    onPress={() => setVerifyStep(verifyStep + 1)}
                    disabled={(verifyStep === 2 && !verifyImages.idFront) || (verifyStep === 3 && !verifyImages.selfie)}
                  >
                    <Text style={s.verifyNextTxt}>
                      {verifyStep === 2 ? (verifyImages.idFront ? 'Confirm & Next' : 'Upload Image') : (verifyImages.selfie ? 'Confirm & Next' : 'Upload Image')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {verifyType === 'adult' && verifyStep === 4 && (
              <View style={[s.verifyContent, { alignItems: 'center' }]}>
                {profile?.ageVerificationStatus === 'PENDING' ? (
                  <>
                    <View style={[s.successIcon, { backgroundColor: '#FEF3C7' }]}><Clock size={40} color="#D97706" /></View>
                    <Text style={s.verifyChooseTitle}>Request Already Pending</Text>
                    <Text style={[s.verifyChoiceSub, { textAlign: 'center' }]}>You have a pending verification request. We will notify you once reviewed.</Text>
                  </>
                ) : (
                  <>
                    <View style={s.successIcon}><CheckCircle2 size={40} color={C.emerald600} /></View>
                    <Text style={s.verifyChooseTitle}>Processing Application</Text>
                    <Text style={s.verifyChoiceSub}>Our team will review your documents within 24 hours.</Text>
                  </>
                )}
                <TouchableOpacity 
                   style={[s.verifyNext, (!verifyImages.idFront || !verifyImages.selfie || isVerifying) && s.verifyNextDisabled]} 
                   disabled={!verifyImages.idFront || !verifyImages.selfie || isVerifying}
                   onPress={async () => {
                     // If we are already pending, just close the modal
                     if (profile?.ageVerificationStatus === 'PENDING') {
                       setShowVerifyModal(false);
                       return;
                     }

                     setIsVerifying(true);
                     try {
                       const ok = await verifyAge({
                         fullName: verifyData.fullName,
                         dob: verifyData.dob,
                         idFrontImage: verifyImages.idFront || '',
                         idBackImage: verifyImages.idBack,
                         selfieImage: verifyImages.selfie || ''
                       });

                       if (ok) {
                         // Reset and Close
                         setVerifyStep(0);
                         setVerifyType(null);
                         setVerifyImages({ idFront: null, idBack: null, selfie: null });
                         setVerifyData({ fullName: '', dob: '' });
                         setParentEmail('');
                         setVolApp({ why: '', experience: '', skills: '' });
                         setShowVerifyModal(false); 
                         // Refresh after closing for smoothness
                         setTimeout(refresh, 500);
                       } else {
                         Alert.alert('Submission Failed', 'Please ensure all images are clear and retry.');
                       }
                     } catch (e) {
                       console.error('Final verification error:', e);
                       Alert.alert('Submission Error', 'Could not connect to the server.');
                     } finally {
                       setIsVerifying(false);
                     }
                   }}
                >
                  <Text style={s.verifyNextTxt}>{isVerifying ? 'Processing...' : 'Got it!'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {verifyType === 'minor' && verifyStep === 1 && (
              <View style={s.verifyContent}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                  {[1, 2].map(sNum => (
                    <View key={sNum} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: sNum <= verifyStep ? C.violet600 : C.gray100 }} />
                  ))}
                </View>
                <Text style={s.verifyChooseTitle}>Step 1: Parental Approval</Text>
                <TextInput style={s.verifyInput} placeholder="Parent/Guardian Email" value={parentEmail} onChangeText={setParentEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={C.gray400} />
                <View style={s.verifyBtns}>
                  <TouchableOpacity style={s.verifyBack} onPress={() => setVerifyStep(0)}><Text style={s.verifyBackTxt}>Back</Text></TouchableOpacity>
                  <TouchableOpacity
                    style={[s.verifyNext, (!parentEmail.includes('@') || isVerifying) && s.verifyNextDisabled]}
                    disabled={!parentEmail.includes('@') || isVerifying}
                    onPress={async () => {
                      setIsVerifying(true);
                      const ok = await verifyMinor(parentEmail);
                      setIsVerifying(false);
                      if (ok) setVerifyStep(2);
                    }}
                  >
                    <Text style={s.verifyNextTxt}>{isVerifying ? 'Sending...' : 'Send Approval'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {verifyType === 'minor' && verifyStep === 2 && (
              <View style={[s.verifyContent, { alignItems: 'center' }]}>
                <View style={s.successIcon}><CheckCircle2 size={40} color={C.emerald600} /></View>
                <Text style={s.verifyChooseTitle}>Approval Email Sent!</Text>
                <Text style={[s.verifyChoiceSub, { textAlign: 'center' }]}>
                  An approval link has been sent to{'\n'}<Text style={{ fontWeight: '700', color: C.violet600 }}>{parentEmail}</Text>.{'\n\n'}Your account will be fully activated once your parent approves.
                </Text>
                <TouchableOpacity style={s.verifyNext} onPress={() => { 
                  setShowVerifyModal(false); 
                  setVerifyStep(0); 
                  setVerifyType(null);
                  setParentEmail('');
                }}>
                  <Text style={s.verifyNextTxt}>Got it!</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Volunteer flow ── */}
            {verifyType === 'volunteer' && verifyStep === 1 && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }} keyboardShouldPersistTaps="handled">
                <View style={s.verifyContent}>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                    {[1, 2].map(sNum => (
                      <View key={sNum} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: sNum <= verifyStep ? C.violet600 : C.gray100 }} />
                    ))}
                  </View>
                  <Text style={s.verifyChooseTitle}>Step 1: Volunteer Application</Text>
                  <Text style={s.verifyChoiceSub}>
                    As a SawaSkills volunteer you help organise community events, moderate swap sessions, and support new members.
                  </Text>

                  {['PENDING', 'APPROVED', 'REJECTED'].includes(profile?.volunteerStatus as string) ? (
                    <View style={{ alignItems: 'center', backgroundColor: C.gray50, padding: 20, borderRadius: 16, marginTop: 10 }}>
                      {profile!.volunteerStatus === 'PENDING' && (
                        <>
                          <View style={[s.successIcon, { backgroundColor: '#FEF3C7', marginBottom: 12 }]}><Award size={36} color="#D97706" /></View>
                          <Text style={[s.verifyChoiceTitle, { textAlign: 'center', color: '#D97706' }]}>Application Pending</Text>
                          <Text style={{ textAlign: 'center', color: C.gray500, marginTop: 8, fontSize: 13, lineHeight: 18 }}>We are currently reviewing your application. You will be notified once approved.</Text>
                        </>
                      )}
                      {profile?.volunteerStatus === 'APPROVED' && (
                        <>
                          <View style={[s.successIcon, { backgroundColor: '#D1FAE5', marginBottom: 12 }]}><CheckCircle2 size={36} color={C.emerald600} /></View>
                          <Text style={[s.verifyChoiceTitle, { textAlign: 'center', color: C.emerald600 }]}>Volunteer Approved!</Text>
                          <Text style={{ textAlign: 'center', color: C.gray500, marginTop: 8, fontSize: 13, lineHeight: 18 }}>Thank you for your service to the community.</Text>
                        </>
                      )}
                      {profile?.volunteerStatus === 'REJECTED' && (
                        <>
                          <View style={[s.successIcon, { backgroundColor: '#FEE2E2', marginBottom: 12 }]}><X size={36} color={C.red600} /></View>
                          <Text style={[s.verifyChoiceTitle, { textAlign: 'center', color: C.red600 }]}>Application Not Approved</Text>
                          <Text style={{ textAlign: 'center', color: C.gray500, marginTop: 8, fontSize: 13, lineHeight: 18 }}>Unfortunately, we cannot approve your volunteer status at this time.</Text>
                        </>
                      )}
                    </View>
                  ) : (
                    <View style={{ gap: 12, width: '100%', marginTop: 10 }}>
                      <TextInput style={[s.verifyInput, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Why do you want to volunteer?" value={volApp.why} onChangeText={t => setVolApp({...volApp, why: t})} placeholderTextColor={C.gray400} multiline />
                      <TextInput style={[s.verifyInput, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Relevant Experience" value={volApp.experience} onChangeText={t => setVolApp({...volApp, experience: t})} placeholderTextColor={C.gray400} multiline />
                      <TextInput style={[s.verifyInput, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Skills you want to share" value={volApp.skills} onChangeText={t => setVolApp({...volApp, skills: t})} placeholderTextColor={C.gray400} multiline />
                    </View>
                  )}

                  <View style={s.verifyBtns}>
                    <TouchableOpacity style={s.verifyBack} onPress={() => setVerifyStep(0)}>
                      <Text style={s.verifyBackTxt}>Back</Text>
                    </TouchableOpacity>
                    {!['PENDING', 'APPROVED', 'REJECTED'].includes(profile?.volunteerStatus as string) && (
                      <TouchableOpacity
                        style={[s.verifyNext, applyingVolunteer && { opacity: 0.7 }]}
                        disabled={applyingVolunteer}
                        onPress={async () => {
                          if (!volApp.why || !volApp.experience || !volApp.skills) {
                            Alert.alert('Missing Fields', 'Please fill in all the application fields.');
                            return;
                          }
                          setApplyingVolunteer(true);
                          try {
                            await applyForVolunteer(volApp.why, volApp.experience, volApp.skills);
                            setVerifyStep(2);
                          } catch (e: any) {
                            Alert.alert('Error', e.message);
                          } finally {
                            setApplyingVolunteer(false);
                          }
                        }}
                      >
                        <Text style={s.verifyNextTxt}>{applyingVolunteer ? 'Submitting...' : 'Apply Now'}</Text>
                      </TouchableOpacity>
                    )}
                    {['PENDING', 'APPROVED', 'REJECTED'].includes(profile?.volunteerStatus as string) && (
                      <TouchableOpacity style={s.verifyNext} onPress={() => { 
                  setShowVerifyModal(false); 
                  setVerifyStep(0); 
                  setVerifyType(null);
                  setVolApp({ why: '', experience: '', skills: '' });
                }}>
                        <Text style={s.verifyNextTxt}>Close</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </ScrollView>
            )}

            {verifyType === 'volunteer' && verifyStep === 2 && (
              <View style={[s.verifyContent, { alignItems: 'center' }]}>
                <View style={s.successIcon}><CheckCircle2 size={40} color={C.emerald600} /></View>
                <Text style={s.verifyChooseTitle}>Application Submitted!</Text>
                <Text style={[s.verifyChoiceSub, { textAlign: 'center' }]}>
                  Our team will review your application and get back to you soon.
                </Text>
                <TouchableOpacity style={s.verifyNext} onPress={() => { 
                  setShowVerifyModal(false); 
                  setVerifyStep(0); 
                  setVerifyType(null);
                  setVolApp({ why: '', experience: '', skills: '' });
                }}>
                  <Text style={s.verifyNextTxt}>Got it!</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Edit Picture Options Modal ── */}
      <Modal visible={showPicOptions} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.verifySheet, { paddingBottom: 30, paddingHorizontal: 20 }]}>
            <View style={[s.verifyModalHdr, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View />
              <Text style={s.verifyModalTitle}>Profile Picture</Text>
              <TouchableOpacity onPress={() => setShowPicOptions(false)}>
                <X size={22} color={C.gray500} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 12, marginTop: 10 }}>
              <TouchableOpacity style={s.verifyNext} onPress={() => { setShowPicOptions(false); handlePickPicture(); }}>
                <Text style={s.verifyNextTxt}>Upload New Image</Text>
              </TouchableOpacity>
              {profile?.profilePicture && (
                <TouchableOpacity style={[s.verifyNext, { backgroundColor: C.violet100 }]} onPress={async () => {
                  setShowPicOptions(false);
                  try { await deleteProfilePicture(); } catch(e:any) { Alert.alert('Error', e.message); }
                }}>
                  <Text style={[s.verifyNextTxt, { color: C.violet600 }]}>Remove Current Image</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Image Preview Modal ── */}
      <Modal visible={showPreviewModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.verifySheet, { alignItems: 'center', padding: 24 }]}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 20 }}>Confirm Profile Picture</Text>
            {previewImage && <Image source={{ uri: previewImage }} style={{ width: 140, height: 140, borderRadius: 70, marginBottom: 24, borderWidth: 2, borderColor: C.violet300 }} />}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity style={[s.verifyBack, { flex: 1 }]} onPress={() => { setShowPreviewModal(false); setPreviewImage(null); }} disabled={uploadingPic}>
                <Text style={s.verifyBackTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.verifyNext, { flex: 1 }]} onPress={handleConfirmPicture} disabled={uploadingPic}>
                {uploadingPic ? <ActivityIndicator size="small" color={C.white} /> : <Text style={s.verifyNextTxt}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Secure Email Change Modal ── */}
      <Modal visible={showContactModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.verifySheet}>
            <View style={s.verifyModalHdr}>
              <View style={[s.verifyStepBadge, { backgroundColor: C.violet100 }]}><Mail size={18} color={C.violet600} /></View>
              <Text style={s.verifyModalTitle}>Change Email Address</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)} disabled={contactBusy}>
                <X size={22} color={C.gray500} />
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            {['otp_current', 'otp_new', 'done'].includes(emailStep) && (
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
                {[1, 2, 3].map((stepNum) => {
                  const isActive = (emailStep === 'otp_current' && stepNum === 1) || (emailStep === 'otp_new' && stepNum === 2) || (emailStep === 'done' && stepNum === 3);
                  const isCompleted = (emailStep === 'otp_new' && stepNum < 2) || (emailStep === 'done' && stepNum < 3);
                  return (
                    <View key={stepNum} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: isCompleted ? C.violet600 : isActive ? C.violet400 : C.gray100 }} />
                  );
                })}
              </View>
            )}

            {emailStep === 'idle' && (
              <View style={s.verifyContent}>
                <Text style={s.verifyChoiceSub}>Update your information below. Changing your email requires a dual-step verification.</Text>
                
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.gray600, marginLeft: 4 }}>New Email Address</Text>
                  <TextInput
                    style={s.verifyInput}
                    placeholder="Enter new email"
                    value={newEmailInput}
                    onChangeText={setNewEmailInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={C.gray400}
                  />
                </View>

                <View style={{ gap: 6, marginTop: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.gray600, marginLeft: 4 }}>Phone Number</Text>
                  <TextInput
                    style={s.verifyInput}
                    placeholder="Phone number"
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                    keyboardType="phone-pad"
                    placeholderTextColor={C.gray400}
                  />
                </View>

                {contactError ? <Text style={s.inlineError}>{contactError}</Text> : null}

                <TouchableOpacity
                  style={[s.verifyNext, contactBusy && s.btnDisabled]}
                  onPress={handleUpdateContact}
                  disabled={contactBusy}
                >
                  {contactBusy ? <ActivityIndicator color={C.white} /> : <Text style={s.verifyNextTxt}>Next Step</Text>}
                </TouchableOpacity>
              </View>
            )}

            {emailStep === 'otp_current' && (
              <View style={s.verifyContent}>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <ShieldCheck size={48} color={C.violet600} strokeWidth={1.5} />
                  <Text style={[s.verifyChooseTitle, { marginTop: 12 }]}>Confirm Identity</Text>
                  <Text style={[s.verifyChoiceSub, { textAlign: 'center' }]}>To protect your account, we sent a code to your current email: <Text style={{ fontWeight: '700', color: C.gray900 }}>{profile?.email}</Text></Text>
                </View>
                
                <TextInput
                  style={[s.verifyInput, { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 'bold' }]}
                  placeholder="000000"
                  value={otpInput}
                  onChangeText={setOtpInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor={C.gray200}
                />

                {contactError ? <Text style={s.inlineError}>{contactError}</Text> : null}

                <TouchableOpacity onPress={() => setEmailStep('recovery')} style={{ alignSelf: 'center', marginVertical: 10 }}>
                  <Text style={{ color: C.violet600, fontWeight: '600', fontSize: 13 }}>Don't have access to your email?</Text>
                </TouchableOpacity>

                <View style={s.verifyBtns}>
                  <TouchableOpacity style={s.verifyBack} onPress={() => setEmailStep('idle')} disabled={contactBusy}>
                    <Text style={s.verifyBackTxt}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.verifyNext, (otpInput.length < 6 || contactBusy) && s.btnDisabled]}
                    onPress={handleVerifyCurrent}
                    disabled={otpInput.length < 6 || contactBusy}
                  >
                    {contactBusy ? <ActivityIndicator color={C.white} /> : <Text style={s.verifyNextTxt}>Verify Identity</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {emailStep === 'otp_new' && (
              <View style={s.verifyContent}>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <Mail size={48} color={C.violet600} strokeWidth={1.5} />
                  <Text style={[s.verifyChooseTitle, { marginTop: 12 }]}>Verify New Email</Text>
                  <Text style={[s.verifyChoiceSub, { textAlign: 'center' }]}>Code sent to your new email: <Text style={{ fontWeight: '700', color: C.gray900 }}>{newEmailInput}</Text></Text>
                </View>
                
                <TextInput
                  style={[s.verifyInput, { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 'bold' }]}
                  placeholder="000000"
                  value={otpInput}
                  onChangeText={setOtpInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor={C.gray200}
                />

                {contactError ? <Text style={s.inlineError}>{contactError}</Text> : null}

                <View style={s.verifyBtns}>
                  <TouchableOpacity style={s.verifyBack} onPress={() => setEmailStep('otp_current')} disabled={contactBusy}>
                    <Text style={s.verifyBackTxt}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.verifyNext, (otpInput.length < 6 || contactBusy) && s.btnDisabled]}
                    onPress={handleConfirmEmail}
                    disabled={otpInput.length < 6 || contactBusy}
                  >
                    {contactBusy ? <ActivityIndicator color={C.white} /> : <Text style={s.verifyNextTxt}>Complete Change</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {emailStep === 'done' && (
              <View style={[s.verifyContent, { alignItems: 'center', paddingVertical: 20 }]}>
                <View style={s.successIcon}><CheckCircle2 size={50} color={C.emerald600} /></View>
                <Text style={[s.verifyChooseTitle, { marginTop: 16 }]}>Profile Updated!</Text>
                <Text style={[s.verifyChoiceSub, { textAlign: 'center', marginBottom: 20 }]}>
                  {newEmailInput.trim().toLowerCase() !== (profile?.email ?? '').toLowerCase() 
                    ? `Your account email has been successfully changed to ${newEmailInput}.`
                    : 'Your contact information has been updated successfully.'}
                </Text>
                <View style={{ width: '100%', backgroundColor: C.emerald50, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: C.emerald100 }}>
                  <Text style={{ fontSize: 13, color: C.emerald800, textAlign: 'center' }}>Changes have been synchronized with your account.</Text>
                </View>
              </View>
            )}

            {emailStep === 'recovery' && (
              <View style={s.verifyContent}>
                <Text style={s.verifyChooseTitle}>Account Recovery</Text>
                <Text style={s.verifyChoiceSub}>Choose a method to recover access to your identity.</Text>
                
                {recoveryStep === 'options' && (
                  <View style={{ gap: 12, marginTop: 10 }}>
                    <TouchableOpacity 
                      style={[s.verifyChoice, { borderColor: C.violet100 }]} 
                      onPress={() => setRecoveryStep('phone_input')}
                    >
                      <View style={s.verifyChoiceIcon}><Phone size={24} color={C.violet600} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.verifyChoiceTitle}>Verify using phone number</Text>
                        <Text style={s.verifyChoiceSub}>We'll send a code to your registered mobile.</Text>
                      </View>
                      <ChevronRight size={20} color={C.gray300} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[s.verifyChoice, { borderColor: C.gray100 }]}
                      onPress={() => {
                        setSupportForm({
                          oldEmail: profile?.email || '',
                          newEmail: newEmailInput,
                          issueDescription: '',
                          joinDate: '',
                          location: profile?.location || '',
                          usedFeatures: '',
                          additionalProof: ''
                        });
                        setRecoveryStep('support_form');
                      }}
                    >
                      <View style={[s.verifyChoiceIcon, { backgroundColor: C.gray100 }]}><MessageCircle size={24} color={C.gray600} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.verifyChoiceTitle}>Contact support</Text>
                        <Text style={s.verifyChoiceSub}>Our team will help you manually verify.</Text>
                      </View>
                      <ChevronRight size={20} color={C.gray300} />
                    </TouchableOpacity>

                    <TouchableOpacity style={s.verifyBack} onPress={() => setEmailStep('otp_current')}>
                      <Text style={s.verifyBackTxt}>Back to Identity Proof</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {recoveryStep === 'phone_input' && (
                  <View style={{ gap: 16 }}>
                    <View style={{ gap: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: C.gray600 }}>Mobile Number</Text>
                      <TextInput
                        style={s.verifyInput}
                        placeholder="+1 (555) 000-0000"
                        value={recoveryPhone}
                        onChangeText={setRecoveryPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor={C.gray400}
                      />
                    </View>
                    <TouchableOpacity 
                      style={s.verifyNext} 
                      onPress={() => {
                        const phoneError = validateLebanesePhone(recoveryPhone);
                        if (phoneError) {
                          setContactError(phoneError);
                          return;
                        }
                        setContactError('');
                        setRecoveryStep('phone_otp');
                      }}
                    >
                      <Text style={s.verifyNextTxt}>Send Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setRecoveryStep('options')} style={{ alignSelf: 'center' }}>
                      <Text style={{ color: C.gray500, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {recoveryStep === 'phone_otp' && (
                  <View style={{ gap: 16 }}>
                    <Text style={[s.verifyChoiceSub, { textAlign: 'center' }]}>Enter the code sent to your phone ending in ***{recoveryPhone.slice(-4)}</Text>
                    <TextInput
                      style={[s.verifyInput, { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 'bold' }]}
                      placeholder="000000"
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholderTextColor={C.gray200}
                    />
                    <TouchableOpacity style={s.verifyNext} onPress={() => { Alert.alert('Success', 'Recovery successful (UI Demo only)'); setShowContactModal(false); }}>
                      <Text style={s.verifyNextTxt}>Verify Phone</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setRecoveryStep('phone_input')} style={{ alignSelf: 'center' }}>
                      <Text style={{ color: C.gray500, fontWeight: '600' }}>Back</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {recoveryStep === 'support_form' && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                    <View style={{ gap: 12 }}>
                      <Text style={s.verifyChoiceSub}>Please provide details to help our team verify your identity.</Text>
                      
                      <View style={{ gap: 4 }}>
                        <Text style={s.formLabel}>Current Account Email</Text>
                        <TextInput style={s.verifyInput} value={supportForm.oldEmail} onChangeText={t => setSupportForm({...supportForm, oldEmail: t})} placeholder="email@example.com" placeholderTextColor={C.gray400} />
                      </View>

                      <View style={{ gap: 4 }}>
                        <Text style={s.formLabel}>Desired New Email</Text>
                        <TextInput style={s.verifyInput} value={supportForm.newEmail} onChangeText={t => setSupportForm({...supportForm, newEmail: t})} placeholder="newemail@example.com" placeholderTextColor={C.gray400} />
                      </View>

                      <View style={{ gap: 4 }}>
                        <Text style={s.formLabel}>Issue Description</Text>
                        <TextInput style={[s.verifyInput, { minHeight: 60 }]} value={supportForm.issueDescription} onChangeText={t => setSupportForm({...supportForm, issueDescription: t})} placeholder="Why can't you access your email?" multiline placeholderTextColor={C.gray400} />
                      </View>

                      <View style={{ backgroundColor: C.gray50, padding: 12, borderRadius: 12, gap: 10 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: C.gray400 }}>IDENTITY VERIFICATION</Text>
                        
                        <View style={{ gap: 4 }}>
                          <Text style={s.formLabel}>Approx. Join Date</Text>
                          <TextInput style={s.verifyInput} value={supportForm.joinDate} onChangeText={t => setSupportForm({...supportForm, joinDate: t})} placeholder="Month/Year" placeholderTextColor={C.gray400} />
                        </View>

                        <View style={{ gap: 4 }}>
                          <Text style={s.formLabel}>Profile Location</Text>
                          <TextInput style={s.verifyInput} value={supportForm.location} onChangeText={t => setSupportForm({...supportForm, location: t})} placeholder="City, Country" placeholderTextColor={C.gray400} />
                        </View>

                        <View style={{ gap: 4 }}>
                          <Text style={s.formLabel}>Features Used (e.g. Swaps, Skills)</Text>
                          <TextInput style={s.verifyInput} value={supportForm.usedFeatures} onChangeText={t => setSupportForm({...supportForm, usedFeatures: t})} placeholder="List a few features you used" placeholderTextColor={C.gray400} />
                        </View>

                        <View style={{ gap: 8, marginTop: 4 }}>
                          <Text style={s.formLabel}>Additional Proof (Optional)</Text>
                          <TouchableOpacity 
                            style={[s.uploadBox, supportForm.additionalProof ? { borderColor: C.emerald600, backgroundColor: C.emerald50 } : {}]} 
                            onPress={handleProofPick}
                          >
                            <Camera size={20} color={supportForm.additionalProof ? C.emerald600 : C.gray400} />
                            <Text style={[s.uploadBoxTxt, supportForm.additionalProof ? { color: C.emerald600 } : {}]}>
                              {supportForm.additionalProof ? 'Photo Attached ✅' : 'Pick Image / Take Photo'}
                            </Text>
                          </TouchableOpacity>
                          {supportForm.additionalProof && (
                            <TouchableOpacity onPress={() => setSupportForm(p => ({ ...p, additionalProof: '' }))}>
                              <Text style={{ fontSize: 12, color: C.red600, textAlign: 'right' }}>Remove photo</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {contactError ? <Text style={s.inlineError}>{contactError}</Text> : null}

                      <TouchableOpacity style={[s.verifyNext, contactBusy && s.btnDisabled]} onPress={handleSubmitSupport} disabled={contactBusy}>
                        {contactBusy ? <ActivityIndicator color={C.white} /> : <Text style={s.verifyNextTxt}>Submit Request</Text>}
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => setRecoveryStep('options')} style={{ alignSelf: 'center', marginBottom: 20 }}>
                        <Text style={{ color: C.gray500, fontWeight: '600' }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                )}

                {recoveryStep === 'support_sent' && (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <View style={[s.successIcon, { backgroundColor: C.violet100 }]}><Mail size={40} color={C.violet600} /></View>
                    <Text style={[s.verifyChooseTitle, { marginTop: 16 }]}>Request Received</Text>
                    <Text style={[s.verifyChoiceSub, { textAlign: 'center', marginBottom: 20 }]}>Our team has received your recovery application. We will review your identity details and contact you at your new email address within 24 hours.</Text>
                    <TouchableOpacity style={s.verifyNext} onPress={() => setShowContactModal(false)}>
                      <Text style={s.verifyNextTxt}>Back to Profile</Text>
                    </TouchableOpacity>
                  </View>
                )}
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

  // Sub-views (connections / settings)
  subHdr: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 20 },
  subHdrTitle: { fontSize: 20, fontWeight: '700', color: C.white },
  subBody: { padding: 16, gap: 12, paddingBottom: 40 },

  // Connections
  connCount: { fontSize: 13, color: C.gray500 },
  connCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 2, borderColor: '#DDD6FE' },
  connAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  connAvatarTxt: { color: C.white, fontWeight: '700', fontSize: 16 },
  connInfo: { flex: 1, gap: 2 },
  connName: { fontWeight: '600', fontSize: 14 },
  connSkills: { fontSize: 12, color: C.gray500 },
  connSwaps: { fontSize: 11, color: C.violet600, fontWeight: '600' },
  connBtns: { flexDirection: 'row', gap: 6 },
  connActionBtn: { padding: 8, borderRadius: 10, backgroundColor: C.gray50 },

  // Settings
  settingsCard: { backgroundColor: C.white, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: C.gray100 },
  settingsSection: { fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 1 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsLabel: { flex: 1, fontSize: 14, color: C.gray700 },
  editIconBtn: { padding: 4 },
  phoneEditBtns: { flexDirection: 'row', gap: 4 },
  inlinePhoneInput: { flex: 1, fontSize: 14, color: C.gray900, borderBottomWidth: 1, borderBottomColor: C.violet600, paddingVertical: 2 },
  inlineFlow: { backgroundColor: C.gray50, borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: '#DDD6FE' },
  inlineFlowTitle: { fontSize: 14, fontWeight: '700', color: C.gray900 },
  inlineFlowSub: { fontSize: 12, color: C.gray500 },
  inlineInput: { backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, padding: 10, fontSize: 14, color: C.gray900 },
  inlineError: { fontSize: 12, color: C.red600 },
  inlineFlowBtns: { flexDirection: 'row', gap: 8 },
  inlineCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: C.gray100, alignItems: 'center' },
  inlineCancelTxt: { color: C.gray700, fontWeight: '600', fontSize: 13 },
  inlineSaveBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: C.violet600, alignItems: 'center' },
  inlineSaveTxt: { color: C.white, fontWeight: '600', fontSize: 13 },
  inlineSuccess: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  inlineSuccessTxt: { fontSize: 13, color: C.emerald600, fontWeight: '600' },
  formLabel: { fontSize: 13, fontWeight: '600', color: C.gray600, marginBottom: 2 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 14, color: C.gray700 },
  settingsAction: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.gray100 },
  settingsActionTxt: { fontSize: 15, color: C.gray800 },
  settingsActionDanger: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.red50, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#FEE2E2' },
  settingsActionDangerTxt: { fontSize: 15, color: C.red600 },

  // Banner
  banner: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 60 },
  bannerTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarTxt: { fontSize: 24, fontWeight: '700', color: C.violet600 },
  cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 22, fontWeight: '700', color: C.white },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  verifiedTxt: { fontSize: 10, fontWeight: '700', color: C.white },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingTxt: { fontSize: 13, color: C.white },
  settingsBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  bannerMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },

  // Stats
  statsCard: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 20, marginHorizontal: 16, marginTop: -32, padding: 16, borderWidth: 2, borderColor: '#DDD6FE', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, zIndex: 1 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: C.violet600 },
  statLbl: { fontSize: 12, color: C.gray500 },

  // Body
  body: { padding: 16, gap: 20, paddingBottom: 40 },
  btnDisabled: { opacity: 0.6 },

  // Connections button
  connBtn: { borderRadius: 16 },
  connBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  connBtnTitle: { color: C.white, fontWeight: '700', fontSize: 15 },
  connBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  // Verify banner
  verifyBanner: { backgroundColor: '#EDE9FE', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#DDD6FE', overflow: 'hidden' },
  verifyBannerContent: { gap: 6 },
  verifyBannerTitle: { fontSize: 16, fontWeight: '700', color: C.violet600 },
  verifyBannerSub: { fontSize: 13, color: C.violet500 },
  verifyBannerBtn: { backgroundColor: C.violet600, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  verifyBannerBtnTxt: { color: C.white, fontWeight: '700', fontSize: 13 },

  // About
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: C.gray900, marginBottom: 8 },
  aboutTxt: { fontSize: 14, color: C.gray600, lineHeight: 20 },
  editAbout: { gap: 6 },
  aboutInput: { backgroundColor: C.gray50, borderWidth: 1, borderColor: C.gray200, borderRadius: 12, padding: 12, fontSize: 14, color: C.gray900, minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: C.gray400, textAlign: 'right' },
  editAboutBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: C.gray100, alignItems: 'center' },
  cancelBtnTxt: { color: C.gray700, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: C.violet600, alignItems: 'center' },
  saveBtnTxt: { color: C.white, fontWeight: '600' },

  // Skills
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  offerPill: { backgroundColor: C.violet100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  offerPillTxt: { color: C.violet600, fontSize: 13, fontWeight: '500' },
  wantPill: { backgroundColor: C.violet50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  wantPillTxt: { color: C.violet600, fontSize: 13, fontWeight: '500' },

  // Reviews
  reviewCard: { backgroundColor: C.white, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: '#DDD6FE', marginBottom: 8 },
  reviewHdr: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarTxt: { color: C.white, fontWeight: '700', fontSize: 14 },
  reviewInfo: { flex: 1 },
  reviewUser: { fontWeight: '600', fontSize: 13 },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  reviewDate: { fontSize: 11, color: C.gray400 },
  reviewTxt: { fontSize: 13, color: C.gray600 },
  emptyTxt: { fontSize: 14, color: C.gray400, fontStyle: 'italic' },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.red50, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#FEE2E2', marginTop: 8 },
  logoutTxt: { color: C.red600, fontWeight: '600', fontSize: 15 },

  // Verify modal
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
