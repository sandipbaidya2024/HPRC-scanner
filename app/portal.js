import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getStudentsByClass } from '../utils/database';

export default function Portal() {
  const { className } = useLocalSearchParams();
  const webViewRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [autoFillStatus, setAutoFillStatus] = useState('');

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSelection, setManualSelection] = useState({
    class: className || 'IV',
    subject: '--',
    term: 'Evaluation I',
    category: 'Formative'
  });

  const [pClass, setPClass] = useState(className || 'IV');
  const [pSubject, setPSubject] = useState('--');
  const [pTerm, setPTerm] = useState('Evaluation I');
  const [pCategory, setPCategory] = useState('Formative');

  useEffect(() => {
    loadStudents();
  }, [pClass]);

  const loadStudents = async () => {
    const data = await getStudentsByClass(pClass);
    setStudents(data);
    console.log(`📚 Loaded ${data.length} students for Class ${pClass}`);
  };

const syncWithPortalScript = `
  (function() {
    console.log("✅ Portal script loaded");
    
    function getAllSelectValues() {
      const selects = document.querySelectorAll('select');
      
      var classValue = '${pClass}';
      var subjectValue = '--';
      var termValue = 'Evaluation I';
      var categoryValue = 'Formative';
      
      for (var i = 0; i < selects.length; i++) {
        var select = selects[i];
        var selectedText = select.options[select.selectedIndex]?.text || '';
        var selectedValue = select.value;
        
        // Subject - index 3
        if (i === 3 && selectedText !== 'Select subject') {
          subjectValue = selectedText;
        }
        // Class - index 1  
        if (i === 1 && selectedText !== 'Select class') {
          classValue = selectedText;
        }
        // Term - index 4
        if (i === 4 && selectedText !== 'Select term') {
          termValue = selectedText;
          console.log("📌 Term changed to:", termValue);
        }
        // Category - index 5
        if (i === 5 && selectedText !== 'Select category') {
          categoryValue = selectedText;
          console.log("📌 Category changed to:", categoryValue);
        }
      }
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'PORTAL_SYNC',
        class: classValue,
        subject: subjectValue,
        term: termValue,
        category: categoryValue
      }));
    }
    
    // Select এ change event
    document.addEventListener('change', function(e) {
      if (e.target.tagName === 'SELECT') {
        console.log("🔄 Select changed:", e.target.id);
        setTimeout(getAllSelectValues, 200);
      }
    });
    
    // পেজ লোড হলে
    setTimeout(getAllSelectValues, 2000);
    
    // প্রতি 5 সেকেন্ডে সিঙ্ক (যাতে ম্যানুয়ালি পরিবর্তন ধরা পড়ে)
    setInterval(getAllSelectValues, 5000);
  })();
`;








const getAutoFillScript = () => {
  if (students.length === 0) return '';
  
  const studentMap = {};
  students.forEach(student => {
    const normalizedName = student.name?.toLowerCase().trim();
    studentMap[normalizedName] = {
      name: student.name,
      roll: student.roll,
      formative: student.formative || {},
      summative: student.summative || {},
    };
  });
  
  return `
    (function() {
      console.log("🤖 Auto-Fill Started - Subject wise");
      
      // পোর্টাল থেকে সাবজেক্ট নাম নেওয়া
      function getSelectedSubject() {
        var subjectSelect = document.querySelector('#subject_id');
        var subject = subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex]?.text : '';
        console.log("📖 Selected Subject:", subject);
        return subject;
      }
      
      function getSelectedTermAndCategory() {
        var termSelect = document.querySelector('#term_id');
        var categorySelect = document.querySelector('#category_id');
        var term = termSelect ? termSelect.options[termSelect.selectedIndex]?.text : '';
        var category = categorySelect ? categorySelect.options[categorySelect.selectedIndex]?.text : '';
        return { term: term, category: category };
      }
      
      function getColumnsToFill(term, category) {
        var columns = [];
        if (category === 'Formative Evaluation') {
          if (term === 'Evaluation-I') columns = ['F1A', 'F1B', 'F1C'];
          else if (term === 'Evaluation-II') columns = ['F2A', 'F2B', 'F2C'];
          else if (term === 'Evaluation-III') columns = ['F3A', 'F3B', 'F3C'];
        }
        else if (category === 'Summative Evaluation') {
          if (term === 'Evaluation-I') columns = ['SE1'];
          else if (term === 'Evaluation-II') columns = ['SE2'];
          else if (term === 'Evaluation-III') columns = ['SE3'];
        }
        return columns;
      }
      
      // সাবজেক্ট নাম ম্যাপিং (পোর্টালের নাম ↔ ডাটাবেসের নাম)
      function mapSubject(portalSubject) {
        var subjectMap = {
          'BENGALI': '1st Language',
          'ENGLISH': '2nd Language',
          'MATHEMATICS': 'Mathematics',
          'OUR ENVIRONMENT': 'Our Environment',
          'ART & WORK EDUCATION': 'Art & Work Education',
          'HEALTH & PHYSICAL EDUCATION': 'Health & Physical Education'
        };
        return subjectMap[portalSubject] || '1st Language';
      }
      
      var selectedSubject = getSelectedSubject();
      var dbSubject = mapSubject(selectedSubject);
      console.log("📚 DB Subject:", dbSubject);
      
      var selection = getSelectedTermAndCategory();
      var markColumns = getColumnsToFill(selection.term, selection.category);
      
      if (markColumns.length === 0) {
        console.log("❌ No columns found");
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'AUTOFILL_RESULT',
          totalFilled: 0,
          totalMatched: 0,
          error: "No columns"
        }));
        return;
      }
      
      var table = document.getElementById('tbl_data');
      if (!table) return;
      
      var rows = table.rows;
      console.log("📊 Rows:", rows.length);
      
      var studentMap = ${JSON.stringify(studentMap)};
      var totalFilled = 0;
      var matchedStudents = 0;
      var isSummative = (selection.category === 'Summative Evaluation');
      
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var rowText = row.innerText || '';
        
        var matchedStudent = null;
        for (var dbName in studentMap) {
          if (rowText.toLowerCase().includes(dbName)) {
            matchedStudent = studentMap[dbName];
            break;
          }
        }
        
        if (matchedStudent) {
          matchedStudents++;
          console.log("✅ Found:", matchedStudent.name);
          
          var inputs = row.querySelectorAll('input.tabcancel, input[type="text"]');
          
          for (var j = 0; j < inputs.length && j < markColumns.length; j++) {
            var input = inputs[j];
            var colName = markColumns[j];
            
            var markValue = '';
            if (isSummative) {
              // ✅ সঠিক সাবজেক্টের মার্কস নেওয়া
              markValue = matchedStudent.summative?.[dbSubject]?.[colName] || '';
            } else {
              // ✅ সঠিক সাবজেক্টের মার্কস নেওয়া
              markValue = matchedStudent.formative?.[dbSubject]?.[colName] || '';
            }
            
            console.log("   " + dbSubject + " - " + colName + ": " + markValue);
            
            if (markValue && markValue !== '') {
              input.value = markValue;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              totalFilled++;
            }
          }
        }
      }
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'AUTOFILL_RESULT',
        totalFilled: totalFilled,
        totalMatched: matchedStudents,
        columns: markColumns,
        subject: selectedSubject,
        dbSubject: dbSubject
      }));
      
      var msgText = '✅ Auto-Fill Complete!\\n✓ ' + selectedSubject + ': ' + totalFilled + ' marks';
      var msgDiv = document.createElement('div');
      msgDiv.innerText = msgText;
      msgDiv.style.cssText = 'position:fixed; bottom:80px; left:20px; right:20px; background:#4CAF50; color:white; padding:12px; border-radius:8px; text-align:center; z-index:9999; font-weight:bold;';
      document.body.appendChild(msgDiv);
      setTimeout(function() { msgDiv.remove(); }, 5000);
    })();
  `;
};




  const handleMessage = (event) => {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    console.log("📨 Message received:", data);
    
    if (data.type === 'CONSOLE_LOG') {
      console.log("🌐 WebView Log:", data.message);
    }
    else if (data.type === 'INPUT_DEBUG') {
      console.log("🔍 INPUT DEBUG:", data);
      Alert.alert('Debug Info', `Found ${data.count} inputs\nSample: ${JSON.stringify(data.sample)}`);
    }
    else if (data.type === 'PORTAL_SYNC') {
      if (data.class && data.class !== '--' && data.class !== 'Select') setPClass(data.class);
      if (data.subject && data.subject !== '--' && data.subject !== 'Select subject') setPSubject(data.subject);
      if (data.term && data.term !== '--' && data.term !== 'Select term') setPTerm(data.term);
      if (data.category && data.category !== '--' && data.category !== 'Select category') setPCategory(data.category);
      console.log("🔄 Live Sync:", { class: data.class, subject: data.subject, term: data.term, category: data.category });
    }
  } catch (e) {
    console.log("Sync Error:", e, "Raw data:", event.nativeEvent.data);
  }
};




const handleAutoFillMessage = (event) => {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    console.log("📨 Auto-Fill Result:", data);
    
    if (data.type === 'AUTOFILL_RESULT') {
      Alert.alert(
        "Auto-Fill Result", 
        `✅ ${data.totalFilled} marks filled\n` +
        `📊 Columns: ${data.columns?.join(', ')}\n` +
        `👥 Matched: ${data.totalMatched} students`
      );
    }
  } catch (e) {
    console.log("Error:", e);
  }
};

  
  const handleAutoFill = () => {
    if (students.length === 0) {
      Alert.alert('No Students', `No students found in Class ${pClass}. Please scan report cards first.`);
      return;
    }
    setAutoFillStatus('Auto-filling marks...');
    webViewRef.current?.injectJavaScript(getAutoFillScript());
  };



  const handleManualOverride = () => {
    setManualSelection({ class: pClass, subject: pSubject, term: pTerm, category: pCategory });
    setShowManualModal(true);
  };

  const saveManualSelection = () => {
    setPClass(manualSelection.class);
    setPSubject(manualSelection.subject);
    setPTerm(manualSelection.term);
    setPCategory(manualSelection.category);
    setShowManualModal(false);
    loadStudents();
  };

  return (
    <View style={styles.container}>
      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text style={styles.loaderText}>Loading Portal...</Text>
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://school.banglarshiksha.gov.in/sms/' }}
          injectedJavaScript={syncWithPortalScript}
          onMessage={(event) => { handleMessage(event); handleAutoFillMessage(event); }}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
        />
      </View>
      <View style={styles.toolbar}>
        <View style={styles.liveHeader}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTitle}>LIVE SYNC FROM PORTAL</Text>
          <TouchableOpacity onPress={handleManualOverride} style={styles.editIconBtn}><Text style={styles.editIcon}>✎</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.infoRow}>
          <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}><Text style={styles.infoLabel}>📚 CLASS</Text><Text style={styles.infoValue}>{pClass}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}><Text style={styles.infoLabel}>📖 SUBJECT</Text><Text style={styles.infoValue} numberOfLines={1}>{pSubject}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}><Text style={styles.infoLabel}>📅 TERM</Text><Text style={styles.infoValue}>{pTerm}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}><Text style={styles.infoLabel}>🏷️ CATEGORY</Text><Text style={styles.infoValue}>{pCategory}</Text></TouchableOpacity>
        </ScrollView>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.statsBtn}><Text style={styles.statsText}>📊 Students: {students.length}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.autoFillBtn} onPress={handleAutoFill}><Text style={styles.actionText}>🤖 AUTO FILL MARKS</Text></TouchableOpacity>
        </View>
        {autoFillStatus ? <View style={styles.statusBar}><Text style={styles.statusText}>{autoFillStatus}</Text></View> : null}
      </View>
      <Modal visible={showManualModal} transparent={true} animationType="slide" onRequestClose={() => setShowManualModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>✎ Manual Selection</Text><TouchableOpacity onPress={() => setShowManualModal(false)}><Text style={styles.closeText}>✕</Text></TouchableOpacity></View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Class</Text>
              <TextInput style={styles.modalInput} value={manualSelection.class} onChangeText={(text) => setManualSelection({ ...manualSelection, class: text })} />
              <Text style={styles.modalLabel}>Subject</Text>
              <TextInput style={styles.modalInput} value={manualSelection.subject} onChangeText={(text) => setManualSelection({ ...manualSelection, subject: text })} />
              <Text style={styles.modalLabel}>Term</Text>
              <TextInput style={styles.modalInput} value={manualSelection.term} onChangeText={(text) => setManualSelection({ ...manualSelection, term: text })} />
              <Text style={styles.modalLabel}>Category</Text>
              <TextInput style={styles.modalInput} value={manualSelection.category} onChangeText={(text) => setManualSelection({ ...manualSelection, category: text })} />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowManualModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveManualSelection}><Text style={styles.saveBtnText}>Save & Apply</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webviewContainer: { flex: 1 },
  webview: { flex: 1 },
  loaderOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 1 },
  loaderText: { marginTop: 10, fontSize: 14, color: '#333' },
  toolbar: { padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e0e0e0', elevation: 8 },
  liveHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff4444', marginRight: 6 },
  liveTitle: { fontSize: 10, fontWeight: 'bold', color: '#ff4444', letterSpacing: 1, flex: 1 },
  editIconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  editIcon: { fontSize: 14, color: '#666' },
  infoRow: { flexDirection: 'row', gap: 10, paddingBottom: 10 },
  infoBox: { backgroundColor: '#f8f9fa', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, minWidth: 85, borderWidth: 1, borderColor: '#e9ecef', alignItems: 'center' },
  infoLabel: { fontSize: 9, color: '#6c757d', fontWeight: '600', marginBottom: 4 },
  infoValue: { fontSize: 13, fontWeight: 'bold', color: '#212529' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
  statsBtn: { flex: 1, backgroundColor: '#e9ecef', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  statsText: { fontWeight: 'bold', fontSize: 13, color: '#495057' },
  autoFillBtn: { flex: 2, backgroundColor: '#28a745', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  statusBar: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, width: '85%', maxHeight: '70%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#1a73e8' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  closeText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  modalBody: { padding: 15 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5, marginTop: 10 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#f9f9f9' },
  modalFooter: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#e0e0e0', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#6c757d', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: 'bold' },
  saveBtn: { flex: 1, backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});