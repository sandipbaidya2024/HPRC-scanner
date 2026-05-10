import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { saveStudentData } from '../utils/database';
import { BCO_FIELDS, CLASS_OPTIONS, FORMATIVE_COLUMNS, LPCD_FIELDS, SUMMATIVE_COLUMNS } from '../utils/reportCard';

export default function EditData() {
  const { data, imageUri } = useLocalSearchParams();
  const router = useRouter();
  
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  
  const parsedStudents = useMemo(() => {
    try {
      return data ? JSON.parse(data) : [{}];
    } catch (e) {
      return [{}];
    }
  }, [data]);

  const [students, setStudents] = useState(parsedStudents);
  const [tab, setTab] = useState('formative');
  const [isSaving, setIsSaving] = useState(false);
  
  const student = students[0] || {};

  const subjects = ['1st Language', '2nd Language', 'Mathematics', 'Our Environment', 'Art & Work Education', 'Health & Physical Education'];

  const updateMark = (type, subject, column, value) => {
    setStudents((current) => {
      const next = JSON.parse(JSON.stringify(current));
      if (!next[0][type]) next[0][type] = {};
      if (!next[0][type][subject]) next[0][type][subject] = {};
      next[0][type][subject][column] = value;
      return next;
    });
  };

  const updateAssessment = (type, field, phase, value) => {
    setStudents((current) => {
      const next = JSON.parse(JSON.stringify(current));
      if (!next[0][type]) next[0][type] = {};
      if (!next[0][type][field]) next[0][type][field] = {};
      next[0][type][field][phase] = value;
      return next;
    });
  };

  const getFormativeTotal = (column) => {
    return subjects.reduce((sum, subject) => {
      const value = parseInt(student.formative?.[subject]?.[column] || '0', 10);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  };

const handleSave = async () => {
    setIsSaving(true);
    
    // database.js এর নতুন লজিক অনুযায়ী আইডি এবং সময় যোগ করা হচ্ছে
    const studentToSave = {
      ...student,
      id: student.id || Date.now(), // যদি নতুন স্টুডেন্ট হয় তবে নতুন আইডি তৈরি হবে
      savedAt: new Date().toISOString(),
    };

    const success = await saveStudentData(studentToSave);
    setIsSaving(false);
    
    if (success) {
      Alert.alert(
        "সফল", 
        "ছাত্রের তথ্য সঠিকভাবে সেভ করা হয়েছে!",
        [
          { 
            text: "হোমে যান", 
            onPress: () => router.replace('/'),
            style: "default"
          },
          { 
            text: "নতুন স্ক্যান", 
            onPress: () => router.push('/scan'),
            style: "default"
          }
        ]
      );
    } else {
      Alert.alert("ত্রুটি", "ডেটা সেভ করা সম্ভব হয়নি। দয়া করে আবার চেষ্টা করুন।");
    }
  };

  const handleScanAnother = () => {
    router.push('/scan');
  };

  // Render Student Info with EDITABLE Class and Section
  const renderStudentInfo = () => (
    <View style={styles.infoContainer}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Name:</Text>
        <TextInput 
          style={styles.infoValue} 
          value={student.name || ''} 
          onChangeText={(text) => {
            setStudents(prev => {
              const next = [...prev];
              next[0] = { ...next[0], name: text };
              return next;
            });
          }}
          placeholder="Student Name"
        />
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Roll:</Text>
        <TextInput 
          style={styles.infoValueSmall} 
          value={student.roll || ''} 
          onChangeText={(text) => {
            setStudents(prev => {
              const next = [...prev];
              next[0] = { ...next[0], roll: text };
              return next;
            });
          }}
          placeholder="Roll"
          keyboardType="numeric"
        />
        
        <Text style={styles.infoLabel}>Class:</Text>
        <View style={styles.classSelector}>
          {CLASS_OPTIONS.map(cls => (
            <TouchableOpacity
              key={cls}
              style={[styles.classChip, student.class === cls && styles.classChipActive]}
              onPress={() => {
                setStudents(prev => {
                  const next = [...prev];
                  next[0] = { ...next[0], class: cls };
                  return next;
                });
              }}
            >
              <Text style={[styles.classChipText, student.class === cls && styles.classChipTextActive]}>
                {cls}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Section:</Text>
        <View style={styles.sectionSelector}>
          {['A', 'B', 'C', 'D'].map(sec => (
            <TouchableOpacity
              key={sec}
              style={[styles.sectionChip, student.section === sec && styles.sectionChipActive]}
              onPress={() => {
                setStudents(prev => {
                  const next = [...prev];
                  next[0] = { ...next[0], section: sec };
                  return next;
                });
              }}
            >
              <Text style={[styles.sectionChipText, student.section === sec && styles.sectionChipTextActive]}>
                {sec}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderVerification = () => {
    const missingSubjects = subjects.filter(sub => {
      const marks = student.formative?.[sub];
      return !marks || Object.values(marks).every(v => v === '');
    });

    return (
      <View style={styles.verifyCard}>
        <Text style={styles.verifyTitle}>📋 Verification:</Text>
        {missingSubjects.length > 0 ? (
          <Text style={styles.errorText}>Missing: {missingSubjects.join(', ')}</Text>
        ) : (
          <Text style={styles.successText}>✅ All subjects data extracted!</Text>
        )}
      </View>
    );
  };

  const renderFormativeTab = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View style={{ minWidth: 800 }}>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.subjectCell]}>Subject</Text>
          {FORMATIVE_COLUMNS.map((column) => (
            <Text key={column} style={styles.cell}>{column}</Text>
          ))}
        </View>

        {subjects.map((subject) => (
          <View key={subject} style={styles.row}>
            <Text style={[styles.cell, styles.subjectCell]}>{subject}</Text>
            {FORMATIVE_COLUMNS.map((column) => (
              <TextInput
                key={column}
                style={styles.inputCell}
                keyboardType="numeric"
                value={student.formative?.[subject]?.[column] || ''}
                onChangeText={(value) => updateMark('formative', subject, column, value)}
                placeholder="-"
              />
            ))}
          </View>
        ))}

        <View style={[styles.row, styles.totalRow]}>
          <Text style={[styles.cell, styles.subjectCell, styles.totalLabel]}>Total</Text>
          {FORMATIVE_COLUMNS.map((column) => (
            <Text key={column} style={[styles.cell, styles.total]}>
              {String(getFormativeTotal(column))}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderSummativeTab = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View style={{ minWidth: 500 }}>
        <View style={[styles.row, styles.summativeHeaderRow]}>
          <Text style={[styles.cell, styles.subjectCell]}>Subject</Text>
          {SUMMATIVE_COLUMNS.map((column) => (
            <Text key={column} style={styles.cell}>{column}</Text>
          ))}
        </View>

        {subjects.map((subject) => (
          <View key={subject} style={styles.row}>
            <Text style={[styles.cell, styles.subjectCell]}>{subject}</Text>
            {SUMMATIVE_COLUMNS.map((column) => (
              <TextInput
                key={column}
                style={styles.inputCell}
                keyboardType="numeric"
                value={student.summative?.[subject]?.[column] || ''}
                onChangeText={(value) => updateMark('summative', subject, column, value)}
                placeholder="-"
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderLPCDTab = () => (
    <ScrollView style={styles.assessmentContainer}>
      <Text style={styles.assessmentTitle}>Life Skills & Character Development</Text>
      {LPCD_FIELDS.map((field) => (
        <View key={field} style={styles.assessmentCard}>
          <Text style={styles.assessmentField}>{field}</Text>
          <View style={styles.phaseContainer}>
            {['formative1', 'formative2', 'formative3'].map((phase, idx) => (
              <View key={phase} style={styles.phaseItem}>
                <Text style={styles.phaseLabel}>
                  {idx === 0 ? '1st Phase' : idx === 1 ? '2nd Phase' : '3rd Phase'}
                </Text>
                <TextInput
                  style={styles.textAreaInput}
                  value={student.lpcd?.[field]?.[phase] || ''}
                  onChangeText={(value) => updateAssessment('lpcd', field, phase, value)}
                  placeholder="Enter description..."
                  multiline
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderBCOTab = () => (
    <ScrollView style={styles.assessmentContainer}>
      <Text style={styles.assessmentTitle}>Behavioral Conduct & Outlook</Text>
      {BCO_FIELDS.map((field) => (
        <View key={field} style={styles.assessmentCard}>
          <Text style={styles.assessmentField}>{field}</Text>
          <View style={styles.phaseContainer}>
            {['formative1', 'formative2', 'formative3'].map((phase, idx) => (
              <View key={phase} style={styles.phaseItem}>
                <Text style={styles.phaseLabel}>
                  {idx === 0 ? '1st Phase' : idx === 1 ? '2nd Phase' : '3rd Phase'}
                </Text>
                <TextInput
                  style={styles.gradeInput}
                  value={student.bco?.[field]?.[phase] || ''}
                  onChangeText={(value) => updateAssessment('bco', field, phase, value)}
                  placeholder="A/B/C/D"
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {renderStudentInfo()}
      {renderVerification()}
      
      <View style={styles.tabBar}>
        {['formative', 'summative', 'lpcd', 'bco'].map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.activeTab]}>
            <Text style={[styles.tabText, tab === t && styles.activeTabText]}>{t.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {imageUri && imageUri !== 'undefined' && (
          <TouchableOpacity 
            style={styles.previewCard} 
            onPress={() => setImagePreviewVisible(true)}
            activeOpacity={0.9}
          >
            <Text style={styles.previewTitle}>📷 Scanned Image Preview (Tap to enlarge)</Text>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            <Text style={styles.previewHint}>👆 Tap image to view full screen</Text>
          </TouchableOpacity>
        )}

        {tab === 'formative' && renderFormativeTab()}
        {tab === 'summative' && renderSummativeTab()}
        {tab === 'lpcd' && renderLPCDTab()}
        {tab === 'bco' && renderBCOTab()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>💾 Save Student Data</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.scanAnotherBtn} onPress={handleScanAnother}>
          <Text style={styles.btnText}>📷 Scan Another</Text>
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Preview Modal */}
      <Modal
        visible={imagePreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setImagePreviewVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => setImagePreviewVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Image 
                  source={{ uri: imageUri }} 
                  style={styles.fullScreenImage} 
                  resizeMode="contain"
                />
                <Text style={styles.modalHint}>Tap anywhere to close</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  infoContainer: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#333', minWidth: 50 },
  infoValue: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#fff' },
  infoValueSmall: { width: 60, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#fff', textAlign: 'center' },
  classSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  classChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, backgroundColor: '#e0e0e0' },
  classChipActive: { backgroundColor: '#1a73e8' },
  classChipText: { fontSize: 12, color: '#666' },
  classChipTextActive: { color: '#fff', fontWeight: 'bold' },
  sectionSelector: { flexDirection: 'row', gap: 8 },
  sectionChip: { width: 40, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e0e0e0', alignItems: 'center' },
  sectionChipActive: { backgroundColor: '#1a73e8' },
  sectionChipText: { fontSize: 14, color: '#666' },
  sectionChipTextActive: { color: '#fff', fontWeight: 'bold' },
  verifyCard: { margin: 10, padding: 12, borderRadius: 8, backgroundColor: '#fffbe6', borderWidth: 1, borderColor: '#ffe58f' },
  verifyTitle: { fontWeight: 'bold', color: '#856404', marginBottom: 4 },
  errorText: { color: '#d93025', fontSize: 13 },
  successText: { color: '#188038', fontSize: 13 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 5 },
  tab: { flex: 1, padding: 10, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#1a73e8' },
  tabText: { fontSize: 12, color: '#666' },
  activeTabText: { color: '#1a73e8', fontWeight: 'bold' },
  scrollContent: { paddingBottom: 100 },
  previewCard: { 
    margin: 12, 
    padding: 12, 
    borderRadius: 12, 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  previewTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  previewImage: { width: '100%', height: 200, backgroundColor: '#f0f0f0', borderRadius: 8 },
  previewHint: { fontSize: 11, color: '#999', marginTop: 8 },
  row: { flexDirection: 'row' },
  headerRow: { backgroundColor: '#E3F2FD' },
  summativeHeaderRow: { backgroundColor: '#E8F5E9' },
  totalRow: { backgroundColor: '#FFF3E0' },
  cell: { width: 65, padding: 10, borderWidth: 1, borderColor: '#ddd', textAlign: 'center', fontSize: 11, backgroundColor: '#fff' },
  subjectCell: { width: 180, textAlign: 'left', fontWeight: '500' },
  inputCell: { width: 65, borderWidth: 1, borderColor: '#ddd', textAlign: 'center', padding: 10, fontSize: 13, backgroundColor: '#fff' },
  total: { fontWeight: 'bold', backgroundColor: '#FFF3E0' },
  totalLabel: { fontWeight: 'bold', backgroundColor: '#FFF3E0' },
  assessmentContainer: { padding: 15 },
  assessmentTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  assessmentCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e0e0e0' },
  assessmentField: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  phaseContainer: { flexDirection: 'row', gap: 10 },
  phaseItem: { flex: 1 },
  phaseLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  gradeInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, textAlign: 'center' },
  textAreaInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, minHeight: 60, textAlignVertical: 'top' },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    padding: 15, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderTopColor: '#eee',
    flexDirection: 'row',
    gap: 10,
  },
  saveBtn: { 
    flex: 1,
    backgroundColor: '#1a73e8', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  scanAnotherBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  modalHint: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});