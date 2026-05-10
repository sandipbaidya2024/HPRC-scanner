import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getStudentById } from '../utils/database';

export default function StudentDetails() {
  const { id } = useLocalSearchParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, []);

  const loadStudent = async () => {
    const data = await getStudentById(id);
    setStudent(data);
    setLoading(false);
  };

  if (loading) return <ActivityIndicator size="large" />;
  if (!student) return <Text>Student not found</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{student.name}</Text>
      <Text>Class: {student.class} | Roll: {student.roll} | Section: {student.section}</Text>
      
      <Text style={styles.subtitle}>Formative Marks:</Text>
      {Object.keys(student.formative || {}).map((subject) => (
        <View key={subject} style={styles.card}>
          <Text style={styles.month}>{subject}</Text>
          <Text>F1A: {student.formative[subject].F1A}</Text>
          <Text>F1B: {student.formative[subject].F1B}</Text>
          {/* Add more columns as needed */}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  card: { padding: 10, marginBottom: 10, backgroundColor: '#f1f8e9', borderRadius: 8 },
  month: { fontWeight: 'bold' }
});