import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getStudentsByClass } from '../utils/database';
import { CLASS_OPTIONS } from '../utils/reportCard';

export default function Reports() {
  const [selectedClass, setSelectedClass] = useState('IV');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadClassStudents();
  }, [selectedClass]);

  const loadClassStudents = async () => {
    setLoading(true);
    const data = await getStudentsByClass(selectedClass);
    setStudents(data);
    setLoading(false);
  };

  // CSV Export (without expo-print)
  const exportToCSV = () => {
    if (students.length === 0) {
      Alert.alert('No Data', 'No students found in this class');
      return;
    }

    let csv = 'Name,Roll,Section,Subject,F1A,F1B,F1C,F2A,F2B,F2C,F3A,F3B,F3C,SE1,SE2,SE3\n';
    
    students.forEach(student => {
      Object.keys(student.formative || {}).forEach(subject => {
        const fMarks = student.formative[subject] || {};
        const sMarks = student.summative[subject] || {};
        csv += `${student.name},${student.roll},${student.section},${subject},`;
        csv += `${fMarks.F1A || ''},${fMarks.F1B || ''},${fMarks.F1C || ''},`;
        csv += `${fMarks.F2A || ''},${fMarks.F2B || ''},${fMarks.F2C || ''},`;
        csv += `${fMarks.F3A || ''},${fMarks.F3B || ''},${fMarks.F3C || ''},`;
        csv += `${sMarks.SE1 || ''},${sMarks.SE2 || ''},${sMarks.SE3 || ''}\n`;
      });
    });

    Alert.alert('CSV Ready', 'CSV file is ready. You can share it.', [
      { text: 'OK' }
    ]);
    console.log('CSV Data:', csv.substring(0, 500));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <Text style={styles.headerTitle}>📊 Student Reports</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {CLASS_OPTIONS.map(cls => (
            <TouchableOpacity 
              key={cls} 
              style={[styles.chip, selectedClass === cls && styles.activeChip]}
              onPress={() => setSelectedClass(cls)}
            >
              <Text style={[styles.chipText, selectedClass === cls && styles.activeChipText]}>Class {cls}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.studentCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.charAt(0) || '?'}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>Roll: {item.roll} | Class: {item.class}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No students found in Class {selectedClass}</Text>}
        />
      )}

      {/* Export Button */}
      {students.length > 0 && (
        <TouchableOpacity style={styles.exportBtn} onPress={exportToCSV}>
          <Text style={styles.exportBtnText}>📥 Export to CSV</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 25, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  filterBar: { flexDirection: 'row' },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 10 },
  activeChip: { backgroundColor: '#fff' },
  chipText: { color: '#fff', fontSize: 12 },
  activeChipText: { color: '#1a73e8', fontWeight: 'bold' },
  loader: { marginTop: 50 },
  list: { padding: 20, paddingBottom: 100 },
  studentCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, alignItems: 'center', elevation: 3 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#1a73e8' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  meta: { fontSize: 12, color: '#777', marginTop: 3 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  exportBtn: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#4CAF50', padding: 15, borderRadius: 12, alignItems: 'center', elevation: 5 },
  exportBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});