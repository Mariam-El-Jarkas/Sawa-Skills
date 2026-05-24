import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { UserPlus, UserCheck, UserX, Clock } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../modals/AppToast';
import { profileService } from '../../services/profileService';

interface Props {
  connectionStatus: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED' | null;
  connectionId: number | null;
  targetUserId: number;
  onStatusChange: () => void;
}

export function ConnectButton({ connectionStatus, connectionId, targetUserId, onStatusChange }: Props) {
  const { C } = useTheme();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (!token || busy) return;
    setBusy(true);
    try {
      if (connectionStatus === 'NONE') {
        await profileService.sendConnectionRequest(targetUserId, token);
        showToast('Connection request sent!', 'success');
      } else if (connectionStatus === 'PENDING_RECEIVED' && connectionId) {
        await profileService.approveConnection(connectionId, token);
        showToast('Connection accepted!', 'success');
      } else if (connectionStatus === 'CONNECTED' && connectionId) {
        await profileService.removeConnection(connectionId, token);
        showToast('Connection removed', 'info');
      } else if (connectionStatus === 'PENDING_SENT' && connectionId) {
        await profileService.removeConnection(connectionId, token);
        showToast('Request cancelled', 'info');
      }
      onStatusChange();
    } catch (e: any) {
      showToast(e.message ?? 'Something went wrong', 'error');
    } finally {
      setBusy(false);
    }
  };

  const config = {
    NONE:             { label: 'Connect',          Icon: UserPlus,  bg: '#7C3AED', txt: '#ffffff', border: '#7C3AED' },
    PENDING_SENT:     { label: 'Request Sent',      Icon: Clock,     bg: 'transparent', txt: '#7C3AED', border: '#7C3AED' },
    PENDING_RECEIVED: { label: 'Accept Request',    Icon: UserCheck, bg: '#7C3AED', txt: '#ffffff', border: '#7C3AED' },
    CONNECTED:        { label: 'Connected',          Icon: UserCheck, bg: 'transparent', txt: '#7C3AED', border: '#7C3AED' },
  }[connectionStatus ?? 'NONE'];

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: config.bg, borderColor: config.border }]}
        onPress={handle}
        activeOpacity={0.8}
        disabled={busy}
      >
        {busy
          ? <ActivityIndicator size="small" color={connectionStatus === 'NONE' || connectionStatus === 'PENDING_RECEIVED' ? '#ffffff' : '#7C3AED'} />
          : <>
              <config.Icon size={16} color={config.txt} />
              <Text style={[styles.label, { color: config.txt }]}>{config.label}</Text>
            </>
        }
      </TouchableOpacity>

      {connectionStatus === 'PENDING_RECEIVED' && (
        <TouchableOpacity
          style={[styles.btn, styles.declineBtn]}
          onPress={async () => {
            if (!token || !connectionId || busy) return;
            setBusy(true);
            try {
              await profileService.removeConnection(connectionId, token);
              showToast('Request declined', 'info');
              onStatusChange();
            } catch (e: any) {
              showToast(e.message ?? 'Failed', 'error');
            } finally { setBusy(false); }
          }}
          activeOpacity={0.8}
        >
          <UserX size={16} color={C.gray500} />
          <Text style={[styles.label, { color: C.gray500 }]}>Decline</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5,
  },
  declineBtn: { backgroundColor: 'transparent', borderColor: '#D1D5DB' },
  label: { fontSize: 14, fontWeight: '700' },
});
