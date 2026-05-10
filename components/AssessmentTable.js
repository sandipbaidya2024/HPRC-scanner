import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { GRADE_OPTIONS, PHASE_COLUMNS } from '../utils/reportCard';

function GradeCell({ value, onChange }) {
  return (
    <View style={styles.gradeCellContent}>
      <TextInput
        autoCapitalize="characters"
        maxLength={1}
        placeholder="A-D"
        placeholderTextColor="#94a3b8"
        style={styles.gradeInput}
        value={value}
        onChangeText={(nextValue) => onChange(nextValue.toUpperCase().replace(/[^ABCD]/g, ''))}
      />
      <View style={styles.chipRow}>
        {GRADE_OPTIONS.map((grade) => {
          const active = value === grade;

          return (
            <Pressable
              key={grade}
              style={[styles.gradeChip, active && styles.gradeChipActive]}
              onPress={() => onChange(grade)}>
              <Text style={[styles.gradeChipText, active && styles.gradeChipTextActive]}>{grade}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AssessmentTable({ title, rows, values, onChange, mode = 'text' }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.headerCell, styles.itemHeaderCell]}>Item</Text>
            {PHASE_COLUMNS.map((phase) => (
              <Text key={phase.key} style={styles.headerCell}>
                {phase.label}
              </Text>
            ))}
          </View>

          {rows.map((rowLabel) => (
            <View key={rowLabel} style={styles.row}>
              <View style={styles.itemCell}>
                <Text style={styles.itemText}>{rowLabel}</Text>
              </View>

              {PHASE_COLUMNS.map((phase) => (
                <View
                  key={`${rowLabel}-${phase.key}`}
                  style={[styles.valueCell, mode === 'text' ? styles.valueCellTall : styles.valueCellCompact]}>
                  {mode === 'text' ? (
                    <TextInput
                      multiline
                      textAlignVertical="top"
                      placeholder="Enter description"
                      placeholderTextColor="#94a3b8"
                      style={styles.multilineInput}
                      value={values?.[rowLabel]?.[phase.key] ?? ''}
                      onChangeText={(nextValue) => onChange(rowLabel, phase.key, nextValue)}
                    />
                  ) : (
                    <GradeCell
                      value={values?.[rowLabel]?.[phase.key] ?? ''}
                      onChange={(nextValue) => onChange(rowLabel, phase.key, nextValue)}
                    />
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  table: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    backgroundColor: '#dbeafe',
  },
  headerCell: {
    width: 180,
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#94a3b8',
    textAlign: 'center',
    color: '#1e3a8a',
    fontWeight: '700',
    fontSize: 13,
  },
  itemHeaderCell: {
    width: 190,
  },
  itemCell: {
    width: 190,
    minHeight: 76,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  itemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  valueCell: {
    width: 180,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#94a3b8',
    backgroundColor: '#fff',
  },
  valueCellTall: {
    minHeight: 116,
  },
  valueCellCompact: {
    minHeight: 108,
  },
  multilineInput: {
    flex: 1,
    minHeight: 114,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#0f172a',
  },
  gradeCellContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
  },
  gradeInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  gradeChip: {
    minWidth: 32,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  gradeChipActive: {
    backgroundColor: '#2563eb',
  },
  gradeChipText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  gradeChipTextActive: {
    color: '#fff',
  },
});
