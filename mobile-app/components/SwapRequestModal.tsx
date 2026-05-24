import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { X, CheckCircle, PlusCircle, Calendar, Clock } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  isOpen: boolean; onClose: () => void;
  targetUser: string; targetSkill: string;
  userSkills: { id: number; name: string }[];
  onConfirm: (data: any) => Promise<void>;
  onGoToSkills?: () => void;
  isFree?: boolean;
}

function formatDateTime(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()} · ${hour12}:${m} ${ampm}`;
}

export function SwapRequestModal({ isOpen, onClose, targetUser, targetSkill, userSkills, onConfirm, onGoToSkills, isFree = false }: Props) {
  const { C } = useTheme();
  const [selectedId, setSelectedId] = useState<number | ''>(userSkills[0]?.id || '');
  const [note, setNote] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ skill?: string; note?: string }>({});

  const minDate = new Date();

  useEffect(() => {
    if (isOpen) {
      setSelectedId(userSkills[0]?.id || '');
      setNote('');
      setScheduledDate(null);
      setShowDatePicker(false);
      setShowTimePicker(false);
      setTempDate(new Date());
      setSuccess(false);
      setIsSubmitting(false);
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const errs: typeof errors = {};
    if (!isFree && !selectedId) errs.skill = 'Please select a skill to offer.';
    if (note.length > 500) errs.note = `Note is too long (${note.length}/500 chars).`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setErrors({});
    try {
      await onConfirm({
        targetUser,
        targetSkill,
        offeredSkill: userSkills.find(s => s.id === selectedId)?.name,
        note,
        time: scheduledDate ? formatDateTime(scheduledDate) : '',
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setNote('');
        setScheduledDate(null);
        setIsSubmitting(false);
      }, 2000);
    } catch (e: any) {
      setErrors({ note: e.message || 'Failed to send request' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selected) {
        setTempDate(selected);
        // After date picked on Android, show time picker
        setShowTimePicker(true);
      }
    } else {
      if (selected) setTempDate(selected);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set' && selected) {
        setScheduledDate(selected);
      }
    } else {
      if (selected) setTempDate(selected);
    }
  };

  const s = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: C.gray100, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' as any },
    success: { padding: 40, alignItems: 'center' },
    successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.violet100, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    successTitle: { fontSize: 24, fontWeight: '700', color: C.gray900, marginBottom: 8 },
    successSub: { fontSize: 14, color: C.gray500, textAlign: 'center' },
    hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, borderBottomWidth: 1, borderBottomColor: C.gray200 },
    hdrTitle: { fontSize: 20, fontWeight: '700', color: C.gray900 },
    hdrSub: { fontSize: 12, color: C.gray400, marginTop: 2 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.gray200, alignItems: 'center', justifyContent: 'center' },
    body: { paddingHorizontal: 24, paddingTop: 16 },
    label: { fontSize: 10, fontWeight: '700', color: C.gray400, letterSpacing: 1, marginBottom: 8 },
    opt: { padding: 14, borderRadius: 12, borderWidth: 2, borderColor: C.gray200, marginBottom: 8 },
    optActive: { borderColor: C.violet600, backgroundColor: C.violet50 },
    optTxt: { fontWeight: '600', color: C.gray700 },
    optTxtActive: { color: C.violet600 },
    // Date/time picker row
    dtRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
    dtBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: C.gray50, borderRadius: 12, padding: 12,
      borderWidth: 1.5, borderColor: C.gray200,
    },
    dtBtnActive: { borderColor: C.violet600, backgroundColor: C.violet50 },
    dtBtnTxt: { fontSize: 13, fontWeight: '600', color: C.gray500, flex: 1 },
    dtBtnTxtActive: { color: C.violet600 },
    dtClear: { padding: 4 },
    // iOS inline picker container
    iosPickerBox: {
      backgroundColor: C.white, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: C.gray200, marginBottom: 8,
    },
    iosPickerRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.gray100 },
    iosConfirmBtn: {
      flex: 1, paddingVertical: 12, alignItems: 'center',
      backgroundColor: C.violet600, borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    },
    iosConfirmTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
    iosCancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: C.gray100 },
    iosCancelTxt: { color: C.gray600, fontWeight: '600', fontSize: 14 },
    input: { backgroundColor: C.gray50, borderRadius: 12, padding: 12, fontSize: 14, color: C.gray900, marginBottom: 4 },
    inputError: { borderWidth: 1.5, borderColor: C.red600, backgroundColor: C.red50 },
    textarea: { height: 80, textAlignVertical: 'top' as any },
    errorTxt: { fontSize: 12, color: C.red600, marginBottom: 8, marginLeft: 4 },
    charCount: { fontSize: 11, color: C.gray400, textAlign: 'right', marginBottom: 8 },
    charCountWarn: { color: C.amber700 },
    noSkillsBox: { backgroundColor: C.violet50, borderRadius: 12, padding: 14, marginBottom: 8, gap: 10 },
    noSkillsTxt: { fontSize: 13, fontWeight: '600', color: C.violet700 },
    noSkillsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: C.white, borderWidth: 1, borderColor: C.violet200, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    noSkillsBtnTxt: { fontSize: 13, fontWeight: '600', color: C.violet600 },
    footer: { flexDirection: 'row', gap: 12, padding: 24, borderTopWidth: 1, borderTopColor: C.gray200 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: C.gray200, alignItems: 'center' },
    cancelTxt: { fontWeight: '600', color: C.gray700 },
    sendBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: C.violet600, alignItems: 'center' },
    disabled: { opacity: 0.5 },
    sendTxt: { fontWeight: '700', color: '#fff' },
    freeNotice: { backgroundColor: C.violet50, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: C.violet100 },
    freeNoticeTitle: { fontSize: 15, fontWeight: '700', color: C.violet700, marginBottom: 6 },
    freeNoticeHint: { fontSize: 13, color: C.violet600, lineHeight: 19 },
  }), [C]);

  const isIOS = Platform.OS === 'ios';
  const dateLabel = scheduledDate
    ? scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Select date';
  const timeLabel = scheduledDate
    ? scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'Select time';
  const hasDate = scheduledDate !== null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={isIOS ? 'padding' : 'height'}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {success ? (
            <View style={s.success}>
              <View style={s.successIcon}><CheckCircle size={40} color={C.violet600} /></View>
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
                {isFree ? (
                  <View style={s.freeNotice}>
                    <Text style={s.freeNoticeTitle}>🎁 This is a free listing</Text>
                    <Text style={s.freeNoticeHint}>
                      {targetUser} is offering this skill for free — no skill required in return.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={s.label}>I OFFER IN RETURN</Text>
                    {userSkills.length === 0 ? (
                      <View style={s.noSkillsBox}>
                        <Text style={s.noSkillsTxt}>You haven't added any offered skills yet.</Text>
                        {onGoToSkills && (
                          <TouchableOpacity style={s.noSkillsBtn} onPress={() => { onClose(); onGoToSkills(); }}>
                            <PlusCircle size={15} color={C.violet600} />
                            <Text style={s.noSkillsBtnTxt}>Manage Your Skills</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      userSkills.map(skill => (
                        <TouchableOpacity key={skill.id} style={[s.opt, selectedId === skill.id && s.optActive]} onPress={() => { setSelectedId(skill.id); setErrors(e => ({ ...e, skill: undefined })); }}>
                          <Text style={[s.optTxt, selectedId === skill.id && s.optTxtActive]}>{skill.name}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                    {errors.skill && <Text style={s.errorTxt}>{errors.skill}</Text>}
                  </>
                )}

                {/* ── Preferred Date & Time ── */}
                <Text style={[s.label, { marginTop: 16 }]}>PREFERRED DATE & TIME (OPTIONAL)</Text>
                <View style={s.dtRow}>
                  <TouchableOpacity
                    style={[s.dtBtn, hasDate && s.dtBtnActive]}
                    onPress={() => {
                      setTempDate(scheduledDate ?? new Date());
                      setShowTimePicker(false);
                      setShowDatePicker(true);
                    }}
                  >
                    <Calendar size={15} color={hasDate ? C.violet600 : C.gray400} />
                    <Text style={[s.dtBtnTxt, hasDate && s.dtBtnTxtActive]} numberOfLines={1}>{dateLabel}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.dtBtn, hasDate && s.dtBtnActive]}
                    onPress={() => {
                      setTempDate(scheduledDate ?? new Date());
                      setShowDatePicker(false);
                      setShowTimePicker(true);
                    }}
                  >
                    <Clock size={15} color={hasDate ? C.violet600 : C.gray400} />
                    <Text style={[s.dtBtnTxt, hasDate && s.dtBtnTxtActive]} numberOfLines={1}>{timeLabel}</Text>
                  </TouchableOpacity>

                  {hasDate && (
                    <TouchableOpacity style={s.dtClear} onPress={() => { setScheduledDate(null); setShowDatePicker(false); setShowTimePicker(false); }}>
                      <X size={18} color={C.gray400} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Android: native dialogs (shown imperatively) */}
                {!isIOS && showDatePicker && (
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    minimumDate={minDate}
                    onChange={onDateChange}
                  />
                )}
                {!isIOS && showTimePicker && (
                  <DateTimePicker
                    value={tempDate}
                    mode="time"
                    is24Hour={false}
                    onChange={onTimeChange}
                  />
                )}

                {/* iOS: inline picker with confirm/cancel */}
                {isIOS && (showDatePicker || showTimePicker) && (
                  <View style={s.iosPickerBox}>
                    <DateTimePicker
                      value={tempDate}
                      mode={showDatePicker ? 'date' : 'time'}
                      display="spinner"
                      minimumDate={showDatePicker ? minDate : undefined}
                      onChange={(_, selected) => { if (selected) setTempDate(selected); }}
                      style={{ height: 180 }}
                    />
                    <View style={s.iosPickerRow}>
                      <TouchableOpacity style={s.iosCancelBtn} onPress={() => { setShowDatePicker(false); setShowTimePicker(false); }}>
                        <Text style={s.iosCancelTxt}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.iosConfirmBtn}
                        onPress={() => {
                          setScheduledDate(tempDate);
                          if (showDatePicker) { setShowDatePicker(false); setShowTimePicker(true); }
                          else { setShowTimePicker(false); }
                        }}
                      >
                        <Text style={s.iosConfirmTxt}>{showDatePicker ? 'Next: Time →' : 'Confirm'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

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
                <View style={{ height: 16 }} />
              </ScrollView>

              <View style={s.footer}>
                <TouchableOpacity style={s.cancelBtn} onPress={onClose}><Text style={s.cancelTxt}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity
                  style={[s.sendBtn, ((!isFree && !selectedId) || isSubmitting) && s.disabled]}
                  onPress={submit}
                  disabled={(!isFree && !selectedId) || isSubmitting}
                >
                  <Text style={s.sendTxt}>{isSubmitting ? 'Sending...' : 'Send Request'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
