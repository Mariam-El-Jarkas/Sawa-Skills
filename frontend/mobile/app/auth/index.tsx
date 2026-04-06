import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { C, G } from '../../components/theme';

type Mode = 'login' | 'register' | 'otp';

export default function AuthScreen() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        const ok = await login(email, password);
        if (ok) router.back(); else setError('Invalid credentials');
      } else {
        const ok = await signup(name, email, password, birthDate);
        if (ok) router.back(); else setError('Registration failed');
      }
    } catch { setError('An error occurred'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={24} color={C.gray700} />
      </TouchableOpacity>

      <View style={s.header}>
        <Text style={s.logoText}>Sawa Skills</Text>
        <Text style={s.tagline}>
          {mode === 'login' ? 'Welcome back!' : mode === 'register' ? 'Create your account' : 'Verify your account'}
        </Text>
      </View>

      <View style={s.card}>
        {mode === 'otp' ? (
          <View style={s.otpSection}>
            <Text style={s.otpTitle}>Enter OTP</Text>
            <Text style={s.otpSub}>We sent a code to {email}</Text>
            <View style={s.otpRow}>
              {[1,2,3,4,5,6].map(i => (
                <TextInput key={i} style={s.otpBox} maxLength={1} keyboardType="numeric" textAlign="center" />
              ))}
            </View>
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.back()}>
              <Text style={s.primaryBtnTxt}>Verify & Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.resendBtn}><Text style={s.resendTxt}>Resend code</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={s.form}>
            {mode === 'register' && (
              <View style={s.inputWrap}>
                <User size={18} color={C.gray400} style={s.inputIcon} />
                <TextInput style={s.input} placeholder="Full Name" value={name} onChangeText={setName} placeholderTextColor={C.gray400} autoCapitalize="words" />
              </View>
            )}

            <View style={s.inputWrap}>
              <Mail size={18} color={C.gray400} style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={C.gray400} />
            </View>

            {mode === 'register' && (
              <View style={s.inputWrap}>
                <Phone size={18} color={C.gray400} style={s.inputIcon} />
                <TextInput style={s.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={C.gray400} />
              </View>
            )}

            {mode === 'register' && (
              <View style={s.inputWrap}>
                <User size={18} color={C.gray400} style={s.inputIcon} />
                <TextInput style={s.input} placeholder="Date of Birth (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} placeholderTextColor={C.gray400} />
              </View>
            )}

            <View style={s.inputWrap}>
              <Lock size={18} color={C.gray400} style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={C.gray400} />
            </View>

            {mode === 'login' && (
              <TouchableOpacity style={s.forgotBtn}><Text style={s.forgotTxt}>Forgot password?</Text></TouchableOpacity>
            )}

            {!!error && <Text style={s.errorTxt}>{error}</Text>}

            <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={C.white} /> : (
                <Text style={s.primaryBtnTxt}>{mode === 'login' ? 'Login' : 'Create Account'}</Text>
              )}
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.divider} />
              <Text style={s.dividerTxt}>Or continue with</Text>
              <View style={s.divider} />
            </View>

            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialBtn}><Text style={s.socialIcon}>G</Text></TouchableOpacity>
              <TouchableOpacity style={s.socialBtn}><Text style={s.socialIcon}>f</Text></TouchableOpacity>
            </View>

            <View style={s.switchRow}>
              <Text style={s.switchTxt}>{mode === 'login' ? "Don't have an account? " : 'Already have an account? '}</Text>
              <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
                <Text style={s.switchLink}>{mode === 'login' ? 'Sign up' : 'Login'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  form: { gap: 14 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.gray200, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.white, gap: 10 },
  inputIcon: {},
  input: { flex: 1, fontSize: 15, color: C.gray900 },
  forgotBtn: { alignSelf: 'flex-start' },
  forgotTxt: { color: C.violet600, fontSize: 13 },
  errorTxt: { color: C.red600, fontSize: 13, textAlign: 'center' },
  primaryBtn: { backgroundColor: C.violet600, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtnTxt: { color: C.white, fontWeight: '700', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: C.gray200 },
  dividerTxt: { fontSize: 12, color: C.gray400 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  socialBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: C.gray200, alignItems: 'center', justifyContent: 'center' },
  socialIcon: { fontSize: 18, fontWeight: '700', color: C.gray700 },
  switchRow: { flexDirection: 'row', justifyContent: 'center' },
  switchTxt: { fontSize: 14, color: C.gray500 },
  switchLink: { fontSize: 14, fontWeight: '700', color: C.violet600 },
  otpSection: { gap: 16, alignItems: 'center' },
  otpTitle: { fontSize: 22, fontWeight: '700' },
  otpSub: { fontSize: 14, color: C.gray500 },
  otpRow: { flexDirection: 'row', gap: 8 },
  otpBox: { width: 46, height: 54, borderWidth: 2, borderColor: C.gray200, borderRadius: 12, fontSize: 22, fontWeight: '700', color: C.gray900 },
  resendBtn: { marginTop: 4 },
  resendTxt: { color: C.violet600, fontSize: 14 },
});
