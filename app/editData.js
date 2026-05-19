import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { getStudents, saveStudentData } from '../utils/database';
import { BCO_FIELDS, CLASS_OPTIONS, DPLS_FIELDS, FORMATIVE_COLUMNS, LPCD_FIELDS, SUMMATIVE_COLUMNS } from '../utils/reportCard';

export default function EditData() {
  const { data, imageUri } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const parsedStudents = useMemo(() => {
    try {
      return data ? JSON.parse(data) : [{}];
    } catch (e) {
      return [{}];
    }
  }, [data]);

  const [students, setStudents] = useState(parsedStudents);
  const student = students[0] || {};
  const originalStudent = parsedStudents[0] || {};

 const allSubjects = ['1st Language', '2nd Language', 'Mathematics', 'Our Environmental', 'Art & Work Education', 'Health & Physical Education'];
const filteredSubjects = allSubjects;


useEffect(() => {
  // চেক করুন student এ কোনো ডাটা আছে কিনা
  const hasAnyData = () => {
    // নাম বা রোল থাকলে
    if (student.name || student.roll) return true;
    // ফরমেটিভ মার্কস থাকলে
    if (Object.keys(student.formative || {}).length > 0) return true;
    // সামষ্টিক মার্কস থাকলে
    if (Object.keys(student.summative || {}).length > 0) return true;
    // LPCD ডাটা থাকলে
    if (Object.keys(student.lpcd || {}).length > 0) return true;
    // BCO ডাটা থাকলে
    if (Object.keys(student.bco || {}).length > 0) return true;
    // DPLS ডাটা থাকলে
    if (Object.keys(student.dpls || {}).length > 0) return true;
    return false;
  };
  
  const hasChanges = hasAnyData();
  console.log("🔴 hasUnsavedChanges:", hasChanges);
  setHasUnsavedChanges(hasChanges);
}, [student]);

 useEffect(() => {
  const backAction = () => {
    if (hasUnsavedChanges) {
      showLeaveWarning();  // ✅ এই লাইনটি থাকতে হবে
      return true;
    }
    return false;
  };
  const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  return () => backHandler.remove();
}, [hasUnsavedChanges]);

useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', (e) => {
    if (!hasUnsavedChanges) return;
    
    // Alert সরাসরি দেখান
    Alert.alert(
      "⚠️ Warning: Data Loss!",
      "You have unsaved data. Do you want to save before leaving?",
      [
        { text: "Save", onPress: () => handleSaveAndNavigateBack() },
        { text: "Discard", style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
        { text: "Stay", style: "cancel", onPress: () => {} }
      ]
    );
  });
  return unsubscribe;
}, [navigation, hasUnsavedChanges]);

const showLeaveWarning = () => {
  setShowExitWarning(true);
};
 const handleSaveAndNavigateBack = async () => {
  if (!student.roll || !student.class) {
    Alert.alert("Missing Info", "Please set roll number and class.");
    return;
  }
  setIsSaving(true);
  try {
    const allStudents = await getStudents();
    const existingStudent = allStudents.find(s =>
      String(s.roll) === String(student.roll) && s.class === student.class
    );
    const studentToSave = {
      id: existingStudent?.id || Date.now(),
      name: student.name || '',
      class: student.class,
      roll: student.roll,
      section: student.section || '',
      subjects: student.subjects || [],
      formative: student.formative || {},
      summative: student.summative || {},
      lpcd: student.lpcd || {},
      bco: student.bco || {},
      dpls: student.dpls || {},
      imageUri: imageUri || '',
      savedAt: new Date().toISOString()
    };
    const success = await saveStudentData(studentToSave);
    setIsSaving(false);
    if (success) {
      setHasUnsavedChanges(false);
      Alert.alert("Success!", "Data saved successfully.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Error", "Failed to save data.");
    }
  } catch (error) {
    setIsSaving(false);
    Alert.alert("Error", "Save failed: " + error.message);
  }
};
  const handleSave = async () => {
    if (!student.roll || !student.class) {
      Alert.alert("তথ্য নেই", "দয়া করে রোল নম্বর এবং ক্লাস সেট করুন।");
      return;
    }
    setIsSaving(true);
    try {
      const allStudents = await getStudents();
      const existingStudent = allStudents.find(s =>
        String(s.roll) === String(student.roll) && s.class === student.class
      );
      const studentToSave = {
        id: existingStudent?.id || Date.now(),
        name: student.name || '',
        class: student.class,
        roll: student.roll,
        section: student.section || '',
        subjects: student.subjects || allSubjects,
        formative: student.formative || {},
        summative: student.summative || {},
        lpcd: student.lpcd || {},
        bco: student.bco || {},
        dpls: student.dpls || {},
        imageUri: imageUri || '',
        savedAt: new Date().toISOString()
      };
      const success = await saveStudentData(studentToSave);
      setIsSaving(false);
      if (success) {
        setHasUnsavedChanges(false);
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 2000);
      } else {
        Alert.alert("ত্রুটি", "ডেটা সেভ করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
      }
    } catch (error) {
      setIsSaving(false);
      Alert.alert("ত্রুটি", "সেভ করার সময় সমস্যা হয়েছে: " + error.message);
    }
  };

  const handleScanAnother = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "⚠️ অসংরক্ষিত পরিবর্তন!",
        "আপনার করা পরিবর্তনগুলি এখনও সংরক্ষণ করা হয়নি। নতুন স্ক্যান করতে গেলে বর্তমান ডাটা হারাবে। আপনি কি নিশ্চিত?",
        [
          { 
            text: "💾 সেভ করে নতুন স্ক্যান", 
            onPress: async () => {
              await handleSave();
              router.replace('/');
            }
          },
          { 
            text: "📝 এডিট চালিয়ে যান", 
            style: "cancel" 
          },
          { 
            text: "🗑️ ডাটা বাদ দিন", 
            style: "destructive", 
            onPress: () => {
              setHasUnsavedChanges(false);
              router.replace('/');
            }
          }
        ]
      );
    } else {
      router.replace('/');
    }
  };

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

  const getSubjectSummativeTotal = (subject) => {
    let total = 0;
    ['SE1', 'SE2', 'SE3'].forEach(se => {
      const val = parseInt(student.summative?.[subject]?.[se] || '0', 10);
      if (!isNaN(val)) total += val;
    });
    return total;
  };

// লাইন 164-168 Replace করুন:

const getSubjectPercentage = (subject) => {
  const total = getSubjectSummativeTotal(subject);
  const maxMarks = 300;  // সব ক্লাসের জন্য 300
  return Math.round((total / maxMarks) * 100);
};
  // Render Student Info
  const renderStudentInfo = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>👤</Text>
        <Text style={styles.cardTitle}>STUDENT INFORMATION</Text>
      </View>
      
      <View style={styles.inputGrid}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>শিক্ষার্থীর নাম</Text>
          <TextInput 
            style={styles.textInput} 
            value={student.name || ''} 
            onChangeText={(text) => setStudents(prev => { 
              const next = [...prev]; 
              next[0] = { ...next[0], name: text }; 
              return next; 
            })} 
            placeholder="শিক্ষার্থীর নাম লিখুন"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>রোল নম্বর</Text>
          <TextInput 
            style={styles.textInput} 
            value={student.roll || ''} 
            onChangeText={(text) => setStudents(prev => { 
              const next = [...prev]; 
              next[0] = { ...next[0], roll: text }; 
              return next; 
            })} 
            placeholder="রোল নম্বর লিখুন"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>CLASS</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowClassPicker(!showClassPicker)}
          >
            <Text style={[styles.dropdownText, !student.class && styles.placeholderText]}>
              {student.class ? `CLASS ${student.class}` : 'শ্রেণি নির্বাচন করুন'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {showClassPicker && (
            <View style={styles.pickerContainer}>
              {CLASS_OPTIONS.map(cls => (
                <TouchableOpacity
                  key={cls}
                  style={[styles.pickerItem, student.class === cls && styles.pickerItemActive]}
                  onPress={() => {
                    setStudents(prev => { 
                      const next = [...prev]; 
                      next[0] = { ...next[0], class: cls }; 
                      return next; 
                    });
                    setShowClassPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, student.class === cls && styles.pickerItemTextActive]}>
                    {cls === 'I' || cls === 'II' ? `${cls}ম শ্রেণি` : `${cls}য় শ্রেণি`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>SECTION</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowSectionPicker(!showSectionPicker)}
          >
            <Text style={[styles.dropdownText, !student.section && styles.placeholderText]}>
              {student.section ? ` ${student.section}` : 'শাখা নির্বাচন করুন'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {showSectionPicker && (
            <View style={styles.pickerContainer}>
              {['A', 'B', 'C', 'D'].map(sec => (
                <TouchableOpacity
                  key={sec}
                  style={[styles.pickerItem, student.section === sec && styles.pickerItemActive]}
                  onPress={() => {
                    setStudents(prev => { 
                      const next = [...prev]; 
                      next[0] = { ...next[0], section: sec }; 
                      return next; 
                    });
                    setShowSectionPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, student.section === sec && styles.pickerItemTextActive]}>
                    শাখা {sec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // Formative Assessment
  const renderFormativeTable = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>📝</Text>
        <Text style={styles.cardTitle}>FORMATIVE ASSESSMENT</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.subjectColumn]}>SUBJECT</Text>
            {FORMATIVE_COLUMNS.map(col => (
              <Text key={col} style={styles.headerCell}>{col}</Text>
            ))}
          </View>
          {filteredSubjects.map((subject, index) => (
            <View key={subject} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
              <Text style={[styles.dataCell, styles.subjectColumn]}>{subject}</Text>
              {FORMATIVE_COLUMNS.map(col => (
                <TextInput 
                  key={col} 
                  style={styles.inputCell} 
                  keyboardType="numeric" 
                  value={student.formative?.[subject]?.[col] || ''} 
                  onChangeText={(val) => updateMark('formative', subject, col, val)} 
                  placeholder="০"
                  placeholderTextColor="#ccc"
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // Summative Assessment
  const renderSummativeTable = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>📊</Text>
        <Text style={styles.cardTitle}>SUMMATIVE ASSESSMENT</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.subjectColumn]}>SUBJECT</Text>
            {SUMMATIVE_COLUMNS.map(col => (
              <Text key={col} style={styles.headerCell}>{col}</Text>
            ))}
            <Text style={styles.headerCell}>মোট</Text>
            <Text style={styles.headerCell}>শতাংশ</Text>
          </View>
          {filteredSubjects.map((subject, index) => {
            const total = getSubjectSummativeTotal(subject);
            const percentage = getSubjectPercentage(subject);
            return (
              <View key={subject} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
                <Text style={[styles.dataCell, styles.subjectColumn]}>{subject}</Text>
                {SUMMATIVE_COLUMNS.map(col => (
                  <TextInput 
                    key={col} 
                    style={styles.inputCell} 
                    keyboardType="numeric" 
                    value={student.summative?.[subject]?.[col] || ''} 
                    onChangeText={(val) => updateMark('summative', subject, col, val)} 
                    placeholder="০"
                    placeholderTextColor="#ccc"
                  />
                ))}
                <View style={[styles.dataCell, styles.totalCell]}>
                  <Text style={styles.totalText}>{total}</Text>
                </View>
                <View style={[styles.dataCell, styles.gradeCell]}>
                  <Text style={[styles.gradeText, percentage >= 60 ? styles.gradeGood : styles.gradeAverage]}>
                    {percentage}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  
const renderLPCD = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardIcon}>🧠</Text>
      <Text style={styles.cardTitle}>LIFE SKILLS & CHARACTER DEVELOPMENT</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.assessmentFieldColumn]}>Development Areas</Text>
          <Text style={styles.headerCell}>Phase 1</Text>
          <Text style={styles.headerCell}>Phase 2</Text>
          <Text style={styles.headerCell}>Phase 3</Text>
        </View>
        {LPCD_FIELDS.map((field, index) => (
          <View key={field} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
            <Text style={[styles.dataCell, styles.assessmentFieldColumn]}>{field}</Text>
            <TextInput 
              style={[styles.inputCell, styles.multilineInput]} 
              value={student.lpcd?.[field]?.phase1 || student.lpcd?.[field]?.formative1 || ''} 
              onChangeText={(val) => updateAssessment('lpcd', field, 'phase1', val)} 
              placeholder="Enter remark..."
              placeholderTextColor="#ccc"
              multiline
            />
            <TextInput 
              style={[styles.inputCell, styles.multilineInput]} 
              value={student.lpcd?.[field]?.phase2 || student.lpcd?.[field]?.formative2 || ''} 
              onChangeText={(val) => updateAssessment('lpcd', field, 'phase2', val)} 
              placeholder="Enter remark..."
              placeholderTextColor="#ccc"
              multiline
            />
            <TextInput 
              style={[styles.inputCell, styles.multilineInput]} 
              value={student.lpcd?.[field]?.phase3 || student.lpcd?.[field]?.formative3 || ''} 
              onChangeText={(val) => updateAssessment('lpcd', field, 'phase3', val)} 
              placeholder="Enter remark..."
              placeholderTextColor="#ccc"
              multiline
            />
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);
const renderBCO = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardIcon}>🎯</Text>
      <Text style={styles.cardTitle}>BEHAVIORAL CONDUCT OBSERVATION</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.assessmentFieldColumn]}>Behavioral Skills</Text>
          <Text style={styles.headerCell}>Phase 1</Text>
          <Text style={styles.headerCell}>Phase 2</Text>
          <Text style={styles.headerCell}>Phase 3</Text>
        </View>
        {BCO_FIELDS.map((field, index) => (
          <View key={field} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
            <Text style={[styles.dataCell, styles.assessmentFieldColumn]}>{field}</Text>
            <TextInput 
              style={[styles.inputCell, styles.gradeInput]} 
              value={student.bco?.[field]?.phase1 || student.bco?.[field]?.formative1 || ''} 
              onChangeText={(val) => updateAssessment('bco', field, 'phase1', val)} 
              placeholder="A/B/C/D"
              placeholderTextColor="#ccc"
              maxLength={1}
            />
            <TextInput 
              style={[styles.inputCell, styles.gradeInput]} 
              value={student.bco?.[field]?.phase2 || student.bco?.[field]?.formative2 || ''} 
              onChangeText={(val) => updateAssessment('bco', field, 'phase2', val)} 
              placeholder="A/B/C/D"
              placeholderTextColor="#ccc"
              maxLength={1}
            />
            <TextInput 
              style={[styles.inputCell, styles.gradeInput]} 
              value={student.bco?.[field]?.phase3 || student.bco?.[field]?.formative3 || ''} 
              onChangeText={(val) => updateAssessment('bco', field, 'phase3', val)} 
              placeholder="A/B/C/D"
              placeholderTextColor="#ccc"
              maxLength={1}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);

  // DPLS
  const renderDPLS = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>🌟</Text>
        <Text style={styles.cardTitle}>ব্যক্তিত্ব ও জীবন দক্ষতার উন্নয়ন</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.assessmentFieldColumn]}>দক্ষতা ও গুণাবলী</Text>
            <Text style={styles.headerCell}>শিক্ষকের মন্তব্য</Text>
          </View>
          {DPLS_FIELDS.map((field, index) => (
            <View key={field} style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
              <Text style={[styles.dataCell, styles.assessmentFieldColumn]}>{field}</Text>
              <TextInput 
                style={[styles.inputCell, styles.multilineInput, styles.remarkInput]} 
                value={student.dpls?.[field]?.remark || ''} 
                onChangeText={(val) => setStudents(prev => { 
                  const next = [...prev]; 
                  if (!next[0].dpls) next[0].dpls = {}; 
                  if (!next[0].dpls[field]) next[0].dpls[field] = {}; 
                  next[0].dpls[field].remark = val; 
                  return next; 
                })} 
                placeholder="মন্তব্য যোগ করুন..."
                placeholderTextColor="#ccc"
                multiline
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderImagePreview = () => (
    imageUri && imageUri !== 'undefined' ? (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📷</Text>
          <Text style={styles.cardTitle}>স্ক্যানকৃত ডকুমেন্ট</Text>
        </View>
        <TouchableOpacity 
          style={styles.imageContainer} 
          onPress={() => setImagePreviewVisible(true)} 
          activeOpacity={0.9}
        >
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayText}>🔍 পূর্ণ স্ক্রিনে দেখতে ট্যাপ করুন</Text>
          </View>
        </TouchableOpacity>
      </View>
    ) : null
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={true}
      >
        {renderStudentInfo()}
        {renderFormativeTable()}
        {renderSummativeTable()}
        {renderLPCD()}
        {renderBCO()}
        {renderDPLS()}
        {renderImagePreview()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

    

      {/* Exit Warning Custom Modal */}
      <Modal visible={showExitWarning} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowExitWarning(false)}>
          <View style={styles.warningOverlay}>
            <View style={styles.warningContainer}>
              <View style={styles.warningIconContainer}>
                <Text style={styles.warningIcon}>⚠️</Text>
              </View>
              <Text style={styles.warningTitle}>Unsaved Changes!</Text>
              <Text style={styles.warningMessage}>
                You have scanned data that hasn't been saved yet.
              </Text>
              <Text style={styles.warningSubMessage}>
                If you leave now, this data will be permanently lost.
              </Text>
              <View style={styles.warningDivider} />
              <Text style={styles.warningLimitText}>
                ⚠️ Your daily scan limit for this attempt has already been used.
              </Text>
              
              <View style={styles.warningButtons}>
                <TouchableOpacity 
                  style={[styles.warningBtn, styles.warningSaveBtn]} 
                  onPress={() => {
                    setShowExitWarning(false);
                    handleSaveAndNavigateBack();
                  }}
                >
                  <Text style={styles.warningSaveBtnText}>💾 SAVE & EXIT</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.warningBtn, styles.warningDiscardBtn]} 
                  onPress={() => {
                    setShowExitWarning(false);
                    setHasUnsavedChanges(false);
                    router.back();
                  }}
                >
                  <Text style={styles.warningDiscardBtnText}>🗑️ DISCARD</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.warningBtn, styles.warningContinueBtn]} 
                  onPress={() => setShowExitWarning(false)}
                >
                  <Text style={styles.warningContinueBtnText}>✏️ CONTINUE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      


      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={handleSave} 
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>💾</Text>
              <Text style={styles.buttonText}>ডাটা সেভ করুন</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.scanButton]} 
          onPress={handleScanAnother}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>📷</Text>
          <Text style={styles.buttonText}>নতুন স্ক্যান</Text>
        </TouchableOpacity>
      </View>

      {/* Success Popup Modal */}
      <Modal visible={showSuccessPopup} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>সফলভাবে সংরক্ষিত!</Text>
            <Text style={styles.successMessage}>{student.name || 'শিক্ষার্থী'} এর তথ্য সেভ করা হয়েছে</Text>
          </View>
        </View>
      </Modal>

      <Modal 
        visible={imagePreviewVisible} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setImagePreviewVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  style={styles.modalCloseButton} 
                  onPress={() => setImagePreviewVisible(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
                <Image 
                  source={{ uri: imageUri }} 
                  style={styles.fullScreenImage} 
                  resizeMode="contain" 
                />
                <Text style={styles.modalHint}>যেকোনো জায়গায় ট্যাপ করে বন্ধ করুন</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  scrollContent: { paddingBottom: 100, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: '#e8edf2' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 2, borderBottomColor: '#f0f4f8' },
  cardIcon: { fontSize: 24, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1a237e', letterSpacing: 1, textTransform: 'uppercase' },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  inputWrapper: { flex: 1, minWidth: '45%', marginBottom: 8 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#546e7a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { borderWidth: 2, borderColor: '#e0e6ed', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#2c3e50', backgroundColor: '#fafbfc', fontWeight: '500' },
  dropdownButton: { borderWidth: 2, borderColor: '#e0e6ed', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fafbfc', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: 15, color: '#2c3e50', fontWeight: '500' },
  placeholderText: { color: '#999' },
  dropdownArrow: { fontSize: 12, color: '#546e7a', marginLeft: 8 },
  pickerContainer: { marginTop: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#e0e6ed', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 6 },
  pickerItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f4f8' },
  pickerItemActive: { backgroundColor: '#1a237e' },
  pickerItemText: { fontSize: 15, color: '#2c3e50', fontWeight: '500' },
  pickerItemTextActive: { color: '#fff', fontWeight: '700' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a237e', borderRadius: 12, marginBottom: 8, paddingVertical: 4 },
  headerCell: { width: 70, paddingVertical: 14, paddingHorizontal: 6, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e8edf2', paddingVertical: 4, alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  dataCell: { width: 70, paddingVertical: 10, paddingHorizontal: 6, textAlign: 'center', fontSize: 13, color: '#2c3e50', fontWeight: '500' },
  subjectColumn: { width: 130, textAlign: 'left', paddingLeft: 12, fontWeight: '600' },
  inputCell: { width: 70, paddingVertical: 8, paddingHorizontal: 6, textAlign: 'center', fontSize: 13, color: '#2c3e50', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e6ed', borderRadius: 8, marginHorizontal: 2 },
  assessmentFieldColumn: { width: 180, textAlign: 'left', paddingLeft: 12, fontWeight: '600' },
  totalCell: { backgroundColor: '#e3f2fd', borderRadius: 8, marginHorizontal: 2 },
  totalText: { color: '#1a237e', fontWeight: '700', fontSize: 14 },
  gradeCell: { backgroundColor: '#f3e5f5', borderRadius: 8, marginHorizontal: 2 },
  gradeText: { fontWeight: '700', fontSize: 13 },
  gradeGood: { color: '#2e7d32' },
  gradeAverage: { color: '#f57f17' },
  multilineInput: { minHeight: 60, textAlignVertical: 'top', paddingTop: 8 },
  gradeInput: { fontWeight: '700', fontSize: 16, textTransform: 'uppercase' },
  remarkInput: { width: 200, minHeight: 60, textAlignVertical: 'top', paddingTop: 8 },
  imageContainer: { borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#e0e6ed', position: 'relative' },
  previewImage: { width: '100%', height: 220, backgroundColor: '#f8fafc' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(26, 35, 126, 0.85)', paddingVertical: 12, alignItems: 'center' },
  imageOverlayText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  bottomSpacer: { height: 20 },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 16, backgroundColor: '#fff', borderTopWidth: 2, borderTopColor: '#e8edf2', flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 },
  button: { flex: 1, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 },
  saveButton: { backgroundColor: '#1a237e' },
  scanButton: { backgroundColor: '#00c853' },
  buttonIcon: { fontSize: 20 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  successContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', width: '80%' },
  successIcon: { fontSize: 60, marginBottom: 15 },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a237e', marginBottom: 8 },
  successMessage: { fontSize: 14, color: '#546e7a', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  modalCloseButton: { position: 'absolute', top: 60, right: 20, zIndex: 10, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  modalCloseText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  fullScreenImage: { width: '100%', height: '80%' },
  modalHint: { position: 'absolute', bottom: 50, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },

  warningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  warningIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 40,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 12,
  },
  warningMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningSubMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  warningDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  warningLimitText: {
    fontSize: 12,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  warningButtons: {
    width: '100%',
    gap: 10,
  },
  warningBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  warningSaveBtn: {
    backgroundColor: '#1a237e',
  },
  warningSaveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  warningDiscardBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  warningDiscardBtnText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 14,
  },
  warningContinueBtn: {
    backgroundColor: '#f5f5f5',
  },
  warningContinueBtnText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },

});