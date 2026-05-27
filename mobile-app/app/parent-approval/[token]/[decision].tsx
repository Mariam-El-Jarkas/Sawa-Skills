import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck, ShieldX, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { BASE_URL } from '../../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Status = 'loading' | 'success' | 'error' | 'already_used';

export default function ParentApprovalScreen() {
  const { token, decision } = useLocalSearchParams<{ token: string; decision: string }>();
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  const isApprove = decision?.toLowerCase() === 'approve';

  useEffect(() => {
    if (!token || !decision) {
      setStatus('error');
      setMessage('Invalid approval link.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/parent-approval/${token}/${decision.toLowerCase()}`);
        const text = await res.text();

        if (res.ok) {
          if (text.includes('already been used') || text.includes('already used')) {
            setStatus('already_used');
            setMessage('This link has already been used.');
          } else {
            setStatus('success');
            setMessage(isApprove
              ? 'Request approved! Your child has been notified.'
              : 'Request declined. Your child has been notified.');
          }
        } else {
          setStatus('error');
          setMessage('Something went wrong. Please try again.');
        }
      } catch {
        setStatus('error');
        setMessage('Could not connect. Please check your internet and try again.');
      }
    })();
  }, [token, decision]);

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.gray50,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    card: {
      backgroundColor: C.white,
      borderRadius: 24,
      padding: 36,
      alignItems: 'center',
      width: '100%',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    iconRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: C.gray900,
      textAlign: 'center',
      marginBottom: 10,
    },
    sub: {
      fontSize: 15,
      color: C.gray500,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
    },
    btn: {
      backgroundColor: C.violet600,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 14,
      width: '100%',
      alignItems: 'center',
    },
    btnTxt: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    brand: {
      fontSize: 13,
      color: C.gray400,
      marginTop: 24,
      letterSpacing: 1,
    },
  });

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <View style={s.card}>
          <ActivityIndicator size="large" color={C.violet600} style={{ marginBottom: 20 }} />
          <Text style={s.title}>Processing...</Text>
          <Text style={s.sub}>Please wait while we process your decision.</Text>
        </View>
      );
    }

    if (status === 'success') {
      return (
        <View style={s.card}>
          <View style={[s.iconRing, { backgroundColor: isApprove ? '#f0fdf4' : '#fef2f2' }]}>
            {isApprove
              ? <ShieldCheck size={40} color="#16a34a" />
              : <ShieldX size={40} color="#dc2626" />}
          </View>
          <Text style={s.title}>{isApprove ? 'Request Approved!' : 'Request Declined'}</Text>
          <Text style={s.sub}>{message}</Text>
          <TouchableOpacity style={s.btn} onPress={() => router.replace('/')}>
            <Text style={s.btnTxt}>Open SawaSkills</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === 'already_used') {
      return (
        <View style={s.card}>
          <View style={[s.iconRing, { backgroundColor: '#fefce8' }]}>
            <AlertCircle size={40} color="#ca8a04" />
          </View>
          <Text style={s.title}>Already Used</Text>
          <Text style={s.sub}>This approval link has already been used. No further action is needed.</Text>
          <TouchableOpacity style={s.btn} onPress={() => router.replace('/')}>
            <Text style={s.btnTxt}>Open SawaSkills</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={s.card}>
        <View style={[s.iconRing, { backgroundColor: '#fef2f2' }]}>
          <AlertCircle size={40} color="#dc2626" />
        </View>
        <Text style={s.title}>Something Went Wrong</Text>
        <Text style={s.sub}>{message}</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.replace('/')}>
          <Text style={s.btnTxt}>Open SawaSkills</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {renderContent()}
      <Text style={s.brand}>SAWASKILLS</Text>
    </View>
  );
}
