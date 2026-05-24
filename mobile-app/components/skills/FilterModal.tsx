import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  categories: string[];
  selectedCat: string;
  onSelectCat: (cat: string) => void;
  availFilter: 'All' | 'Remote' | 'On-site';
  onSelectAvail: (avail: 'All' | 'Remote' | 'On-site') => void;
  onReset: () => void;
  onApply: () => void;
}

export function FilterModal({
  isVisible, onClose, categories, selectedCat, onSelectCat,
  availFilter, onSelectAvail, onReset, onApply
}: Props) {
  const { C } = useTheme();

  const s = useMemo(() => StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    filterSheet: { backgroundColor: C.gray100, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    filterHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    filterTitle: { fontSize: 20, fontWeight: '700', color: C.gray900 },
    filterLabel: { fontSize: 11, fontWeight: '700', color: C.gray400, letterSpacing: 1, marginBottom: 10 },
    filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterOpt: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: C.gray200 },
    filterOptActive: { backgroundColor: C.violet600 },
    filterOptTxt: { fontWeight: '700', fontSize: 13, color: C.gray600 },
    filterOptTxtActive: { color: '#fff' },
    availRow: { flexDirection: 'row', gap: 8 },
    availOpt: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: C.gray200, alignItems: 'center', backgroundColor: C.gray50 },
    availOptActive: { borderColor: C.violet600, backgroundColor: C.violet50 },
    availTxt: { fontWeight: '700', fontSize: 13, color: C.gray500 },
    availTxtActive: { color: C.violet600 },
    filterFooter: { flexDirection: 'row', gap: 12, marginTop: 20 },
    clearBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.gray200, alignItems: 'center' },
    clearBtnTxt: { color: C.gray700, fontWeight: '700', fontSize: 15 },
    applyBtn: { flex: 2, backgroundColor: C.violet600, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    applyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  }), [C]);

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={s.filterSheet}>
          <View style={s.filterHdr}>
            <Text style={s.filterTitle}>Filter Skills</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={C.gray700} /></TouchableOpacity>
          </View>

          <Text style={s.filterLabel}>CATEGORY</Text>
          <View style={s.filterGrid}>
            {categories.map(cat => (
              <TouchableOpacity key={cat} style={[s.filterOpt, selectedCat === cat && s.filterOptActive]} onPress={() => onSelectCat(cat)}>
                <Text style={[s.filterOptTxt, selectedCat === cat && s.filterOptTxtActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.filterLabel, { marginTop: 16 }]}>AVAILABILITY</Text>
          <View style={s.availRow}>
            {(['All', 'Remote', 'On-site'] as const).map(t => (
              <TouchableOpacity key={t} style={[s.availOpt, availFilter === t && s.availOptActive]} onPress={() => onSelectAvail(t)}>
                <Text style={[s.availTxt, availFilter === t && s.availTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.filterFooter}>
            <TouchableOpacity style={s.clearBtn} onPress={onReset}>
              <Text style={s.clearBtnTxt}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.applyBtn} onPress={onApply}>
              <Text style={s.applyBtnTxt}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
