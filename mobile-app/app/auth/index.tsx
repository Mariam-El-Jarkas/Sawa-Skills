import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Mail, Lock, User, Phone, ArrowLeft, Eye, EyeOff, Calendar, CheckSquare, Square } from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { validateLebanesePhone } from '../../utils/validation';
import { C } from '../../components/theme';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '666569458548-shbjvi6f539o126s58sc8kidr6ts7qsu.apps.googleusercontent.com';
const FACEBOOK_APP_ID      = 'YOUR_FACEBOOK_APP_ID';
const GITHUB_CLIENT_ID     = 'Ov23li61VCZbLWY9Wh7Y';

type Mode = 'login' | 'register' | 'otp' | 'forgot-password' | 'reset-password';

// ─── Validation rules ────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX  = /^\d{4}-\d{2}-\d{2}$/;

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

function validateRegister(
  name: string, email: string, phone: string,
  birthDate: string, password: string, confirmPassword: string,
  termsAccepted: boolean
): FieldErrors {
  const errors: FieldErrors = {};

  if (!name.trim())
    errors.name = 'Full name is required';
  else if (name.trim().length < 2)
    errors.name = 'Name must be at least 2 characters';

  if (!email.trim())
    errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email.trim()))
    errors.email = 'Enter a valid email address';

  if (phone.trim()) {
    const phoneError = validateLebanesePhone(phone);
    if (phoneError) errors.phone = phoneError;
  }

  if (!birthDate.trim())
    errors.birthDate = 'Date of birth is required';
  else if (!DATE_REGEX.test(birthDate.trim()))
    errors.birthDate = 'Use format YYYY-MM-DD (e.g. 2000-01-25)';
  else {
    const dob = new Date(birthDate);
    if (isNaN(dob.getTime()))
      errors.birthDate = 'Invalid date';
    else if (dob >= new Date())
      errors.birthDate = 'Date of birth must be in the past';
  }

  if (!password)
    errors.password = 'Password is required';
  else if (password.length < 6)
    errors.password = 'Password must be at least 6 characters';
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    errors.password = 'Password must contain at least one letter and one number';

  if (!confirmPassword)
    errors.confirmPassword = 'Please confirm your password';
  else if (confirmPassword !== password)
    errors.confirmPassword = 'Passwords do not match';

  if (!termsAccepted)
    errors.terms = 'You must accept the terms to continue';

  return errors;
}

function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim())
    errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email.trim()))
    errors.email = 'Enter a valid email address';
  if (!password)
    errors.password = 'Password is required';
  return errors;
}

function passwordStrength(password: string): { label: string; color: string } {
  if (!password) return { label: '', color: 'transparent' };
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = (password.length >= 8 ? 1 : 0) + (hasLetter ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  if (score <= 1) return { label: 'Weak', color: C.red600 };
  if (score === 2) return { label: 'Fair', color: C.amber700 };
  if (score === 3) return { label: 'Good', color: C.violet600 };
  return { label: 'Strong', color: C.emerald600 };
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthScreen() {
  const router = useRouter();
  const { login, signup, verifyOtp, resendOtp, forgotPassword, resetPassword, loginWithSocial } = useAuth();

  const [mode, setMode] = useState<Mode>('login');

  // Form fields
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [name, setName]                     = useState('');
  const [birthDate, setBirthDate]           = useState('');
  const [phone, setPhone]                   = useState('');
  const [termsAccepted, setTermsAccepted]   = useState(false);
  const [otpDigits, setOtpDigits]           = useState(['', '', '', '', '', '']);
  const [resetCode, setResetCode]           = useState('');

  // UI state
  const [loading, setLoading]               = useState(false);
  const [serverError, setServerError]       = useState('');
  const [successMsg, setSuccessMsg]         = useState('');
  const [fieldErrors, setFieldErrors]       = useState<FieldErrors>({});
  const [touched, setTouched]               = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Clear all state when switching modes.
  // preserveEmail=true keeps the email field so the user doesn't retype it
  // (e.g. register → login, or forgot-password → login).
  const switchMode = (next: Mode, preserveEmail = false) => {
    setMode(next);
    setServerError(''); setSuccessMsg('');
    setFieldErrors({}); setTouched({});
    setPassword(''); setConfirmPassword('');
    setShowPassword(false); setShowConfirm(false);
    if (!preserveEmail) setEmail('');
    if (next === 'register') setTermsAccepted(false);
  };

  // Mark a field as touched and validate it inline on blur
  const handleBlur = (field: keyof FieldErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (mode === 'register') {
      const errs = validateRegister(name, email, phone, birthDate, password, confirmPassword, termsAccepted);
      setFieldErrors(prev => ({ ...prev, [field]: errs[field] }));
    } else if (mode === 'login') {
      const errs = validateLogin(email, password);
      setFieldErrors(prev => ({ ...prev, [field]: errs[field] }));
    }
  };

  // Re-validate confirmPassword live when password changes
  useEffect(() => {
    if (touched.confirmPassword) {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: confirmPassword && confirmPassword !== password
          ? 'Passwords do not match'
          : confirmPassword === password ? undefined : prev.confirmPassword,
      }));
    }
  }, [password, confirmPassword]);

  // ── Social login ────────────────────────────────────────────────────────────
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({ webClientId: GOOGLE_WEB_CLIENT_ID });
  const [, fbResponse, promptFacebookAsync]   = Facebook.useAuthRequest({ clientId: FACEBOOK_APP_ID });
  const redirectUrl = AuthSession.makeRedirectUri();
  const [, githubResponse, promptGithubAsync] = AuthSession.useAuthRequest(
    { clientId: GITHUB_CLIENT_ID, scopes: ['user:email'], redirectUri: redirectUrl, usePKCE: false },
    { authorizationEndpoint: 'https://github.com/login/oauth/authorize' }
  );

  const handleSocialLogin = async (provider: 'GOOGLE' | 'FACEBOOK' | 'GITHUB', accessToken: string, redirectUri?: string) => {
    setLoading(true); setServerError('');
    try {
      await loginWithSocial(provider, accessToken, redirectUri);
      router.back();
    } catch (e: any) {
      setServerError(e?.message || `${provider} login failed`);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const token = googleResponse.authentication?.accessToken;
      if (token) handleSocialLogin('GOOGLE', token);
      else setServerError('Google login failed — no token returned');
    } else if (googleResponse?.type === 'error') {
      setServerError('Google login error: ' + googleResponse.error?.message);
    }
  }, [googleResponse]);

  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const token = fbResponse.authentication?.accessToken;
      if (token) handleSocialLogin('FACEBOOK', token);
      else setServerError('Facebook login failed — no token returned');
    } else if (fbResponse?.type === 'error') {
      setServerError('Facebook login error: ' + fbResponse.error?.message);
    }
  }, [fbResponse]);

  useEffect(() => {
    if (githubResponse?.type === 'success') {
      const code = githubResponse.params?.code;
      if (code) handleSocialLogin('GITHUB', code, redirectUrl);
      else setServerError('GitHub login failed — no code returned');
    } else if (githubResponse?.type === 'error') {
      setServerError('GitHub login error: ' + githubResponse.error?.message);
    }
  }, [githubResponse]);
  // ───────────────────────────────────────────────────────────────────────────

  const handleOtpChange = (val: string, index: number) => {
    const updated = [...otpDigits];
    updated[index] = val.replace(/[^0-9]/g, '');
    setOtpDigits(updated);
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    setServerError(''); setSuccessMsg('');

    // ── Guard: run full validation before hitting the network ──────────────
    if (mode === 'register') {
      const errs = validateRegister(name, email, phone, birthDate, password, confirmPassword, termsAccepted);
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        // Mark all fields as touched so every error becomes visible
        setTouched({ name: true, email: true, phone: true, birthDate: true, password: true, confirmPassword: true, terms: true });
        return;
      }
    }
    if (mode === 'login') {
      const errs = validateLogin(email, password);
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setTouched({ email: true, password: true });
        return;
      }
    }
    // ───────────────────────────────────────────────────────────────────────

    setLoading(true);
    try {
      if (mode === 'login') {
        const ok = await login(email, password);
        if (ok) router.back();

      } else if (mode === 'register') {
        const ok = await signup(name, email, phone, password, birthDate);
        if (ok) { setMode('otp'); setOtpDigits(['', '', '', '', '', '']); }

      } else if (mode === 'otp') {
        const otp = otpDigits.join('');
        if (otp.length < 6) { setServerError('Enter the full 6-digit code'); setLoading(false); return; }
        const ok = await verifyOtp(email, otp);
        if (ok) {
          setSuccessMsg('Email verified! You can now log in.');
          switchMode('login', true); // keep email so user can log in immediately
        } else {
          setServerError('Invalid or expired OTP');
        }

      } else if (mode === 'forgot-password') {
        if (!email.trim()) { setFieldErrors({ email: 'Email is required' }); setTouched({ email: true }); setLoading(false); return; }
        if (!EMAIL_REGEX.test(email.trim())) { setFieldErrors({ email: 'Enter a valid email address' }); setTouched({ email: true }); setLoading(false); return; }
        const ok = await forgotPassword(email);
        if (ok) {
          setSuccessMsg('A reset code has been sent to ' + email);
          setMode('reset-password');
          setResetCode(''); setNewPassword('');
        } else {
          setServerError('No account found with that email');
        }

      } else if (mode === 'reset-password') {
        if (!resetCode || resetCode.length < 6) { setServerError('Enter the 6-digit reset code'); setLoading(false); return; }
        if (!newPassword || newPassword.length < 6) { setServerError('Password must be at least 6 characters'); setLoading(false); return; }
        const ok = await resetPassword(email, resetCode, newPassword);
        if (ok) {
          setSuccessMsg('Password reset! You can now log in.');
          switchMode('login', true); // keep email so user can log in immediately
        } else {
          setServerError('Invalid or expired reset code');
        }
      }
    } catch (e: any) { setServerError(e?.message || 'Network error — is the server running?'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setServerError(''); setSuccessMsg('');
    const ok = await resendOtp(email);
    if (ok) setSuccessMsg('New code sent to ' + email);
    else setServerError('Failed to resend code');
  };

  const goBack = () => {
    // Each mode knows where its own back arrow should go
    if (mode === 'otp')            { switchMode('register', true);  return; }
    if (mode === 'register')       { switchMode('login',    true);  return; } // ← was missing
    if (mode === 'forgot-password') { switchMode('login',   true);  return; }
    if (mode === 'reset-password') { switchMode('login',    true);  return; }
    // mode === 'login': leave the auth screen; fall back to home if no history
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const tagline = () => {
    if (mode === 'login') return 'Welcome back!';
    if (mode === 'register') return 'Create your account';
    if (mode === 'otp') return 'Verify your account';
    if (mode === 'forgot-password') return 'Reset your password';
    return 'Enter reset code';
  };

  // Helpers for per-field error display
  const showErr = (field: keyof FieldErrors) =>
    touched[field] && fieldErrors[field] ? fieldErrors[field] : undefined;

  const inputBorder = (field: keyof FieldErrors) =>
    touched[field] && fieldErrors[field] ? C.red600 : C.gray200;

  const strength = passwordStrength(password);

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={s.backBtn} onPress={goBack} accessibilityLabel="Go back">
        <ArrowLeft size={24} color={C.gray700} />
      </TouchableOpacity>

      <View style={s.header}>
        <Text style={s.logoText}>Sawa Skills</Text>
        <Text style={s.tagline}>{tagline()}</Text>
      </View>

      <View style={s.card}>

        {/* ── OTP ─────────────────────────────────────────────────────────── */}
        {mode === 'otp' ? (
          <View style={s.otpSection}>
            <Text style={s.otpTitle}>Enter OTP</Text>
            <Text style={s.otpSub}>We sent a code to {email}</Text>
            <View style={s.otpRow}>
              {otpDigits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={ref => { otpRefs.current[i] = ref; }}
                  style={s.otpBox}
                  value={digit}
                  onChangeText={val => handleOtpChange(val, i)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                  maxLength={1}
                  keyboardType="numeric"
                  textAlign="center"
                  accessibilityLabel={`OTP digit ${i + 1}`}
                />
              ))}
            </View>
            {!!serverError && <Text style={s.errorTxt} accessibilityRole="alert">{serverError}</Text>}
            {!!successMsg  && <Text style={s.successTxt}>{successMsg}</Text>}
            <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading} accessibilityRole="button">
              {loading ? <ActivityIndicator color={C.white} /> : <Text style={s.primaryBtnTxt}>Verify & Continue</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.resendBtn} onPress={handleResend} accessibilityRole="button">
              <Text style={s.resendTxt}>Resend code</Text>
            </TouchableOpacity>
          </View>

        /* ── Forgot password ─────────────────────────────────────────────── */
        ) : mode === 'forgot-password' ? (
          <View style={s.form}>
            <Text style={s.sectionNote}>Enter your email and we'll send you a 6-digit reset code.</Text>
            <Field label="Email" error={showErr('email')}>
              <Mail size={18} color={C.gray400} />
              <TextInput
                style={s.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={C.gray400}
                accessibilityLabel="Email"
              />
            </Field>
            {!!serverError && <Text style={s.errorTxt} accessibilityRole="alert">{serverError}</Text>}
            {!!successMsg  && <Text style={s.successTxt}>{successMsg}</Text>}
            <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={C.white} /> : <Text style={s.primaryBtnTxt}>Send Reset Code</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchMode('login')}>
              <Text style={[s.resendTxt, { textAlign: 'center', marginTop: 8 }]}>Back to Login</Text>
            </TouchableOpacity>
          </View>

        /* ── Reset password ──────────────────────────────────────────────── */
        ) : mode === 'reset-password' ? (
          <View style={s.form}>
            <Text style={s.sectionNote}>Enter the code sent to {email}, then choose a new password.</Text>
            <Field label="Reset code">
              <Lock size={18} color={C.gray400} />
              <TextInput
                style={s.input}
                placeholder="6-digit reset code"
                value={resetCode}
                onChangeText={t => setResetCode(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor={C.gray400}
              />
            </Field>
            <Field label="New password">
              <Lock size={18} color={C.gray400} />
              <TextInput
                style={s.input}
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholderTextColor={C.gray400}
              />
            </Field>
            {!!serverError && <Text style={s.errorTxt} accessibilityRole="alert">{serverError}</Text>}
            {!!successMsg  && <Text style={s.successTxt}>{successMsg}</Text>}
            <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={C.white} /> : <Text style={s.primaryBtnTxt}>Reset Password</Text>}
            </TouchableOpacity>
          </View>

        /* ── Login / Register ────────────────────────────────────────────── */
        ) : (
          <View style={s.form}>

            {/* Full Name — register only */}
            {mode === 'register' && (
              <Field label="Full name" error={showErr('name')}>
                <User size={18} color={showErr('name') ? C.red600 : C.gray400} />
                <TextInput
                  style={[s.input, showErr('name') && s.inputError]}
                  placeholder="Full name *"
                  value={name}
                  onChangeText={t => { setName(t); if (touched.name) handleBlur('name'); }}
                  onBlur={() => handleBlur('name')}
                  placeholderTextColor={C.gray400}
                  autoCapitalize="words"
                  accessibilityLabel="Full name"
                  accessibilityHint="Required"
                />
              </Field>
            )}

            {/* Email */}
            <Field label="Email" error={showErr('email')} borderColor={inputBorder('email')}>
              <Mail size={18} color={showErr('email') ? C.red600 : C.gray400} />
              <TextInput
                style={s.input}
                placeholder="Email *"
                value={email}
                onChangeText={t => { setEmail(t); if (touched.email) handleBlur('email'); }}
                onBlur={() => handleBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={C.gray400}
                accessibilityLabel="Email"
              />
            </Field>

            {/* Phone — register only, optional */}
            {mode === 'register' && (
              <Field label="Phone" error={showErr('phone')} borderColor={inputBorder('phone')}>
                <Phone size={18} color={showErr('phone') ? C.red600 : C.gray400} />
                <TextInput
                  style={s.input}
                  placeholder="Phone number (optional)"
                  value={phone}
                  onChangeText={t => { setPhone(t); if (touched.phone) handleBlur('phone'); }}
                  onBlur={() => handleBlur('phone')}
                  keyboardType="phone-pad"
                  placeholderTextColor={C.gray400}
                  accessibilityLabel="Phone number"
                />
              </Field>
            )}

            {/* Date of Birth — register only */}
            {mode === 'register' && (
              <Field label="Date of birth" error={showErr('birthDate')} borderColor={inputBorder('birthDate')}>
                <Calendar size={18} color={showErr('birthDate') ? C.red600 : C.gray400} />
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD *"
                  value={birthDate}
                  onChangeText={t => { setBirthDate(t); if (touched.birthDate) handleBlur('birthDate'); }}
                  onBlur={() => handleBlur('birthDate')}
                  placeholderTextColor={C.gray400}
                  accessibilityLabel="Date of birth"
                  accessibilityHint="Format: YYYY-MM-DD"
                />
              </Field>
            )}

            {/* Password */}
            <Field label="Password" error={showErr('password')} borderColor={inputBorder('password')}>
              <Lock size={18} color={showErr('password') ? C.red600 : C.gray400} />
              <TextInput
                style={s.input}
                placeholder={mode === 'register' ? 'Password * (min 6 chars)' : 'Password'}
                value={password}
                onChangeText={t => { setPassword(t); if (touched.password) handleBlur('password'); }}
                onBlur={() => handleBlur('password')}
                secureTextEntry={!showPassword}
                placeholderTextColor={C.gray400}
                accessibilityLabel="Password"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword
                  ? <EyeOff size={18} color={C.gray400} />
                  : <Eye size={18} color={C.gray400} />
                }
              </TouchableOpacity>
            </Field>

            {/* Password strength bar — register only */}
            {mode === 'register' && password.length > 0 && (
              <View style={s.strengthRow}>
                <View style={[s.strengthBar, { backgroundColor: strength.color }]} />
                <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            {/* Confirm Password — register only */}
            {mode === 'register' && (
              <Field label="Confirm password" error={showErr('confirmPassword')} borderColor={inputBorder('confirmPassword')}>
                <Lock size={18} color={showErr('confirmPassword') ? C.red600 : C.gray400} />
                <TextInput
                  style={s.input}
                  placeholder="Confirm password *"
                  value={confirmPassword}
                  onChangeText={t => { setConfirmPassword(t); if (touched.confirmPassword) handleBlur('confirmPassword'); }}
                  onBlur={() => handleBlur('confirmPassword')}
                  secureTextEntry={!showConfirm}
                  placeholderTextColor={C.gray400}
                  accessibilityLabel="Confirm password"
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} accessibilityLabel={showConfirm ? 'Hide confirm password' : 'Show confirm password'}>
                  {showConfirm
                    ? <EyeOff size={18} color={C.gray400} />
                    : <Eye size={18} color={C.gray400} />
                  }
                </TouchableOpacity>
              </Field>
            )}

            {/* Terms — register only */}
            {mode === 'register' && (
              <View>
                <TouchableOpacity
                  style={s.termsRow}
                  onPress={() => {
                    setTermsAccepted(v => !v);
                    setTouched(prev => ({ ...prev, terms: true }));
                    setFieldErrors(prev => ({ ...prev, terms: undefined }));
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: termsAccepted }}
                  accessibilityLabel="Accept terms and conditions"
                >
                  {termsAccepted
                    ? <CheckSquare size={20} color={C.violet600} />
                    : <Square size={20} color={showErr('terms') ? C.red600 : C.gray400} />
                  }
                  <Text style={s.termsTxt}>
                    I agree to the{' '}
                    <Text style={s.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={s.termsLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
                {showErr('terms') && <Text style={s.fieldError}>{showErr('terms')}</Text>}
              </View>
            )}

            {/* Forgot password — login only */}
            {mode === 'login' && (
              <TouchableOpacity style={s.forgotBtn} onPress={() => switchMode('forgot-password')}>
                <Text style={s.forgotTxt}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Server error */}
            {!!serverError && <Text style={s.errorTxt} accessibilityRole="alert">{serverError}</Text>}
            {!!successMsg  && <Text style={s.successTxt}>{successMsg}</Text>}

            <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={loading} accessibilityRole="button">
              {loading
                ? <ActivityIndicator color={C.white} />
                : <Text style={s.primaryBtnTxt}>{mode === 'login' ? 'Login' : 'Create Account'}</Text>
              }
            </TouchableOpacity>

            <View style={s.dividerRow}>
              <View style={s.divider} />
              <Text style={s.dividerTxt}>Or continue with</Text>
              <View style={s.divider} />
            </View>

            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialBtn} onPress={() => promptGoogleAsync()} disabled={loading} accessibilityLabel="Sign in with Google">
                <Text style={s.socialIcon}>G</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.socialBtn} onPress={() => promptGithubAsync()} disabled={loading} accessibilityLabel="Sign in with GitHub">
                <FontAwesome name="github" size={22} color={C.gray700} />
              </TouchableOpacity>
              <TouchableOpacity style={s.socialBtn} onPress={() => promptFacebookAsync()} disabled={loading} accessibilityLabel="Sign in with Facebook">
                <Text style={s.socialIcon}>f</Text>
              </TouchableOpacity>
            </View>

            <View style={s.switchRow}>
              <Text style={s.switchTxt}>{mode === 'login' ? "Don't have an account? " : 'Already have an account? '}</Text>
              <TouchableOpacity onPress={() => switchMode(mode === 'login' ? 'register' : 'login', true)}>
                <Text style={s.switchLink}>{mode === 'login' ? 'Sign up' : 'Login'}</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── Field wrapper — keeps icon + input + error in one place ─────────────────
function Field({
  children, error, borderColor, label,
}: {
  children: React.ReactNode;
  error?: string;
  borderColor?: string;
  label?: string;
}) {
  return (
    <View>
      <View style={[s.inputWrap, { borderColor: borderColor ?? (error ? C.red600 : C.gray200) }]}>
        {children}
      </View>
      {!!error && <Text style={s.fieldError} accessibilityRole="alert">{error}</Text>}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: C.gray50 },
  content:        { padding: 20, paddingBottom: 40 },
  backBtn:        { padding: 8, marginBottom: 16, alignSelf: 'flex-start', backgroundColor: C.white, borderRadius: 12 },
  header:         { alignItems: 'center', marginBottom: 32 },
  logoText:       { fontSize: 36, fontWeight: '700', color: C.violet600, marginBottom: 8 },
  tagline:        { fontSize: 15, color: C.gray500 },
  card:           { backgroundColor: C.white, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  form:           { gap: 12 },
  sectionNote:    { fontSize: 14, color: C.gray500, textAlign: 'center', lineHeight: 20 },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.gray200, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.white, gap: 10 },
  input:          { flex: 1, fontSize: 15, color: C.gray900 },
  inputError:     { color: C.red600 },
  fieldError:     { color: C.red600, fontSize: 12, marginTop: 4, marginLeft: 4 },
  forgotBtn:      { alignSelf: 'flex-start' },
  forgotTxt:      { color: C.violet600, fontSize: 13 },
  errorTxt:       { color: C.red600, fontSize: 13, textAlign: 'center' },
  successTxt:     { color: C.emerald600, fontSize: 13, textAlign: 'center' },
  primaryBtn:     { backgroundColor: C.violet600, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  primaryBtnTxt:  { color: C.white, fontWeight: '700', fontSize: 16 },
  dividerRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider:        { flex: 1, height: 1, backgroundColor: C.gray200 },
  dividerTxt:     { fontSize: 12, color: C.gray400 },
  socialRow:      { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  socialBtn:      { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: C.gray200, alignItems: 'center', justifyContent: 'center' },
  socialIcon:     { fontSize: 18, fontWeight: '700', color: C.gray700 },
  switchRow:      { flexDirection: 'row', justifyContent: 'center' },
  switchTxt:      { fontSize: 14, color: C.gray500 },
  switchLink:     { fontSize: 14, fontWeight: '700', color: C.violet600 },
  // OTP
  otpSection:     { gap: 16, alignItems: 'center' },
  otpTitle:       { fontSize: 22, fontWeight: '700' },
  otpSub:         { fontSize: 14, color: C.gray500 },
  otpRow:         { flexDirection: 'row', gap: 8 },
  otpBox:         { width: 46, height: 54, borderWidth: 2, borderColor: C.gray200, borderRadius: 12, fontSize: 22, fontWeight: '700', color: C.gray900 },
  resendBtn:      { marginTop: 4 },
  resendTxt:      { color: C.violet600, fontSize: 14 },
  // Password strength
  strengthRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4 },
  strengthBar:    { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel:  { fontSize: 12, fontWeight: '600', minWidth: 48 },
  // Terms
  termsRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  termsTxt:       { flex: 1, fontSize: 13, color: C.gray600, lineHeight: 20 },
  termsLink:      { color: C.violet600, fontWeight: '600' },
});
