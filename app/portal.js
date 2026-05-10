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
  
  // Manual override modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSelection, setManualSelection] = useState({
    class: className || 'IV',
    subject: '--',
    term: 'Evaluation I',
    category: 'Formative'
  });

  // Live Sync States (auto-detected from portal)
  const [pClass, setPClass] = useState(className || 'IV');
  const [pSubject, setPSubject] = useState('--');
  const [pTerm, setPTerm] = useState('Evaluation I');
  const [pCategory, setPCategory] = useState('Formative');

  // Load students for the selected class
  useEffect(() => {
    loadStudents();
  }, [pClass]);

  const loadStudents = async () => {
    const data = await getStudentsByClass(pClass);
    setStudents(data);
    console.log(`📚 Loaded ${data.length} students for Class ${pClass}`);
  };

  // 🔥 Portal Sync Script
  const syncWithPortalScript = `
    (function() {
      function getAllSelectValues() {
        const selects = document.querySelectorAll('select');
        const result = {
          class: '${pClass}',
          subject: '--',
          term: 'Evaluation I',
          category: 'Formative'
        };
        
        selects.forEach(select => {
          const name = (select.name || '').toLowerCase();
          const id = (select.id || '').toLowerCase();
          const label = (select.closest('label')?.innerText || '').toLowerCase();
          const selectedOption = select.options[select.selectedIndex];
          const selectedText = selectedOption ? selectedOption.text : '';
          
          if (name.includes('class') || id.includes('class') || label.includes('class')) {
            const classMatch = selectedText.match(/(IV|V|VI|VII|VIII|IX|X|I{1,3})/i);
            result.class = classMatch ? classMatch[1].toUpperCase() : selectedText.replace(/class/gi, '').trim();
          }
          else if (name.includes('subject') || id.includes('subject') || label.includes('subject')) {
            result.subject = selectedText || '--';
          }
          else if (name.includes('term') || id.includes('term') || label.includes('term') || label.includes('evaluation')) {
            result.term = selectedText || 'Evaluation I';
          }
          else if (name.includes('category') || id.includes('category') || label.includes('category') || label.includes('type')) {
            result.category = selectedText || 'Formative';
          }
        });
        
        return result;
      }
      
      function sendSyncData() {
        const data = getAllSelectValues();
        data.type = 'PORTAL_SYNC';
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
      
      document.addEventListener('change', function(e) {
        if (e.target.tagName === 'SELECT') {
          setTimeout(sendSyncData, 100);
        }
      });
      
      document.addEventListener('click', function(e) {
        if (e.target.tagName === 'SELECT') {
          setTimeout(sendSyncData, 500);
        }
      });
      
      setTimeout(sendSyncData, 2000);
      setInterval(sendSyncData, 5000);
    })();
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PORTAL_SYNC') {
        if (data.class && data.class !== '--') setPClass(data.class);
        if (data.subject && data.subject !== '--') setPSubject(data.subject);
        if (data.term && data.term !== '--') setPTerm(data.term);
        if (data.category && data.category !== '--') setPCategory(data.category);
        
        console.log('🔄 Live Sync:', { class: data.class, subject: data.subject, term: data.term, category: data.category });
      }
    } catch (e) {
      console.log('Sync Error:', e);
    }
  };

  // 🤖 Auto-Fill Script - Matches by Roll Number or Name
 // 🤖 Auto-Fill Script - Matches by Roll Number or Name
const getAutoFillScript = () => {
  if (students.length === 0) {
    Alert.alert('No Students', `No students found in Class ${pClass}. Please scan report cards first.`);
    return '';
  }
  
  // Create a map of student marks by roll number and name
  const studentMarksMap = {};
  students.forEach(student => {
    studentMarksMap[student.roll] = {
      name: student.name,
      roll: student.roll,
      formative: student.formative || {},
      summative: student.summative || {}
    };
    studentMarksMap[student.name.toLowerCase()] = {
      name: student.name,
      roll: student.roll,
      formative: student.formative || {},
      summative: student.summative || {}
    };
  });
  
  const studentList = students.map(s => ({ roll: s.roll, name: s.name }));
  
  return `
    (function() {
      console.log('🤖 Auto-Fill Started for Class ${pClass}');
      console.log('Students in DB:', ${JSON.stringify(studentList)});
      
      function fillStudentRow(row, studentData) {
        try {
          const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
          const formativeCols = ['F1A', 'F1B', 'F1C', 'F2A', 'F2B', 'F2C', 'F3A', 'F3B', 'F3C'];
          
          let filledMarkCount = 0;
          for (let i = 0; i < formativeCols.length && i < inputs.length; i++) {
            const col = formativeCols[i];
            if (studentData.formative && studentData.formative[col]) {
              inputs[i].value = studentData.formative[col];
              inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
              inputs[i].dispatchEvent(new Event('change', { bubbles: true }));
              filledMarkCount++;
            }
          }
          return filledMarkCount;
        } catch(e) {
          console.log('Error filling row:', e);
          return 0;
        }
      }
      
      setTimeout(function() {
        try {
          var rows = document.querySelectorAll('tr');
          var filledStudentsList = [];
          var notFoundStudentsList = [];
          
          for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var cells = row.querySelectorAll('td');
            if (cells.length < 2) continue;
            
            var rollText = (cells[0]?.innerText || '').trim();
            var nameText = (cells[1]?.innerText || '').trim();
            
            var matchedStudent = null;
            var studentMap = ${JSON.stringify(studentMarksMap)};
            
            if (studentMap[rollText]) {
              matchedStudent = studentMap[rollText];
            } else if (studentMap[nameText.toLowerCase()]) {
              matchedStudent = studentMap[nameText.toLowerCase()];
            }
            
            if (matchedStudent) {
              var filledCount = fillStudentRow(row, matchedStudent);
              filledStudentsList.push({ 
                roll: matchedStudent.roll, 
                name: matchedStudent.name, 
                marksFilled: filledCount 
              });
            } else if (rollText && rollText !== '' && !rollText.includes('Roll') && !rollText.includes('Name')) {
              notFoundStudentsList.push({ roll: rollText, name: nameText });
            }
          }
          
          // Send result to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'AUTOFILL_RESULT',
            filled: filledStudentsList,
            notFound: notFoundStudentsList,
            totalFilled: filledStudentsList.length,
            totalNotFound: notFoundStudentsList.length
          }));
          
          // Show visual feedback on page
          var msgDiv = document.createElement('div');
          var msgText = '✅ Auto-Fill Complete!\\n✓ Filled: ' + filledStudentsList.length + ' students\\n⚠️ Not Found: ' + notFoundStudentsList.length + ' students';
          msgDiv.innerText = msgText;
          msgDiv.style.cssText = 'position:fixed; bottom:80px; left:20px; right:20px; background:#4CAF50; color:white; padding:12px; border-radius:8px; text-align:center; z-index:9999; font-weight:bold; white-space:pre-line;';
          if (notFoundStudentsList.length > 0) {
            msgDiv.style.background = '#FF9800';
          }
          document.body.appendChild(msgDiv);
          setTimeout(function() { msgDiv.remove(); }, 8000);
          
        } catch(error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'AUTOFILL_ERROR',
            message: error.toString()
          }));
        }
      }, 3000);
    })();
  `;
};
  const handleAutoFill = () => {
    if (students.length === 0) {
      Alert.alert('No Students', `No students found in Class ${pClass}. Please scan report cards first.`);
      return;
    }
    
    setAutoFillStatus('Auto-filling marks...');
    webViewRef.current?.injectJavaScript(getAutoFillScript());
  };

  const handleAutoFillMessage = (event) => {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    
    if (data.type === 'AUTOFILL_RESULT') {
      setAutoFillStatus('');
      
      let message = `✅ ${data.totalFilled} students filled successfully`;
      if (data.totalNotFound > 0) {
        message += `\n\n⚠️ ${data.totalNotFound} students NOT found in database:\n`;
        for (let i = 0; i < data.notFound.length; i++) {
          const s = data.notFound[i];
          message += `\n• Roll: ${s.roll || '?'} | Name: ${s.name || 'Unknown'}`;
        }
        message += `\n\n📌 Please enter marks manually for these students.`;
      }
      
      Alert.alert('Auto-Fill Complete', message, [{ text: 'OK' }]);
    } else if (data.type === 'AUTOFILL_ERROR') {
      setAutoFillStatus('');
      Alert.alert('Auto-Fill Error', data.message);
    } else if (data.type === 'PORTAL_SYNC') {
      // Handle sync - already handled in handleMessage
    }
  } catch (e) {
    console.log('Message parse error:', e);
  }
};
  const handleManualOverride = () => {
    setManualSelection({
      class: pClass,
      subject: pSubject,
      term: pTerm,
      category: pCategory
    });
    setShowManualModal(true);
  };

  const saveManualSelection = () => {
    setPClass(manualSelection.class);
    setPSubject(manualSelection.subject);
    setPTerm(manualSelection.term);
    setPCategory(manualSelection.category);
    setShowManualModal(false);
    Alert.alert('Manual Override', 'Selection updated manually');
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
          onMessage={(event) => {
            handleMessage(event);
            handleAutoFillMessage(event);
          }}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
        />
      </View>

      {/* Live Sync Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.liveHeader}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTitle}>LIVE SYNC FROM PORTAL</Text>
          <TouchableOpacity onPress={handleManualOverride} style={styles.editIconBtn}>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.infoRow}>
          <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}>
            <Text style={styles.infoLabel}>📚 CLASS</Text>
            <Text style={styles.infoValue}>{pClass}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}>
            <Text style={styles.infoLabel}>📖 SUBJECT</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{pSubject}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}>
            <Text style={styles.infoLabel}>📅 TERM</Text>
            <Text style={styles.infoValue}>{pTerm}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}>
            <Text style={styles.infoLabel}>🏷️ CATEGORY</Text>
            <Text style={styles.infoValue}>{pCategory}</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.statsBtn}>
            <Text style={styles.statsText}>📊 Students: {students.length}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.autoFillBtn}
            onPress={handleAutoFill}
          >
            <Text style={styles.actionText}>🤖 AUTO FILL MARKS</Text>
          </TouchableOpacity>
        </View>
        
        {autoFillStatus ? (
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>{autoFillStatus}</Text>
          </View>
        ) : null}
      </View>

      {/* Manual Override Modal */}
      <Modal
        visible={showManualModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✎ Manual Selection</Text>
              <TouchableOpacity onPress={() => setShowManualModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Class</Text>
              <TextInput
                style={styles.modalInput}
                value={manualSelection.class}
                onChangeText={(text) => setManualSelection({...manualSelection, class: text})}
                placeholder="e.g., IV"
              />
              
              <Text style={styles.modalLabel}>Subject</Text>
              <TextInput
                style={styles.modalInput}
                value={manualSelection.subject}
                onChangeText={(text) => setManualSelection({...manualSelection, subject: text})}
                placeholder="e.g., Mathematics"
              />
              
              <Text style={styles.modalLabel}>Term</Text>
              <TextInput
                style={styles.modalInput}
                value={manualSelection.term}
                onChangeText={(text) => setManualSelection({...manualSelection, term: text})}
                placeholder="e.g., Evaluation I"
              />
              
              <Text style={styles.modalLabel}>Category</Text>
              <TextInput
                style={styles.modalInput}
                value={manualSelection.category}
                onChangeText={(text) => setManualSelection({...manualSelection, category: text})}
                placeholder="e.g., Formative"
              />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowManualModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveManualSelection}>
                <Text style={styles.saveBtnText}>Save & Apply</Text>
              </TouchableOpacity>
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
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 1,
  },
  loaderText: { marginTop: 10, fontSize: 14, color: '#333' },
  
  toolbar: { 
    padding: 12, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  liveHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  liveDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#ff4444',
    marginRight: 6,
  },
  liveTitle: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#ff4444', 
    letterSpacing: 1,
    flex: 1,
  },
  editIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editIcon: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: { 
    flexDirection: 'row', 
    gap: 10, 
    paddingBottom: 10,
  },
  infoBox: { 
    backgroundColor: '#f8f9fa', 
    paddingHorizontal: 14,
    paddingVertical: 10, 
    borderRadius: 12, 
    minWidth: 85, 
    borderWidth: 1, 
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  infoLabel: { 
    fontSize: 9, 
    color: '#6c757d', 
    fontWeight: '600', 
    marginBottom: 4,
  },
  infoValue: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: '#212529',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  statsBtn: {
    flex: 1,
    backgroundColor: '#e9ecef',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statsText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#495057',
  },
  autoFillBtn: {
    flex: 2,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusBar: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#1a73e8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 15,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});