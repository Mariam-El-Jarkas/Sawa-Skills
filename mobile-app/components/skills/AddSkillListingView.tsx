import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, ScrollView, FlatList } from 'react-native';
import { ArrowLeft, Check, ChevronDown, Globe, MapPin } from 'lucide-react-native';
import { C } from '../theme';

interface Props {
  addMode: 'listing' | 'offer' | 'want';
  onBack: () => void;
  isSaving: boolean;
  formErrors: Record<string, string>;
  newListing: { offer: string; want: string; location: string; availability: 'Remote' | 'On-site' };
  onNewListingChange: (field: string, value: string) => void;
  onSubmitListing: () => void;
  newSkill: { name: string; description: string; category: string };
  onNewSkillChange: (field: string, value: string) => void;
  onSubmitSkill: () => void;
}

const LEBANON_LOCATIONS = [
  'Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Zahle', 
  'Byblos (Jbeil)', 'Jounieh', 'Baabda', 'Aley', 'Chouf', 
  'Batroun', 'Zgharta', 'Bsharri', 'Keserwan', 'Akkar'
].sort();

export function AddSkillListingView({
  addMode, onBack, isSaving, formErrors,
  newListing, onNewListingChange, onSubmitListing,
  newSkill, onNewSkillChange, onSubmitSkill
}: Props) {
  const [showLocPicker, setShowLocPicker] = useState(false);

  const getTitle = () => {
    if (addMode === 'listing') return 'Create Exchange Listing';
    if (addMode === 'offer') return 'Add Skill to Offer';
    return 'Add Skill to Learn';
  };

  const handleSelectLoc = (loc: string) => {
    onNewListingChange('location', loc);
    setShowLocPicker(false);
  };

  return (
    <View style={s.addView}>
      <View style={s.addHeader}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}><ArrowLeft size={20} color={C.gray700} /></TouchableOpacity>
        <Text style={s.addTitle}>{getTitle()}</Text>
      </View>
      <View style={s.addForm}>
        {addMode === 'listing' ? (
          <>
            <View style={s.section}>
              <Text style={s.fieldLabel}>AVAILABILITY *</Text>
              <View style={s.toggleRow}>
                {(['Remote', 'On-site'] as const).map(mode => (
                  <TouchableOpacity 
                    key={mode} 
                    style={[s.toggleBtn, newListing.availability === mode && s.toggleBtnActive]}
                    onPress={() => onNewListingChange('availability', mode)}
                  >
                    {mode === 'Remote' ? <Globe size={16} color={newListing.availability === mode ? C.white : C.gray500} /> : <MapPin size={16} color={newListing.availability === mode ? C.white : C.gray500} />}
                    <Text style={[s.toggleBtnTxt, newListing.availability === mode && s.toggleBtnTxtActive]}>{mode}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {newListing.availability === 'On-site' && (
              <View style={s.section}>
                <Text style={s.fieldLabel}>LOCATION *</Text>
                <TouchableOpacity 
                  style={[s.locSelector, formErrors.location && s.fieldInputError]} 
                  onPress={() => setShowLocPicker(true)}
                >
                  <Text style={[s.locValue, !newListing.location && { color: C.gray400 }]}>
                    {newListing.location || 'Select an area in Lebanon'}
                  </Text>
                  <ChevronDown size={18} color={C.gray400} />
                </TouchableOpacity>
                {formErrors.location && <Text style={s.fieldError}>{formErrors.location}</Text>}
              </View>
            )}

            <View style={s.section}>
              <Text style={s.fieldLabel}>I AM OFFERING *</Text>
              <TextInput
                style={[s.fieldInput, formErrors.offer && s.fieldInputError]}
                value={newListing.offer}
                onChangeText={v => onNewListingChange('offer', v)}
                placeholder="e.g. Photography lessons"
                placeholderTextColor={C.gray400}
              />
              {formErrors.offer && <Text style={s.fieldError}>{formErrors.offer}</Text>}
            </View>

            <View style={s.section}>
              <Text style={s.fieldLabel}>I AM LOOKING FOR *</Text>
              <TextInput
                style={[s.fieldInput, formErrors.want && s.fieldInputError]}
                value={newListing.want}
                onChangeText={v => onNewListingChange('want', v)}
                placeholder="e.g. Web Design"
                placeholderTextColor={C.gray400}
              />
              {formErrors.want && <Text style={s.fieldError}>{formErrors.want}</Text>}
            </View>

            <TouchableOpacity style={[s.publishBtn, isSaving && s.publishBtnDisabled]} onPress={onSubmitListing} disabled={isSaving}>
              <Text style={s.publishBtnTxt}>{isSaving ? 'Publishing...' : 'Publish Listing'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.section}>
            <Text style={s.fieldLabel}>SKILL NAME *</Text>
            <TextInput
              style={[s.fieldInput, formErrors.name ? s.fieldInputError : null]}
              value={newSkill.name}
              onChangeText={v => onNewSkillChange('name', v)}
              placeholder="e.g. Graphic Design"
              placeholderTextColor={C.gray400}
              maxLength={100}
            />
            {formErrors.name && <Text style={s.fieldError}>{formErrors.name}</Text>}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>SHORT DESCRIPTION</Text>
            <TextInput
              style={[s.fieldInput, s.textarea, formErrors.description ? s.fieldInputError : null]}
              value={newSkill.description}
              onChangeText={v => onNewSkillChange('description', v)}
              placeholder="Briefly describe..."
              multiline
              placeholderTextColor={C.gray400}
              maxLength={300}
            />
            <Text style={[s.fieldLabel, { textAlign: 'right', marginTop: -8 }]}>{newSkill.description.length}/300</Text>
            {formErrors.description && <Text style={s.fieldError}>{formErrors.description}</Text>}
            <TouchableOpacity style={[s.publishBtn, isSaving && s.publishBtnDisabled]} onPress={onSubmitSkill} disabled={isSaving}>
              <Text style={s.publishBtnTxt}>{isSaving ? 'Saving...' : 'Save to Profile'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={showLocPicker} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Area</Text>
              <TouchableOpacity onPress={() => setShowLocPicker(false)} style={s.closeBtn}>
                <Text style={s.closeBtnTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={LEBANON_LOCATIONS}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.locItem} onPress={() => handleSelectLoc(item)}>
                  <Text style={[s.locItemTxt, newListing.location === item && s.locItemTxtActive]}>{item}</Text>
                  {newListing.location === item && <Check size={18} color={C.violet600} />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={s.separator} />}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  addView: { gap: 16 },
  addHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 8, backgroundColor: C.gray100, borderRadius: 20 },
  addTitle: { fontSize: 17, fontWeight: '700', color: C.gray900, flex: 1 },
  addForm: { backgroundColor: C.white, borderRadius: 20, padding: 20, gap: 20, borderWidth: 1, borderColor: C.gray100 },
  section: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.gray400, letterSpacing: 1 },
  fieldInput: { backgroundColor: C.gray50, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: '600', color: C.gray900 },
  fieldInputError: { borderWidth: 1.5, borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  fieldError: { fontSize: 11, color: '#DC2626', marginTop: 2, marginLeft: 4 },
  textarea: { height: 72, textAlignVertical: 'top' },
  
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, backgroundColor: C.gray50, borderWidth: 1, borderColor: C.gray100 },
  toggleBtnActive: { backgroundColor: C.violet600, borderColor: C.violet600 },
  toggleBtnTxt: { fontSize: 13, fontWeight: '600', color: C.gray600 },
  toggleBtnTxtActive: { color: C.white },

  locSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.gray50, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.gray100 },
  locValue: { fontSize: 14, fontWeight: '600', color: C.gray900 },

  publishBtn: { backgroundColor: C.violet600, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  publishBtnDisabled: { opacity: 0.6 },
  publishBtnTxt: { color: C.white, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.gray900 },
  closeBtn: { padding: 4 },
  closeBtnTxt: { color: C.violet600, fontWeight: '600' },
  
  locItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  locItemTxt: { fontSize: 15, color: C.gray700 },
  locItemTxtActive: { color: C.violet600, fontWeight: '600' },
  separator: { height: 1, backgroundColor: C.gray50, marginHorizontal: 18 },
});
