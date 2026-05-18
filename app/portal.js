import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getStudentsByClass } from '../utils/database';

export default function Portal() {
  const { className } = useLocalSearchParams();
  const webViewRef = useRef(null);
  const [currentUrl, setCurrentUrl] = useState('');

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

  // HPRC (Formative/Summative) পেজের জন্য Sync Script
  const syncWithPortalScript = `
  (function() {
    console.log("✅ HPRC Portal script loaded");
    
    function getAllSelectValues() {
      const selects = document.querySelectorAll('select');
      
      var classValue = '${pClass}';
      var subjectValue = '--';
      var termValue = 'Evaluation I';
      var categoryValue = 'Formative';
      
      console.log("📊 Found " + selects.length + " selects in HPRC");
      
      for (var i = 0; i < selects.length; i++) {
        var select = selects[i];
        var selectedText = select.options[select.selectedIndex]?.text || '';
        
        console.log(\`Select \${i}: text="\${selectedText}"\`);
        
        if (selectedText.match(/^[IVXLCDM]+$/i) && selectedText !== 'Select class') {
          classValue = selectedText;
          console.log("📚 Found Class:", selectedText);
        }
        else if ((selectedText === 'BENGALI' || selectedText === 'ENGLISH' || 
                  selectedText === 'MATHEMATICS' || selectedText === 'OUR ENVIRONMENT' ||
                  selectedText === 'ART & WORK EDUCATION' || selectedText === 'HEALTH & PHYSICAL EDUCATION')) {
          subjectValue = selectedText;
          console.log("📖 Found Subject:", selectedText);
        }
        else if (selectedText.includes('Evaluation') && selectedText !== 'Select term') {
          termValue = selectedText;
          console.log("📅 Found Term:", selectedText);
        }
        else if ((selectedText === 'Formative Evaluation' || selectedText === 'Summative Evaluation')) {
          categoryValue = selectedText;
          console.log("🏷️ Found Category:", selectedText);
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
    
    document.addEventListener('change', function(e) {
      if (e.target.tagName === 'SELECT') {
        setTimeout(getAllSelectValues, 200);
      }
    });
    
    setTimeout(getAllSelectValues, 2000);
  })();
`;

  // LPCD/BCO পেজের জন্য Sync Script
  const lpcdSyncScript = `
  (function() {
    console.log("🔄 LPCD/BCO Portal script loaded");
    
    function getLPCDSelectValues() {
      const selects = document.querySelectorAll('select');
      const result = {
        class: '${pClass}',
        section: '',
        term: 'Evaluation-I'
      };
      
      console.log("📊 Found " + selects.length + " selects in LPCD/BCO");
      
      for (var i = 0; i < selects.length; i++) {
        const select = selects[i];
        const selectedText = select.options[select.selectedIndex]?.text || '';
        
        console.log(\`Select \${i}: text="\${selectedText}"\`);
        
        if (selectedText.match(/^[IVXLCDM]+$/i) && selectedText !== 'Select class') {
          result.class = selectedText;
          console.log("📚 Class:", selectedText);
        }
        else if ((selectedText === 'A' || selectedText === 'B' || selectedText === 'C' || selectedText === 'D')) {
          result.section = selectedText;
          console.log("📌 Section:", selectedText);
        }
        else if (selectedText.includes('Evaluation') && selectedText !== 'Select term') {
          result.term = selectedText;
          console.log("📅 Term:", selectedText);
        }
      }
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'LPCD_SYNC',
        ...result
      }));
    }
    
    document.addEventListener('change', function(e) {
      if (e.target.tagName === 'SELECT') {
        setTimeout(getLPCDSelectValues, 200);
      }
    });
    
    setTimeout(getLPCDSelectValues, 2000);
  })();
`;

  // URL অনুযায়ী সঠিক script নির্বাচন
  const getInjectedScript = () => {
    if (currentUrl.includes('lpcd') || currentUrl.includes('bco')) {
      return lpcdSyncScript;
    }
    return syncWithPortalScript;
  };

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
        lpcd: student.lpcd || {},
        bco: student.bco || {},
      };
    });

    if (currentUrl.includes('lpcd')) {
      return getLPCDAutoFillScript(studentMap);
    }
    if (currentUrl.includes('bco')) {
      return getBCOAutoFillScript(studentMap);
    }
    return getMarksAutoFillScript(studentMap);
  };

  const getMarksAutoFillScript = (studentMap) => {
    return `
      (function() {
        console.log("🤖 Marks Auto-Fill Started");
        
        function getSelectedSubject() {
          var subjectSelect = document.querySelector('#subject_id');
          return subjectSelect ? subjectSelect.options[subjectSelect.selectedIndex]?.text : '';
        }
        
        function getSelectedTermAndCategory() {
          var termSelect = document.querySelector('#term_id');
          var categorySelect = document.querySelector('#category_id');
          return { 
            term: termSelect ? termSelect.options[termSelect.selectedIndex]?.text : '',
            category: categorySelect ? categorySelect.options[categorySelect.selectedIndex]?.text : ''
          };
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
        var selection = getSelectedTermAndCategory();
        var markColumns = getColumnsToFill(selection.term, selection.category);
        
        if (markColumns.length === 0) return;
        
        var table = document.getElementById('tbl_data');
        if (!table) return;
        
        var rows = table.rows;
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
            var inputs = row.querySelectorAll('input.tabcancel, input[type="text"]');
            
            for (var j = 0; j < inputs.length && j < markColumns.length; j++) {
              var input = inputs[j];
              var colName = markColumns[j];
              var markValue = isSummative ? 
                (matchedStudent.summative?.[dbSubject]?.[colName] || '') : 
                (matchedStudent.formative?.[dbSubject]?.[colName] || '');
              
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
          columns: markColumns
        }));
        
        var msgDiv = document.createElement('div');
        msgDiv.innerText = '✅ Auto-Fill Complete!\\n✓ ' + totalFilled + ' marks filled';
        msgDiv.style.cssText = 'position:fixed; bottom:80px; left:20px; right:20px; background:#4CAF50; color:white; padding:12px; border-radius:8px; text-align:center; z-index:9999; font-weight:bold;';
        document.body.appendChild(msgDiv);
        setTimeout(function() { msgDiv.remove(); }, 5000);
      })();
    `;
  };

  const getLPCDAutoFillScript = (studentMap) => {
    return `
      (function() {
        console.log("🤖 LPCD Auto-Fill Started");
        
        var table = document.querySelector('table');
        if (!table) return;
        
        var rows = table.rows;
        var studentMap = ${JSON.stringify(studentMap)};
        var phases = ['formative1', 'formative2', 'formative3'];
        var totalFilled = 0;
        
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
          
          if (matchedStudent && matchedStudent.lpcd) {
            var inputs = row.querySelectorAll('input, textarea');
            
            for (var j = 0; j < inputs.length && j < phases.length; j++) {
              var input = inputs[j];
              var phase = phases[j];
              var lpcdFields = Object.keys(matchedStudent.lpcd);
              
              for (var k = 0; k < lpcdFields.length; k++) {
                var field = lpcdFields[k];
                var value = matchedStudent.lpcd[field]?.[phase] || '';
                if (value && input.value === '') {
                  input.value = value;
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  totalFilled++;
                  break;
                }
              }
            }
          }
        }
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'AUTOFILL_RESULT',
          totalFilled: totalFilled,
          totalMatched: 1,
          columns: ['LPCD']
        }));
      })();
    `;
  };

  const getBCOAutoFillScript = (studentMap) => {
    return `
      (function() {
        console.log("🤖 BCO Auto-Fill Started");
        
        var table = document.querySelector('table');
        if (!table) return;
        
        var rows = table.rows;
        var studentMap = ${JSON.stringify(studentMap)};
        var phases = ['formative1', 'formative2', 'formative3'];
        var totalFilled = 0;
        
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
          
          if (matchedStudent && matchedStudent.bco) {
            var inputs = row.querySelectorAll('input');
            
            for (var j = 0; j < inputs.length && j < phases.length; j++) {
              var input = inputs[j];
              var phase = phases[j];
              var bcoFields = Object.keys(matchedStudent.bco);
              
              for (var k = 0; k < bcoFields.length; k++) {
                var field = bcoFields[k];
                var value = matchedStudent.bco[field]?.[phase] || '';
                if (value && input.value === '') {
                  input.value = value;
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  totalFilled++;
                  break;
                }
              }
            }
          }
        }
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'AUTOFILL_RESULT',
          totalFilled: totalFilled,
          totalMatched: 1,
          columns: ['BCO']
        }));
      })();
    `;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("📨 Message received:", data);

      if (data.type === 'PORTAL_SYNC') {
        if (data.class && data.class !== '--' && data.class !== 'Select') setPClass(data.class);
        if (data.subject && data.subject !== '--' && data.subject !== 'Select subject') setPSubject(data.subject);
        if (data.term && data.term !== '--' && data.term !== 'Select term') setPTerm(data.term);
        if (data.category && data.category !== '--' && data.category !== 'Select category') setPCategory(data.category);
        console.log("🔄 HPRC Sync:", { class: data.class, subject: data.subject, term: data.term, category: data.category });
      }
      else if (data.type === 'LPCD_SYNC') {
        if (data.class && data.class !== 'Select class' && data.class !== '--') {
          setPClass(data.class);
          console.log("📚 LPCD Class updated to:", data.class);
        }
        if (data.term && data.term !== 'Select term') {
          setPTerm(data.term);
          console.log("📅 LPCD Term updated to:", data.term);
        }
        console.log("🔄 LPCD Final Sync:", { class: pClass, term: data.term });
      }
      else if (data.type === 'AUTOFILL_RESULT') {
        Alert.alert(
          "Auto-Fill Result",
          `✅ ${data.totalFilled} fields filled\n👥 Matched: ${data.totalMatched} students`
        );
        setAutoFillStatus('');
      }
    } catch (e) {
      console.log("Sync Error:", e);
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
          injectedJavaScript={getInjectedScript()}
          onMessage={handleMessage}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={(navState) => {
            setCurrentUrl(navState.url);
            setTimeout(() => {
              webViewRef.current?.injectJavaScript(getInjectedScript());
            }, 1000);
          }}
          style={styles.webview}
        />
      </View>
      
      <View style={styles.toolbar}>
        {/* Live Header */}
        <View style={styles.liveHeader}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTitle}>LIVE SYNC FROM PORTAL</Text>
          <TouchableOpacity onPress={handleManualOverride} style={styles.editIconBtn}>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
        </View>
        
        {/* Info Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.infoRow}>
          <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}>
            <Text style={styles.infoLabel}>📚 CLASS</Text>
            <Text style={styles.infoValue}>{pClass}</Text>
          </TouchableOpacity>

          {!currentUrl.includes('lpcd') && !currentUrl.includes('bco') && (
            <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}>
              <Text style={styles.infoLabel}>📖 SUBJECT</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{pSubject}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}>
            <Text style={styles.infoLabel}>📅 TERM</Text>
            <Text style={styles.infoValue}>{pTerm}</Text>
          </TouchableOpacity>

          {!currentUrl.includes('lpcd') && !currentUrl.includes('bco') && (
            <TouchableOpacity style={styles.infoBox} onPress={() => setShowManualModal(true)}>
              <Text style={styles.infoLabel}>🏷️ CATEGORY</Text>
              <Text style={styles.infoValue}>{pCategory}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        
        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.statsBtn}>
            <Text style={styles.statsText}>📊 Students: {students.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.autoFillBtn} onPress={handleAutoFill}>
            <Text style={styles.actionText}>🤖 AUTO FILL</Text>
          </TouchableOpacity>
        </View>
        
        {autoFillStatus ? (
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>{autoFillStatus}</Text>
          </View>
        ) : null}
      </View>

      {/* Manual Selection Modal */}
      <Modal visible={showManualModal} transparent={true} animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowManualModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✎ Manual Selection</Text>
              <TouchableOpacity onPress={() => setShowManualModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              
              {/* Class Selection */}
              <Text style={styles.modalLabel}>📚 Class</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                {['I','II','III','IV','V','VI','VII','VIII','IX','X'].map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, manualSelection.class === c && styles.chipActive]}
                    onPress={() => setManualSelection({ ...manualSelection, class: c })}
                  >
                    <Text style={[styles.chipText, manualSelection.class === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Subject Selection (HPRC) */}
              {!currentUrl.includes('lpcd') && !currentUrl.includes('bco') && (
                <>
                  <Text style={styles.modalLabel}>📖 Subject</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {['BENGALI','ENGLISH','MATHEMATICS','OUR ENVIRONMENT','ART & WORK EDUCATION','HEALTH & PHYSICAL EDUCATION'].map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.chip, manualSelection.subject === s && styles.chipActive]}
                        onPress={() => setManualSelection({ ...manualSelection, subject: s })}
                      >
                        <Text style={[styles.chipText, manualSelection.subject === s && styles.chipTextActive]} numberOfLines={1}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Term Selection */}
              <Text style={styles.modalLabel}>📅 Term</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                {['Evaluation-I', 'Evaluation-II', 'Evaluation-III'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, manualSelection.term === t && styles.chipActive]}
                    onPress={() => setManualSelection({ ...manualSelection, term: t })}
                  >
                    <Text style={[styles.chipText, manualSelection.term === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Category Selection (HPRC) */}
              {!currentUrl.includes('lpcd') && !currentUrl.includes('bco') && (
                <>
                  <Text style={styles.modalLabel}>🏷️ Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                    {['Formative Evaluation', 'Summative Evaluation'].map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chip, manualSelection.category === cat && styles.chipActive]}
                        onPress={() => setManualSelection({ ...manualSelection, category: cat })}
                      >
                        <Text style={[styles.chipText, manualSelection.category === cat && styles.chipTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

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
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webviewContainer: { flex: 1 },
  webview: { flex: 1 },
  loaderOverlay: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    justifyContent: 'center', alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 1 
  },
  loaderText: { marginTop: 10, fontSize: 14, color: '#333' },
  toolbar: { padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e0e0e0', elevation: 8 },
  liveHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff4444', marginRight: 6 },
  liveTitle: { fontSize: 10, fontWeight: 'bold', color: '#ff4444', letterSpacing: 1, flex: 1 },
  editIconBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  editIcon: { fontSize: 14, color: '#666' },
  infoRow: { flexDirection: 'row', gap: 10, paddingBottom: 10 },
  infoBox: { 
    backgroundColor: '#f8f9fa', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 12, 
    minWidth: 85, 
    borderWidth: 1, 
    borderColor: '#e9ecef', 
    alignItems: 'center' 
  },
  infoLabel: { fontSize: 9, color: '#6c757d', fontWeight: '600', marginBottom: 4 },
  infoValue: { fontSize: 13, fontWeight: 'bold', color: '#212529' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
  statsBtn: { flex: 1, backgroundColor: '#e9ecef', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  statsText: { fontWeight: 'bold', fontSize: 13, color: '#495057' },
  autoFillBtn: { flex: 2, backgroundColor: '#28a745', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  statusBar: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
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
    marginBottom: 8,
    marginTop: 5,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#1a73e8',
  },
  chipText: {
    fontSize: 13,
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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