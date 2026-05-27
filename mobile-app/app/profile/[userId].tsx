import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, Image, ActivityIndicator,
  KeyboardAvoidingView, Platform, InteractionManager,
} from 'react-native';
import { useToast } from '../../components/modals/AppToast';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
  CheckCircle2, ShieldCheck, X, Camera, ChevronRight, Clock, Pencil, Mail, Phone, Edit, Edit2, ArrowLeft, Settings, Star, Award, LogOut, Trash2, Users, MessageCircle, UserMinus, MapPin
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { profileService } from '../../services/profileService';
import { postsService, Story } from '../../services/postsService';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { ConnectButton } from '../../components/profile/ConnectButton';
import { Toggle } from '../../components/Toggle';
import { validateLebanesePhone } from '../../utils/validation';
import { resolveUrl, getInitials } from '../../utils/helpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../components/theme';

const STORY_GRADIENTS: readonly [string, string][] = [
  ['#000000', '#000000'],
  ['#1a1a2e', '#16213e'],
  ['#7C3AED', '#8B5CF6'],
  ['#3B82F6', '#2DD4BF'],
  ['#F59E0B', '#EF4444'],
  ['#10B981', '#3B82F6'],
  ['#FF6B6B', '#FF8E53'],
];


function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ProfileScreen() {
  const { C, G, isDark, mode, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => createStyles(C), [C]);
  const router = useRouter();
  const { userId: userIdParam } = useLocalSearchParams<{ userId?: string }>();
  const { isLoggedIn, logout, user, token, verifyAge, verifyMinor } = useAuth();
  const {
    profile, loading, refresh,
    updateBio, updateContact, uploadPicture, deleteProfilePicture,
    applyForVolunteer, requestEmailChange, verifyCurrentEmail, confirmEmailChange,
    submitSupportRequest, deleteAccount
  } = useProfile(userIdParam);
  const { showToast } = useToast();

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
  const [verifyData, setVerifyData] = useState({ fullName: '', dob: '', gender: '' });
  const [parentEmail, setParentEmail] = useState('');
  const [minorGender, setMinorGender] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [volApp, setVolApp] = useState({ why: '', experience: '', skills: '' });
  const [verifyImages, setVerifyImages] = useState({ idFront: null as string | null, idBack: null as string | null, selfie: null as string | null });

  // ── Notification / privacy toggles ──────────────────────────────────────
  const [notif, setNotif] = useState({ swapRequests: true, messages: true, skillNews: false });
  const [privacy, setPrivacy] = useState({ publicProfile: true });
  
  // ── Stories on profile ────────────────────────────────────────────────────
  const [profileStories, setProfileStories] = useState<Story[]>([]);
  const [viewingProfileStory, setViewingProfileStory] = useState<number | null>(null);

  useEffect(() => {
    if (!userIdParam || !profile) return;
    const targetId = Number(userIdParam);
    if ((profile as any).publicProfile === false) { setProfileStories([]); return; }
    postsService.getUserStories(targetId, token).then(setProfileStories).catch(() => {});
  }, [profile?.id, (profile as any)?.publicProfile]);

  useEffect(() => {
    if (viewingProfileStory === null || !token) return;
    const story = profileStories[viewingProfileStory];
    if (story && !story.hasViewed) {
      postsService.viewStory(story.id, token).catch(() => {});
      setProfileStories(prev => prev.map(s => s.id === story.id ? { ...s, hasViewed: true } : s));
    }
  }, [viewingProfileStory]);

  // ── Add / Edit Skill ─────────────────────────────────────────────────────
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [addSkillType, setAddSkillType] = useState<'offer' | 'want'>('offer');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [isSavingSkill, setIsSavingSkill] = useState(false);
  const [skillEditMode, setSkillEditMode] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<number | null>(null);
  const SKILL_CATEGORIES = ['Tech', 'Cooking', 'Music', 'Languages', 'Art', 'Sports', 'Education', 'Business', 'Health', 'Other'];

  const handleAddSkill = async () => {
    if (!token || !newSkillName.trim()) return;
    setIsSavingSkill(true);
    try {
      const { skillsService } = await import('../../services/skillsService');
      if (addSkillType === 'offer') {
        await skillsService.addOfferedSkill({ skillName: newSkillName.trim(), category: newSkillCategory || undefined }, token);
      } else {
        await skillsService.addWantedSkill({ skillName: newSkillName.trim(), category: newSkillCategory || undefined }, token);
      }
      await refresh();
      setNewSkillName(''); setNewSkillCategory('');
      setShowAddSkillModal(false);
      showToast('Skill added!', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to add skill', 'error');
    } finally { setIsSavingSkill(false); }
  };

  const handleDeleteSkill = async (id: number) => {
    if (!token) return;
    setDeletingSkillId(id);
    try {
      const { skillsService } = await import('../../services/skillsService');
      await skillsService.deleteUserSkill(id, token);
      await refresh();
      setSkillEditMode(false);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to remove skill', 'error');
    } finally { setDeletingSkillId(null); }
  };

  // ── Delete Account Modal ──────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingBusy, setDeletingBusy] = useState(false);

  // ── Remove Connection Modal ───────────────────────────────────────────────
  const [showRemoveConnModal, setShowRemoveConnModal] = useState(false);
  const [targetConnId, setTargetConnId] = useState<number | null>(null);

  const myConnections = profile?.connections || [];

  // ── Sync inputs when profile loads ───────────────────────────────────────
  useEffect(() => { setBioInput(profile?.bio ?? ''); }, [profile?.bio]);
  useEffect(() => { setPhoneInput(profile?.phone ?? ''); }, [profile?.phone]);
  useEffect(() => {
    if (profile && isOwnProfile) {
      setPrivacy({ publicProfile: (profile as any).publicProfile ?? true });
      setNotif({
        swapRequests: (profile as any).swapNotifications ?? true,
        messages:     (profile as any).messageNotifications ?? true,
        skillNews:    false,
      });
    }
  }, [profile?.id]);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => { if (!isLoggedIn) router.replace('/auth'); }, [isLoggedIn]);
  if (!isLoggedIn) return null;


  const fmtRating = (r: number) => r > 0 ? r.toFixed(1) : '—';
  const fmtCount = (n: number) => n > 0 ? String(n) : '0';

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePickPicture = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.15, base64: true, exif: false });
    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      let b64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null;
      if (!b64) {
        try {
          const raw = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
          b64 = `data:image/jpeg;base64,${raw}`;
        } catch {
          showToast('Failed to read image', 'error');
          return;
        }
      }
      setShowPicOptions(false);
      InteractionManager.runAfterInteractions(() => {
        setPreviewImage(b64);
        setShowPreviewModal(true);
      });
    }
  };

  const handleConfirmPicture = async () => {
    if (!previewImage) return;
    setUploadingPic(true);
    try {
      await uploadPicture(previewImage);
      setShowPreviewModal(false);
      setPreviewImage(null);
    } catch (e: any) {
      showToast(e.message ?? 'Upload failed', 'error');
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
      showToast(e.message ?? 'Failed to save bio', 'error');
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
      showToast('Please allow access to your photo library', 'error');
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
      showToast('Please allow access to your photo library', 'error');
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



  const handleDeleteAccount = async () => {
    setDeletingBusy(true);
    try {
      await deleteAccount();
      showToast('Account deleted successfully', 'success');
      setShowDeleteModal(false);
      logout(); // logout() handles navigation to /auth internally
    } catch (e: any) {
      showToast(e.message ?? 'Failed to delete account', 'error');
    } finally {
      setDeletingBusy(false);
    }
  };

  const handleRemoveConnection = async (connId: number) => {
    if (!token) return;
    try {
      await profileService.removeConnection(connId, token);
      showToast('Connection removed', 'success');
      refresh(); // Refresh profile data to update connections list
    } catch (e: any) {
      showToast(e.message ?? 'Failed to remove connection', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render Logic
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.screen}>
      {view === 'connections' && (
        <>
          <LinearGradient colors={G.header} style={[s.subHdr, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => setView('main')}><ArrowLeft size={24} color={C.white} /></TouchableOpacity>
            <Text style={s.subHdrTitle}>My Connections</Text>
          </LinearGradient>
          <ScrollView>
            <View style={s.subBody}>
              <Text style={s.connCount}>{myConnections.length} connections</Text>
              {myConnections.map(c => (
                <View key={c.id} style={s.connCard}>
                  <TouchableOpacity style={s.connAvatar} onPress={() => router.push(`/profile/${c.otherUserId}`)}>
                    <Text style={s.connAvatarTxt}>{c.avatarInitials || '?'}</Text>
                  </TouchableOpacity>
                  <View style={s.connInfo}>
                    <TouchableOpacity onPress={() => router.push(`/profile/${c.otherUserId}`)}>
                      <Text style={s.connName}>{c.otherUserName}</Text>
                    </TouchableOpacity>
                    <Text style={s.connSkills}>{c.skills?.join(', ') || 'No skills listed'}</Text>
                    <Text style={s.connSwaps}>0 swaps together</Text>
                  </View>
                  <View style={s.connBtns}>
                    <TouchableOpacity style={s.connActionBtn} onPress={() => { setView('main'); router.push({ pathname: '/chat', params: { openUserId: c.otherUserId } }); }}>
                      <MessageCircle size={18} color={C.violet600} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.connActionBtn} onPress={() => { setTargetConnId(c.id); setShowRemoveConnModal(true); }}>
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
          <LinearGradient colors={G.header} style={[s.subHdr, { paddingTop: insets.top + 12 }]}>
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

              {/* ── Appearance ── */}
              <View style={s.settingsCard}>
                <Text style={s.settingsSection}>APPEARANCE</Text>
                <View style={s.toggleRow}>
                  <Text style={s.toggleLabel}>Dark Mode</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {(['light', 'system', 'dark'] as const).map(m => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setTheme(m)}
                        style={{
                          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                          backgroundColor: mode === m ? C.violet600 : C.gray200,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: mode === m ? '#fff' : C.gray600, textTransform: 'capitalize' }}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* ── Notifications ── */}
              <View style={s.settingsCard}>
                <Text style={s.settingsSection}>NOTIFICATIONS</Text>
                <View style={s.toggleRow}>
                  <Text style={s.toggleLabel}>Swap Requests</Text>
                  <Toggle checked={notif.swapRequests} onChange={v => {
                    setNotif(p => ({ ...p, swapRequests: v }));
                    if (token) profileService.updatePrivacy({ publicProfile: privacy.publicProfile, swapNotifications: v, messageNotifications: notif.messages, skillNewsNotifications: notif.skillNews }, token).catch(() => {});
                  }} />
                </View>
                <View style={s.toggleRow}>
                  <Text style={s.toggleLabel}>Messages</Text>
                  <Toggle checked={notif.messages} onChange={v => {
                    setNotif(p => ({ ...p, messages: v }));
                    if (token) profileService.updatePrivacy({ publicProfile: privacy.publicProfile, swapNotifications: notif.swapRequests, messageNotifications: v, skillNewsNotifications: notif.skillNews }, token).catch(() => {});
                  }} />
                </View>
                <TouchableOpacity
                  style={[s.toggleRow, { opacity: 0.45 }]}
                  onPress={() => showToast('Skill News is coming soon!', 'info')}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Skill News</Text>
                    <Text style={{ fontSize: 11, color: C.gray400, marginTop: 1 }}>Coming soon</Text>
                  </View>
                  <Toggle checked={false} onChange={() => showToast('Skill News is coming soon!', 'info')} />
                </TouchableOpacity>
              </View>

              {/* ── Privacy ── */}
              <View style={s.settingsCard}>
                <Text style={s.settingsSection}>PRIVACY</Text>
                <View style={s.toggleRow}>
                  <Text style={s.toggleLabel}>Public profile</Text>
                  <Toggle
                    checked={privacy.publicProfile}
                    onChange={v => {
                      setPrivacy({ publicProfile: v });
                      if (token) profileService.updatePrivacy({ publicProfile: v, swapNotifications: notif.swapRequests, messageNotifications: notif.messages, skillNewsNotifications: notif.skillNews }, token).catch(() => {});
                    }}
                  />
                </View>
              </View>

              <TouchableOpacity style={s.settingsAction} onPress={() => logout()}>
                <LogOut size={18} color={C.violet600} />
                <Text style={s.settingsActionTxt}>Logout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.settingsActionDanger} onPress={() => setShowDeleteModal(true)}>
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
        <LinearGradient colors={['#3B0764', '#6D28D9', '#8B5CF6']} style={[s.banner, { paddingTop: insets.top + 16 }]}>

          {/* Nav row */}
          <View style={s.bannerNav}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.navBtn}>
              <ArrowLeft size={20} color={C.white} />
            </TouchableOpacity>
            {isOwnProfile && (
              <TouchableOpacity onPress={() => setView('settings')} style={s.navBtn}>
                <Settings size={20} color={C.white} />
              </TouchableOpacity>
            )}
          </View>

          {/* Centered profile content */}
          <View style={s.bannerCenter}>

            {/* Avatar */}
            {(() => {
              const hasStories = !isOwnProfile && (profile as any)?.publicProfile && profileStories.length > 0;
              // avatarPic: just the circle image/initials (no camera, no overflow issues)
              const avatarPic = (
                <View style={s.avatarWrap}>
                  {profile?.profilePicture ? (
                    <Image source={{ uri: profile.profilePicture }} style={s.avatarImg} resizeMode="cover" />
                  ) : (
                    <Text style={s.avatarTxt}>{getInitials(profile?.name || user?.name)}</Text>
                  )}
                </View>
              );

              // Wrap with camera badge outside the clipping circle
              const avatarWithCam = isOwnProfile ? (
                <View style={{ position: 'relative' }}>
                  {avatarPic}
                  <View style={s.camOverlay}>
                    {uploadingPic
                      ? <ActivityIndicator size="small" color={C.white} />
                      : <Camera size={13} color={C.white} />}
                  </View>
                </View>
              ) : avatarPic;

              if (hasStories) {
                return (
                  <TouchableOpacity onPress={() => setViewingProfileStory(0)} activeOpacity={0.85}>
                    <LinearGradient
                      colors={['#f09433','#e6683c','#dc2743','#cc2366','#bc1888']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ width: 108, height: 108, borderRadius: 54, padding: 3, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <View style={{ width: 102, height: 102, borderRadius: 51, overflow: 'hidden' }}>
                        {avatarPic}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }
              return isOwnProfile ? (
                <TouchableOpacity onPress={() => setShowPicOptions(true)} activeOpacity={0.85} disabled={uploadingPic}>
                  {avatarWithCam}
                </TouchableOpacity>
              ) : avatarPic;
            })()}

            {/* Name */}
            <Text style={s.profileName}>{profile?.name || user?.name || '—'}</Text>

            {/* Location */}
            {profile?.location && (
              <View style={s.locationRow}>
                <MapPin size={13} color="rgba(255,255,255,0.75)" />
                <Text style={s.locationTxt}>{profile.location}</Text>
              </View>
            )}

            {/* Badges */}
            {(profile?.isAgeVerified || profile?.isMinorVerified || profile?.isVolunteer) && (
              <View style={s.badgesRow}>
                {profile?.isAgeVerified && (
                  <View style={s.badge}><CheckCircle2 size={11} color={C.white} /><Text style={s.badgeTxt}>Verified 16+</Text></View>
                )}
                {!profile?.isAgeVerified && profile?.isMinorVerified && (
                  <View style={s.badge}><CheckCircle2 size={11} color={C.white} /><Text style={s.badgeTxt}>Minor Verified</Text></View>
                )}
                {profile?.isVolunteer && (
                  <View style={[s.badge, s.badgeVolunteer]}><Award size={11} color={C.white} /><Text style={s.badgeTxt}>Volunteer</Text></View>
                )}
              </View>
            )}

            {/* Rating */}
            <View style={s.ratingRow}>
              <Star size={13} color={C.yellow400} fill={C.yellow400} />
              <Text style={s.ratingTxt}>
                {profile ? `${fmtRating(profile.avgRating)} (${fmtCount(profile.reviewCount)} reviews)` : '—'}
              </Text>
            </View>

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
            ].map(({ val, lbl }, i) => (
              <React.Fragment key={lbl}>
                {i > 0 && <View style={{ width: 1, backgroundColor: C.violet200, alignSelf: 'stretch', marginVertical: 4 }} />}
                <View style={s.statItem}>
                  <Text style={s.statVal}>{val}</Text>
                  <Text style={s.statLbl}>{lbl}</Text>
                </View>
              </React.Fragment>
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

          {/* ── Connect button (other user's profile) ── */}
          {!isOwnProfile && isLoggedIn && profile && (
            <ConnectButton
              connectionStatus={profile.connectionStatus}
              connectionId={profile.connectionId}
              targetUserId={profile.id}
              onStatusChange={refresh}
            />
          )}

          {/* ── Verification banner ── */}
          {isOwnProfile && ((!profile?.isAgeVerified && !profile?.isMinorVerified) || !profile?.isVolunteer) && (
            <View style={[s.verifyBanner, profile?.ageVerificationStatus?.startsWith('PENDING') && { backgroundColor: C.violet50, borderColor: C.violet200 }]}>
              <View style={s.verifyBannerContent}>
                <Text style={[s.verifyBannerTitle, profile?.ageVerificationStatus?.startsWith('PENDING') && { color: C.violet600 }]}>
                  {profile?.ageVerificationStatus?.startsWith('PENDING') ? 'Verification Pending' : 'Verify Your Account'}
                </Text>
                <Text style={[s.verifyBannerSub, profile?.ageVerificationStatus?.startsWith('PENDING') && { color: C.violet500 }]}>
                  {profile?.ageVerificationStatus?.startsWith('PENDING') 
                    ? 'Our team is reviewing your documents. Please check back later.' 
                    : 'Get a badge and unlock full features.'}
                </Text>
                {(!profile?.ageVerificationStatus?.startsWith('PENDING') || (!profile?.isVolunteer && profile?.volunteerStatus !== 'PENDING' && (profile?.isAgeVerified || profile?.isMinorVerified))) && (
                  <TouchableOpacity
                    style={s.verifyBannerBtn}
                    onPress={() => { setVerifyStep(0); setVerifyType(null); setShowVerifyModal(true); }}
                  >
                    <Text style={s.verifyBannerBtnTxt}>Start Verification</Text>
                  </TouchableOpacity>
                )}
              </View>
              {profile?.ageVerificationStatus?.startsWith('PENDING') ? (
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
            { title: 'Skills I Offer', type: 'offer' as const, skills: profile?.offeredSkills ?? [], pill: s.offerPill, txt: s.offerPillTxt },
            { title: 'Skills I Want',  type: 'want'  as const, skills: profile?.wantedSkills  ?? [], pill: s.wantPill,  txt: s.wantPillTxt  },
          ].map(({ title, type, skills, pill, txt }) => (
            <View key={title}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={s.sectionTitle}>{title}</Text>
                {isOwnProfile && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {skills.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSkillEditMode(v => !v)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: skillEditMode ? C.red50 : C.gray100, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: skillEditMode ? C.red600 : C.gray500 }}>
                          {skillEditMode ? 'Done' : 'Edit'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {!skillEditMode && (
                      <TouchableOpacity
                        onPress={() => { setAddSkillType(type); setShowAddSkillModal(true); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.violet50, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 }}
                      >
                        <Text style={{ fontSize: 16, color: C.violet600, fontWeight: '700' }}>+</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: C.violet600 }}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
              {skills.length > 0 ? (
                <View style={s.pillsRow}>
                  {skills.map(sk => (
                    <View key={sk.id} style={[pill, skillEditMode && s.pillEditing]}>
                      <Text style={txt}>{sk.name}</Text>
                      {skillEditMode && (
                        <TouchableOpacity
                          onPress={() => handleDeleteSkill(sk.id)}
                          disabled={deletingSkillId === sk.id}
                          style={s.pillDeleteBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          {deletingSkillId === sk.id
                            ? <ActivityIndicator size={10} color={C.red600} />
                            : <X size={12} color={C.red600} />
                          }
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={s.emptyTxt}>{isOwnProfile ? 'None yet — tap + Add to get started.' : 'None added yet.'}</Text>
              )}
            </View>
          ))}

          {/* ── Reviews (hidden for private profiles when viewing others) ── */}
          {(isOwnProfile || (profile as any)?.publicProfile !== false) && (
          <View style={{ marginBottom: 40 }}>
            <Text style={s.sectionTitle}>Reviews</Text>
            {loading && !profile ? (
              <ActivityIndicator color={C.violet600} />
            ) : profile?.reviews?.length ? (
              <View style={{ maxHeight: 210, overflow: 'hidden' }}>
                <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingRight: 4 }}>
                  {profile.reviews.map(r => (
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
                  ))}
                </ScrollView>
              </View>
            ) : (
              <Text style={s.emptyTxt}>No reviews yet.</Text>
            )}
          </View>
          )}

          {/* ── Logout ── */}
          {isOwnProfile && (
            <TouchableOpacity style={s.logoutBtn} onPress={() => logout()}>
              <LogOut size={18} color={C.red600} />
              <Text style={s.logoutTxt}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    )}

      {/* ── Verification Modal ── */}
      <Modal visible={showVerifyModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[s.verifySheet, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
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
                  { type: 'adult'     as const, title: 'Adult Verification',     sub: '16 years or older',               Icon: ShieldCheck, hide: profile?.isAgeVerified || profile?.isMinorVerified, pending: profile?.ageVerificationStatus?.startsWith('PENDING'), locked: false },
                  { type: 'minor'     as const, title: 'Minor Verification',     sub: 'Under 16 — parental approval',     Icon: Users, hide: profile?.isAgeVerified || profile?.isMinorVerified, pending: profile?.ageVerificationStatus?.startsWith('PENDING'), locked: false },
                  { 
                    type: 'volunteer' as const, 
                    title: 'Volunteer Verification', 
                    sub: 'Apply to join our volunteer team', 
                    Icon: Award, 
                    hide: !!profile?.isVolunteer, 
                    pending: profile?.volunteerStatus === 'PENDING',
                    locked: !profile?.isAgeVerified && !profile?.isMinorVerified
                  },
                ] as const).filter(opt => !opt.hide).map(({ type, title, sub, Icon, pending, locked }) => (
                  <TouchableOpacity 
                    key={type} 
                    style={[s.verifyChoice, (pending || locked) && { opacity: 0.5, backgroundColor: C.gray50 }]} 
                    disabled={pending || locked}
                    onPress={() => { 
                      if (locked) {
                        showToast('You must complete Adult or Minor Verification first.', 'info');
                        return;
                      }
                      setVerifyType(type); setVerifyStep(1); 
                    }}
                  >
                    <View style={[s.verifyChoiceIcon, (pending || locked) && { backgroundColor: C.gray200 }]}><Icon size={24} color={(pending || locked) ? C.gray400 : C.violet600} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.verifyChoiceTitle, (pending || locked) && { color: C.gray500 }]}>{title}</Text>
                      <Text style={s.verifyChoiceSub}>
                        {locked ? 'Requires Identity Verification' : pending ? 'Pending Review...' : sub}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {verifyType === 'adult' && verifyStep === 1 && (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[s.verifyContent, { paddingBottom: 8 }]}>
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
                <Text style={s.verifyGenderLabel}>Gender</Text>
                <View style={s.verifyGenderRow}>
                  {([
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
                  ] as const).map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[s.verifyGenderBtn, verifyData.gender === opt.value && s.verifyGenderBtnActive]}
                      onPress={() => setVerifyData({ ...verifyData, gender: opt.value })}
                    >
                      <Text style={[s.verifyGenderTxt, verifyData.gender === opt.value && s.verifyGenderTxtActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.verifyBtns}>
                  <TouchableOpacity style={s.verifyBack} onPress={() => setVerifyStep(0)}><Text style={s.verifyBackTxt}>Back</Text></TouchableOpacity>
                  <TouchableOpacity
                    style={[s.verifyNext, (!verifyData.fullName || verifyData.dob.length < 10 || !verifyData.gender) && s.verifyNextDisabled]}
                    onPress={() => setVerifyStep(2)}
                    disabled={!verifyData.fullName || verifyData.dob.length < 10 || !verifyData.gender}
                  >
                    <Text style={s.verifyNextTxt}>Next Step</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
                {profile?.ageVerificationStatus?.startsWith('PENDING') ? (
                  <>
                    <View style={[s.successIcon, { backgroundColor: C.violet100 }]}><Clock size={40} color={C.violet500} /></View>
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
                   style={[s.verifyNext, { flex: 0, width: '100%' }, (!verifyImages.idFront || !verifyImages.selfie || isVerifying) && s.verifyNextDisabled]}
                   disabled={!verifyImages.idFront || !verifyImages.selfie || isVerifying}
                   onPress={async () => {
                     // If we are already pending, just close the modal
                     if (profile?.ageVerificationStatus?.startsWith('PENDING')) {
                       setShowVerifyModal(false);
                       return;
                     }

                     setIsVerifying(true);
                     try {
                       const ok = await verifyAge({
                         fullName: verifyData.fullName,
                         dob: verifyData.dob,
                         gender: verifyData.gender || undefined,
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
                          showToast('Submission Failed. Please check your images.', 'error');
                        }
                      } catch (e) {
                        showToast('Submission Error. Could not connect to the server.', 'error');
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
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[s.verifyContent, { paddingBottom: 8 }]}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                  {[1, 2].map(sNum => (
                    <View key={sNum} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: sNum <= verifyStep ? C.violet600 : C.gray100 }} />
                  ))}
                </View>
                <Text style={s.verifyChooseTitle}>Step 1: Parental Approval</Text>
                <Text style={s.verifyGenderLabel}>Gender</Text>
                <View style={s.verifyGenderRow}>
                  {([
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
                  ] as const).map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[s.verifyGenderBtn, minorGender === opt.value && s.verifyGenderBtnActive]}
                      onPress={() => setMinorGender(opt.value)}
                    >
                      <Text style={[s.verifyGenderTxt, minorGender === opt.value && s.verifyGenderTxtActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={[s.verifyInput, { marginTop: 8 }]} placeholder="Parent/Guardian Email" value={parentEmail} onChangeText={setParentEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={C.gray400} />
                <View style={s.verifyBtns}>
                  <TouchableOpacity style={s.verifyBack} onPress={() => setVerifyStep(0)}><Text style={s.verifyBackTxt}>Back</Text></TouchableOpacity>
                  <TouchableOpacity
                    style={[s.verifyNext, (!parentEmail.includes('@') || !minorGender || isVerifying) && s.verifyNextDisabled]}
                    disabled={!parentEmail.includes('@') || !minorGender || isVerifying}
                    onPress={async () => {
                      if (profile?.ageVerificationStatus?.startsWith('PENDING')) {
                         showToast('You already have a minor verification pending.', 'info');
                         return;
                      }
                      setIsVerifying(true);
                      const ok = await verifyMinor(parentEmail, minorGender);
                      setIsVerifying(false);
                      if (ok) {
                         setVerifyStep(2);
                      } else {
                         showToast('Failed to send request. You may already have a pending review.', 'error');
                      }
                    }}
                  >
                    <Text style={s.verifyNextTxt}>{isVerifying ? 'Sending...' : 'Send Approval'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {verifyType === 'minor' && verifyStep === 2 && (
              <View style={[s.verifyContent, { alignItems: 'center' }]}>
                <View style={s.successIcon}><CheckCircle2 size={40} color={C.emerald600} /></View>
                <Text style={s.verifyChooseTitle}>Approval Email Sent!</Text>
                <Text style={[s.verifyChoiceSub, { textAlign: 'center' }]}>
                  An approval link has been sent to{'\n'}<Text style={{ fontWeight: '700', color: C.violet600 }}>{parentEmail}</Text>.{'\n\n'}Your account will be fully activated once your parent approves.
                </Text>
                <TouchableOpacity style={[s.verifyNext, { flex: 0, width: '100%' }]} onPress={() => {
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
                          <View style={[s.successIcon, { backgroundColor: '#FEF3C7', marginBottom: 12 }]}><Award size={36} color={C.violet500} /></View>
                          <Text style={[s.verifyChoiceTitle, { textAlign: 'center', color: '#D97706' }]}>Application Pending</Text>
                          <Text style={{ textAlign: 'center', color: C.gray500, marginTop: 8, fontSize: 13, lineHeight: 18 }}>We are currently reviewing your application. You will be notified once approved.</Text>
                        </>
                      )}
                      {profile?.volunteerStatus === 'APPROVED' && (
                        <>
                          <View style={[s.successIcon, { backgroundColor: C.violet100, marginBottom: 12 }]}><CheckCircle2 size={36} color={C.emerald600} /></View>
                          <Text style={[s.verifyChoiceTitle, { textAlign: 'center', color: C.emerald600 }]}>Volunteer Approved!</Text>
                          <Text style={{ textAlign: 'center', color: C.gray500, marginTop: 8, fontSize: 13, lineHeight: 18 }}>Thank you for your service to the community.</Text>
                        </>
                      )}
                      {profile?.volunteerStatus === 'REJECTED' && (
                        <>
                          <View style={[s.successIcon, { backgroundColor: C.violet100, marginBottom: 12 }]}><X size={36} color={C.red600} /></View>
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
                            showToast('Please fill in all application fields', 'error');
                            return;
                          }
                          setApplyingVolunteer(true);
                          try {
                            await applyForVolunteer(volApp.why, volApp.experience, volApp.skills);
                            setVerifyStep(2);
                          } catch (e: any) {
                            showToast(e.message ?? 'Submission error', 'error');
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
                <TouchableOpacity style={[s.verifyNext, { flex: 0, width: '100%' }]} onPress={() => {
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
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Picture Options Modal ── */}
      <Modal visible={showPicOptions} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.verifySheet, { paddingBottom: Math.max(insets.bottom + 16, 30), paddingHorizontal: 20 }]}>
            <View style={[s.verifyModalHdr, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View />
              <Text style={s.verifyModalTitle}>Profile Picture</Text>
              <TouchableOpacity onPress={() => setShowPicOptions(false)}>
                <X size={22} color={C.gray500} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 12, marginTop: 10 }}>
              <TouchableOpacity style={[s.verifyNext, { flex: 0 }]} onPress={handlePickPicture}>
                <Text style={s.verifyNextTxt}>Upload New Image</Text>
              </TouchableOpacity>
              {profile?.profilePicture && (
                <TouchableOpacity style={[s.verifyNext, { flex: 0, backgroundColor: C.violet100 }]} onPress={async () => {
                  setShowPicOptions(false);
                  try { await deleteProfilePicture(); showToast('Picture removed', 'success'); } catch(e:any) { showToast(e.message, 'error'); }
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
          <View style={[s.verifySheet, { alignItems: 'center', padding: 24, paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 20, color: C.gray900 }}>Confirm Profile Picture</Text>
            {previewImage && <Image source={{ uri: previewImage }} style={{ width: 140, height: 140, borderRadius: 70, marginBottom: 24, borderWidth: 2, borderColor: C.violet300 }} resizeMode="cover" />}
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalOverlay}>
          <View style={[s.verifySheet, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
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
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.verifyContent}>
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
                    placeholder="+961 XX XXX XXX"
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
                  {contactBusy ? <ActivityIndicator color={C.white} /> : <Text style={s.verifyNextTxt}>Save Changes</Text>}
                </TouchableOpacity>
              </ScrollView>
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
                      onPress={() => showToast('SMS verification coming soon!', 'info')}
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
                        placeholder="+961 XX XXX XXX"
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
                    <TouchableOpacity style={s.verifyNext} onPress={() => { showToast('Recovery successful (UI Demo)', 'success'); setShowContactModal(false); }}>
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
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Confirm Delete Account Modal ── */}
      <ConfirmModal
        isVisible={showDeleteModal}
        title="Delete Account"
        message="Are you completely sure you want to delete your account? This action is permanent and all your swaps, sessions, and messages will be permanently lost."
        confirmText="Delete My Account"
        cancelText="Cancel"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        destructive={true}
        requireConfirmationText="DELETE"
      />

      {/* ── Confirm Remove Connection Modal ── */}
      <ConfirmModal
        isVisible={showRemoveConnModal}
        title="Remove Connection"
        message="Are you sure you want to remove this connection? You will no longer see their updates in your following feed."
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={async () => {
          if (targetConnId) await handleRemoveConnection(targetConnId);
          setShowRemoveConnModal(false);
          setTargetConnId(null);
        }}
        onCancel={() => {
          setShowRemoveConnModal(false);
          setTargetConnId(null);
        }}
        destructive={true}
      />

      {/* ── Add Skill Modal ── */}
      <Modal visible={showAddSkillModal} transparent animationType="slide" onRequestClose={() => setShowAddSkillModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: C.gray900 }}>
                  {addSkillType === 'offer' ? 'Add Skill I Offer' : 'Add Skill I Want'}
                </Text>
                <TouchableOpacity onPress={() => setShowAddSkillModal(false)}>
                  <X size={22} color={C.gray500} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 1 }}>SKILL NAME *</Text>
                <TextInput
                  style={{ backgroundColor: C.gray50, borderRadius: 12, padding: 12, fontSize: 15, color: C.gray900, borderWidth: 1, borderColor: C.gray200 }}
                  placeholder="e.g. Graphic Design"
                  placeholderTextColor={C.gray400}
                  value={newSkillName}
                  onChangeText={setNewSkillName}
                  autoFocus
                />
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 1 }}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {SKILL_CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setNewSkillCategory(cat)}
                        style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: newSkillCategory === cat ? C.violet600 : C.gray100, borderWidth: 1, borderColor: newSkillCategory === cat ? C.violet600 : C.gray200 }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '500', color: newSkillCategory === cat ? '#FFFFFF' : C.gray600 }}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <TouchableOpacity
                onPress={handleAddSkill}
                disabled={isSavingSkill || !newSkillName.trim()}
                style={{ backgroundColor: C.violet600, borderRadius: 14, paddingVertical: 14, alignItems: 'center', opacity: (!newSkillName.trim() || isSavingSkill) ? 0.5 : 1 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>{isSavingSkill ? 'Saving…' : 'Save Skill'}</Text>
              </TouchableOpacity>
              <View style={{ height: 8 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Profile Story Viewer ── */}
      <Modal visible={viewingProfileStory !== null} transparent animationType="fade" onRequestClose={() => setViewingProfileStory(null)}>
        {viewingProfileStory !== null && profileStories[viewingProfileStory] && (() => {
          const story = profileStories[viewingProfileStory];
          return (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              {story.mediaUrl
                ? <Image source={{ uri: resolveUrl(story.mediaUrl)! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                : <LinearGradient colors={STORY_GRADIENTS[story.bgIndex ?? 0]} style={StyleSheet.absoluteFill} />
              }
              {/* Progress bars */}
              <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingTop: 52, paddingBottom: 8 }}>
                {profileStories.map((_, i) => (
                  <View key={i} style={{ flex: 1, height: 2, borderRadius: 2, backgroundColor: i === viewingProfileStory ? '#fff' : 'rgba(255,255,255,0.35)' }} />
                ))}
              </View>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.violet500, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {story.userPicture
                    ? <Image source={{ uri: resolveUrl(story.userPicture)! }} style={{ width: '100%', height: '100%' }} />
                    : <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>{story.userInitials}</Text>
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.white, fontWeight: '700', fontSize: 14 }}>{story.userName}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{relativeTime(story.createdAt)}</Text>
                </View>
                <TouchableOpacity onPress={() => setViewingProfileStory(null)} style={{ padding: 8 }}>
                  <X size={24} color={C.white} />
                </TouchableOpacity>
              </View>
              {/* Content */}
              {story.textContent ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                  <Text style={{ color: C.white, fontSize: 22, fontWeight: '700', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
                    {story.textContent}
                  </Text>
                </View>
              ) : <View style={{ flex: 1 }} />}
              {/* Navigation zones */}
              <View style={{ ...StyleSheet.absoluteFillObject, flexDirection: 'row', top: 100 }}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => viewingProfileStory > 0 ? setViewingProfileStory(viewingProfileStory - 1) : setViewingProfileStory(null)}
                />
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => viewingProfileStory < profileStories.length - 1 ? setViewingProfileStory(viewingProfileStory + 1) : setViewingProfileStory(null)}
                />
              </View>
            </View>
          );
        })()}
      </Modal>
    </View>
  );
}

function createStyles(C: ThemeColors) { return StyleSheet.create({
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
  settingsActionDanger: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.red50, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: C.violet200 },
  settingsActionDangerTxt: { fontSize: 15, color: C.red600 },

  // Banner
  banner: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 52 },
  bannerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  bannerCenter: { alignItems: 'center', gap: 10 },
  avatarWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarTxt: { fontSize: 34, fontWeight: '800', color: C.violet600 },
  camOverlay: { position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: C.white },
  profileName: { fontSize: 26, fontWeight: '800', color: C.white, letterSpacing: 0.3, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -4 },
  locationTxt: { fontSize: 13, color: 'rgba(255,255,255,0.78)', fontWeight: '500' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  badgeVolunteer: { backgroundColor: 'rgba(255,255,255,0.12)' },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: C.white },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingTxt: { fontSize: 13, color: 'rgba(255,255,255,0.88)', fontWeight: '500' },

  // Stats
  statsCard: { flexDirection: 'row', backgroundColor: C.gray100, borderRadius: 24, marginHorizontal: 20, marginTop: -28, padding: 18, borderWidth: 1.5, borderColor: C.violet200, elevation: 6, shadowColor: C.violet600, shadowOpacity: 0.15, shadowRadius: 12, zIndex: 1 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 24, fontWeight: '800', color: C.violet600 },
  statLbl: { fontSize: 11, fontWeight: '600', color: C.gray400, letterSpacing: 0.5, textTransform: 'uppercase' as any },

  // Body
  body: { padding: 16, gap: 20, paddingBottom: 40 },
  btnDisabled: { opacity: 0.6 },

  // Connections button
  connBtn: { borderRadius: 16 },
  connBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  connBtnTitle: { color: C.white, fontWeight: '700', fontSize: 15 },
  connBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  // Verify banner
  verifyBanner: { backgroundColor: C.violet100, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: C.violet200, overflow: 'hidden' },
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
  offerPill: { backgroundColor: C.violet100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  offerPillTxt: { color: C.violet600, fontSize: 13, fontWeight: '500' },
  wantPill: { backgroundColor: C.violet50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#DDD6FE', flexDirection: 'row', alignItems: 'center', gap: 6 },
  wantPillTxt: { color: C.violet600, fontSize: 13, fontWeight: '500' },
  pillEditing: { borderWidth: 1, borderColor: C.red600 },
  pillDeleteBtn: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.red50, alignItems: 'center', justifyContent: 'center' },

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
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.red50, borderRadius: 14, padding: 16, borderWidth: 2, borderColor: C.violet200, marginTop: 8 },
  logoutTxt: { color: C.red600, fontWeight: '600', fontSize: 15 },

  // Verify modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  verifySheet: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 20, maxHeight: '90%' },
  verifyModalHdr: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  verifyStepBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
  verifyStepTxt: { fontSize: 12, fontWeight: '700', color: C.violet600 },
  verifyModalTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.gray900 },
  verifyContent: { gap: 14 },
  verifyChooseTitle: { fontSize: 18, fontWeight: '700', color: C.gray900 },
  verifyChoice: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: 2, borderColor: C.violet100 },
  verifyChoiceIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
  verifyChoiceTitle: { fontWeight: '700', fontSize: 15, color: C.gray900 },
  verifyChoiceSub: { fontSize: 12, color: C.gray500, marginTop: 2 },
  verifyInput: { backgroundColor: C.gray50, borderRadius: 14, padding: 14, fontSize: 14, color: C.gray900, borderWidth: 1, borderColor: C.gray100 },
  verifyBtns: { flexDirection: 'row', gap: 10 },
  verifyBack: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.gray100, alignItems: 'center' },
  verifyBackTxt: { fontWeight: '700', color: C.gray700 },
  verifyNext: { flex: 2, minHeight: 52, paddingVertical: 14, borderRadius: 14, backgroundColor: C.violet600, alignItems: 'center', justifyContent: 'center' },
  verifyNextDisabled: { opacity: 0.5 },
  verifyNextTxt: { fontWeight: '700', color: '#ffffff' },
  verifyGenderLabel: { fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  verifyGenderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  verifyGenderBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.gray200, backgroundColor: C.gray50 },
  verifyGenderBtnActive: { borderColor: C.violet600, backgroundColor: C.violet50 },
  verifyGenderTxt: { fontSize: 13, fontWeight: '600', color: C.gray600 },
  verifyGenderTxtActive: { color: C.violet600 },
  uploadBox: { height: 100, borderRadius: 16, borderWidth: 2, borderColor: C.gray200, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gray50 },
  uploadBoxTxt: { fontSize: 14, color: C.gray400 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center' },
}); }
