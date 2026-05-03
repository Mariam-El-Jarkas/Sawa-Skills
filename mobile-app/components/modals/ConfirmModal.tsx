import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
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
  requireConfirmationText?: string;
}

export const ConfirmModal: React.FC<Props> = ({
  isVisible, title, message,
  confirmText = 'Confirm', cancelText = 'Cancel',
  onConfirm, onCancel, destructive = false,
  requireConfirmationText,
}) => {
  const [inputText, setInputText] = useState('');
  
  const handleCancel = () => {
    setInputText('');
    onCancel();
  };

  const handleConfirm = () => {
    if (requireConfirmationText && inputText !== requireConfirmationText) return;
    setInputText('');
    onConfirm();
  };

  const isConfirmDisabled = !!(requireConfirmationText && inputText !== requireConfirmationText);
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={s.overlay}>
        <View style={s.box}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>
          
          {!!requireConfirmationText && (
            <View style={s.inputContainer}>
              <Text style={s.inputLabel}>Type '{requireConfirmationText}' to confirm:</Text>
              <TextInput
                style={s.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={requireConfirmationText}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={s.btns}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
              <Text style={s.cancelTxt}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.confirmBtn, destructive && s.destructiveBtn, isConfirmDisabled && s.disabledBtn]}
              onPress={handleConfirm}
              disabled={isConfirmDisabled}
            >
              <Text style={[s.confirmTxt, destructive && s.destructiveTxt, isConfirmDisabled && s.disabledTxt]}>{confirmText}</Text>
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
  disabledBtn: { backgroundColor: C.gray200 },
  disabledTxt: { color: C.gray400 },
  inputContainer: { marginTop: 4, marginBottom: 4 },
  inputLabel: { fontSize: 13, color: C.gray700, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: C.gray200, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: C.gray900, backgroundColor: C.gray50
  }
});
