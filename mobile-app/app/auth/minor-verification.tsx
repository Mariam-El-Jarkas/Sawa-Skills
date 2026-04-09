import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { C } from '../../components/theme';

export default function MinorVerificationScreen() {
  const router = useRouter();
  const { verifyMinor, isLoggedIn } = useAuth();
  const [parentEmail, setParentEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!parentEmail || !parentEmail.includes('@')) {
      setError('Please enter a valid parent email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ok = await verifyMinor(parentEmail);
      if (ok) {
        setSubmitted(true);
      } else {
        setError('Failed to send approval request. Make sure you are logged in.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={C.gray700} />
        </TouchableOpacity>
        <View style={s.header}>
          <Text style={s.logoText}>Sawa Skills</Text>
        </View>
        <View style={s.card}>
          <View style={s.successSection}>
            <Text style={s.successIcon}>✉️</Text>
            <Text style={s.successTitle}>Request Sent!</Text>
            <Text style={s.successBody}>
              An approval email has been sent to{'\n'}
              <Text style={s.highlight}>{parentEmail}</Text>
            </Text>
            <Text style={s.successNote}>
              Your account will become fully active once your parent approves the request. The link expires in 24 hours.
            </Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.back()}>
              <Text style={s.primaryBtnTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={24} color={C.gray700} />
      </TouchableOpacity>

      <View style={s.header}>
        <Text style={s.logoText}>Sawa Skills</Text>
        <Text style={s.tagline}>Parent Approval Required</Text>
      </View>

      <View style={s.card}>
        <View style={s.form}>
          <Text style={s.sectionNote}>
            Because you are a minor, a parent or guardian must approve your account before you can access all features.
          </Text>

          <View style={s.inputWrap}>
            <Mail size={18} color={C.gray400} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Parent's Email Address"
              value={parentEmail}
              onChangeText={setParentEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={C.gray400}
            />
          </View>

          {!!error && <Text style={s.errorTxt}>{error}</Text>}

          <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading || !isLoggedIn}>
            {loading
              ? <ActivityIndicator color={C.white} />
              : <Text style={s.primaryBtnTxt}>Send Approval Request</Text>
            }
          </TouchableOpacity>

          {!isLoggedIn && (
            <Text style={s.warningTxt}>You must be logged in to request parent approval.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.gray50 },
  content: { padding: 20, paddingBottom: 40 },
  backBtn: { padding: 8, marginBottom: 16, alignSelf: 'flex-start', backgroundColor: C.white, borderRadius: 12 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoText: { fontSize: 36, fontWeight: '700', color: C.violet600, marginBottom: 8 },
  tagline: { fontSize: 15, color: C.gray500 },
  card: { backgroundColor: C.white, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  form: { gap: 16 },
  sectionNote: { fontSize: 14, color: C.gray500, lineHeight: 20, textAlign: 'center' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.gray200, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.white, gap: 10 },
  inputIcon: {},
  input: { flex: 1, fontSize: 15, color: C.gray900 },
  errorTxt: { color: C.red600, fontSize: 13, textAlign: 'center' },
  warningTxt: { color: C.red600, fontSize: 13, textAlign: 'center' },
  primaryBtn: { backgroundColor: C.violet600, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtnTxt: { color: C.white, fontWeight: '700', fontSize: 16 },
  successSection: { alignItems: 'center', gap: 16 },
  successIcon: { fontSize: 52 },
  successTitle: { fontSize: 24, fontWeight: '700', color: C.gray900 },
  successBody: { fontSize: 15, color: C.gray500, textAlign: 'center', lineHeight: 22 },
  highlight: { color: C.violet600, fontWeight: '600' },
  successNote: { fontSize: 13, color: C.gray400, textAlign: 'center', lineHeight: 18 },
});
