import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../theme';

interface Props {
  isVisible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmModal: React.FC<Props> = ({
  isVisible, title, message,
  confirmText = 'Confirm', cancelText = 'Cancel',
  onConfirm, onCancel, destructive = false,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>
          <View style={s.btns}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
              <Text style={s.cancelTxt}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.confirmBtn, destructive && s.destructiveBtn]}
              onPress={onConfirm}
            >
              <Text style={[s.confirmTxt, destructive && s.destructiveTxt]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: C.gray900 },
  message: { fontSize: 14, color: C.gray600, lineHeight: 20 },
  btns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1, borderColor: C.gray200, alignItems: 'center',
  },
  cancelTxt: { fontSize: 14, fontWeight: '600', color: C.gray700 },
  confirmBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    backgroundColor: C.violet600, alignItems: 'center',
  },
  confirmTxt: { fontSize: 14, fontWeight: '600', color: C.white },
  destructiveBtn: { backgroundColor: C.red600 },
  destructiveTxt: { color: C.white },
});
