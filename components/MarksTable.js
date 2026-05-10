import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MARK_COLUMNS } from '../utils/reportCard';

export default function MarksTable({ subjects, marks, onChangeMark }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.headerCell, styles.subjectCell]}>Subject</Text>
          {MARK_COLUMNS.map((column) => (
            <Text key={column} style={styles.headerCell}>
              {column}
            </Text>
          ))}
        </View>

        {subjects.map((subject) => (
          <View key={subject} style={styles.row}>
            <Text style={[styles.subjectCell, styles.subjectText]}>{subject}</Text>
            {MARK_COLUMNS.map((column) => (
              <TextInput
                key={`${subject}-${column}`}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="-"
                placeholderTextColor="#9ca3af"
                style={styles.inputCell}
                value={marks?.[subject]?.[column] ?? ''}
                onChangeText={(value) => onChangeMark(subject, column, value.replace(/[^\d]/g, ''))}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    backgroundColor: '#dbeafe',
  },
  headerCell: {
    width: 74,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  subjectCell: {
    width: 180,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  subjectText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  inputCell: {
    width: 74,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    textAlign: 'center',
    fontSize: 13,
    color: '#0f172a',
  },
});
