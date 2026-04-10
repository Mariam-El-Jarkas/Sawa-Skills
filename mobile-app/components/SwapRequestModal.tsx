import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { X, CheckCircle } from 'lucide-react-native';
import { C } from './theme';

interface Props {
  isOpen: boolean; onClose: () => void;
  targetUser: string; targetSkill: string;
  userSkills: { id: number; name: string }[];
  onConfirm: (data: any) => void;
}

export function SwapRequestModal({ isOpen, onClose, targetUser, targetSkill, userSkills, onConfirm }: Props) {
  const [selectedId, setSelectedId] = useState<number | ''>(userSkills[0]?.id || '');
  const [note, setNote] = useState('');
  const [time, setTime] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ skill?: string; note?: string; time?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!selectedId) errs.skill = 'Please select a skill to offer.';
    if (note.length > 500) errs.note = `Note is too long (${note.length}/500 chars).`;
    if (time.trim() && time.trim().length > 100) errs.time = 'Preferred time must be under 100 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    setSuccess(true);
    setTimeout(() => {
      onConfirm({ targetUser, targetSkill, offeredSkill: userSkills.find(s => s.id === selectedId)?.name, note, time });
      onClose(); setSuccess(false); setNote(''); setTime(''); setErrors({});
    }, 2000);
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.sheet}>
          {success ? (
            <View style={s.success}>
              <View style={s.successIcon}><CheckCircle size={40} color="#16A34A" /></View>
              <Text style={s.successTitle}>Request Sent!</Text>
              <Text style={s.successSub}>Your swap request has been sent to {targetUser}.</Text>
            </View>
          ) : (
            <>
              <View style={s.hdr}>
                <View>
                  <Text style={s.hdrTitle}>Swap Request</Text>
                  <Text style={s.hdrSub}>Learn {targetSkill} from {targetUser}</Text>
                </View>
                <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                  <X size={20} color={C.gray500} />
                </TouchableOpacity>
              </View>
              <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
                <Text style={s.label}>I OFFER IN RETURN</Text>
                {userSkills.map(skill => (
                  <TouchableOpacity key={skill.id} style={[s.opt, selectedId === skill.id && s.optActive]} onPress={() => { setSelectedId(skill.id); setErrors(e => ({ ...e, skill: undefined })); }}>
                    <Text style={[s.optTxt, selectedId === skill.id && s.optTxtActive]}>{skill.name}</Text>
                  </TouchableOpacity>
                ))}
                {errors.skill && <Text style={s.errorTxt}>{errors.skill}</Text>}

                <Text style={[s.label, { marginTop: 16 }]}>PREFERRED TIME</Text>
                <TextInput
                  style={[s.input, errors.time ? s.inputError : null]}
                  placeholder="e.g. Weekends, 3 PM"
                  value={time}
                  onChangeText={v => { setTime(v); if (errors.time) setErrors(e => ({ ...e, time: undefined })); }}
                  placeholderTextColor={C.gray400}
                  maxLength={100}
                />
                {errors.time && <Text style={s.errorTxt}>{errors.time}</Text>}

                <Text style={[s.label, { marginTop: 16 }]}>NOTE (OPTIONAL)</Text>
                <TextInput
                  style={[s.input, s.textarea, errors.note ? s.inputError : null]}
                  placeholder="Introduce yourself..."
                  value={note}
                  onChangeText={v => { setNote(v); if (errors.note) setErrors(e => ({ ...e, note: undefined })); }}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={C.gray400}
                  maxLength={500}
                />
                <Text style={[s.charCount, note.length > 450 && s.charCountWarn]}>{note.length}/500</Text>
                {errors.note && <Text style={s.errorTxt}>{errors.note}</Text>}
              </ScrollView>
              <View style={s.footer}>
                <TouchableOpacity style={s.cancelBtn} onPress={onClose}><Text style={s.cancelTxt}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[s.sendBtn, !selectedId && s.disabled]} onPress={submit} disabled={!selectedId}>
                  <Text style={s.sendTxt}>Send Request</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  success: { padding: 40, alignItems: 'center' },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  successSub: { fontSize: 14, color: C.gray500, textAlign: 'center' },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  hdrTitle: { fontSize: 20, fontWeight: '700' },
  hdrSub: { fontSize: 12, color: C.gray400, marginTop: 2 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.gray100, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 24, paddingTop: 16 },
  label: { fontSize: 10, fontWeight: '700', color: C.gray400, letterSpacing: 1, marginBottom: 8 },
  opt: { padding: 14, borderRadius: 12, borderWidth: 2, borderColor: C.gray100, marginBottom: 8 },
  optActive: { borderColor: C.violet600, backgroundColor: C.violet50 },
  optTxt: { fontWeight: '600', color: C.gray700 },
  optTxtActive: { color: C.violet600 },
  input: { backgroundColor: C.gray50, borderRadius: 12, padding: 12, fontSize: 14, color: C.gray900, marginBottom: 4 },
  inputError: { borderWidth: 1.5, borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  textarea: { height: 80, textAlignVertical: 'top' },
  errorTxt: { fontSize: 12, color: '#DC2626', marginBottom: 8, marginLeft: 4 },
  charCount: { fontSize: 11, color: C.gray400, textAlign: 'right', marginBottom: 8 },
  charCountWarn: { color: '#D97706' },
  footer: { flexDirection: 'row', gap: 12, padding: 24, borderTopWidth: 1, borderTopColor: C.gray100 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: C.gray100, alignItems: 'center' },
  cancelTxt: { fontWeight: '600', color: C.gray700 },
  sendBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: C.violet600, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  sendTxt: { fontWeight: '700', color: C.white },
});
