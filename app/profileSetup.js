import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { saveProfile } from '../utils/database';

export default function ProfileSetup() {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!teacherName.trim()) {
      Alert.alert('Information Needed', 'Please enter your name');
      return;
    }
    if (!schoolName.trim()) {
      Alert.alert('Information Needed', 'Please enter your school name');
      return;
    }

    setLoading(true);
    try {
      const success = await saveProfile({
        teacherName: teacherName.trim(),
        schoolName: schoolName.trim(),
        createdAt: new Date().toISOString(),
      });
      
      if (success) {
        Alert.alert('Welcome!', `Thank you ${teacherName}. Let's start scanning!`, [
          { text: 'Get Started', onPress: () => router.replace('/') }
        ]);
      } else {
        Alert.alert('Error', 'Failed to save profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <Text style={styles.icon}>📚</Text>
          <Text style={styles.title}>Welcome to HPRC Scanner</Text>
          <Text style={styles.subtitle}>Let's setup your profile</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>👨‍🏫 Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mr. Sandip Baidya"
              placeholderTextColor="#999"
              value={teacherName}
              onChangeText={setTeacherName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>🏫 School Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Bagu Junior Basic School"
              placeholderTextColor="#999"
              value={schoolName}
              onChangeText={setSchoolName}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Start Scanning →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 24,
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a73e8',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});