import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Exports() {
  const [exportedFiles, setExportedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadExportedFiles();
  }, []);

  const loadExportedFiles = async () => {
    // Sample data - In production, read from actual directory
    const files = [
      { id: 1, name: 'Formative_Marks_Class_IV.csv', type: 'csv', size: '24 KB', date: '2025-03-15 10:30 AM', students: 15 },
      { id: 2, name: 'Summative_Report_Class_V.pdf', type: 'pdf', size: '156 KB', date: '2025-03-14 02:45 PM', students: 12 },
      { id: 3, name: 'LPCD_Assessment_Class_III.xlsx', type: 'xlsx', size: '89 KB', date: '2025-03-10 09:15 AM', students: 20 },
      { id: 4, name: 'BCO_Grades_Class_VIII.csv', type: 'csv', size: '12 KB', date: '2025-03-08 04:20 PM', students: 18 },
      { id: 5, name: 'Academic_Report_Class_IX.pdf', type: 'pdf', size: '234 KB', date: '2025-03-05 11:00 AM', students: 25 },
    ];
    setExportedFiles(files);
  };

  const handleShare = async (file) => {
    try {
      await Share.share({
        message: `File: ${file.name}\nSize: ${file.size}\nDate: ${file.date}\nStudents: ${file.students}`,
        title: file.name,
      });
      Alert.alert('Share', `Sharing ${file.name}`);
    } catch (error) {
      Alert.alert('Error', 'Could not share file');
    }
  };

  const handleDelete = (file) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          const updatedFiles = exportedFiles.filter(f => f.id !== file.id);
          setExportedFiles(updatedFiles);
          Alert.alert('Success', 'File deleted successfully');
        }}
      ]
    );
  };

  const handlePreview = (file) => {
    setSelectedFile(file);
    setModalVisible(true);
  };

  const getFileIcon = (type) => {
    switch(type) {
      case 'csv': return '📊';
      case 'pdf': return '📄';
      case 'xlsx': return '📑';
      default: return '📁';
    }
  };

  const renderFileItem = ({ item }) => (
    <TouchableOpacity style={styles.fileCard} onPress={() => handlePreview(item)}>
      <View style={styles.fileIcon}>
        <Text style={styles.iconText}>{getFileIcon(item.type)}</Text>
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.name}</Text>
        <Text style={styles.fileMeta}>{item.date} • {item.size} • {item.students} students</Text>
      </View>
      <View style={styles.fileActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
          <Text style={styles.actionText}>↗️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.actionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <Text style={styles.headerTitle}>📁 Exported Files</Text>
        <Text style={styles.headerSubtitle}>Manage all your exported reports</Text>
      </LinearGradient>

      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>All Files</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Excel</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={exportedFiles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFileItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No exported files found</Text>}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedFile?.name}</Text>
            <View style={styles.modalInfo}>
              <Text style={styles.modalLabel}>Type: {selectedFile?.type?.toUpperCase()}</Text>
              <Text style={styles.modalLabel}>Size: {selectedFile?.size}</Text>
              <Text style={styles.modalLabel}>Created: {selectedFile?.date}</Text>
              <Text style={styles.modalLabel}>Students: {selectedFile?.students}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => handleShare(selectedFile)}>
                <Text style={styles.modalBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.closeBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 25, paddingTop: 50, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#e0e0e0', marginTop: 5 },
  filterBar: { flexDirection: 'row', padding: 15, gap: 10, backgroundColor: '#fff' },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0' },
  filterText: { fontSize: 14, color: '#666' },
  listContent: { padding: 15 },
  fileCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, alignItems: 'center', elevation: 2 },
  fileIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  iconText: { fontSize: 24 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: '600', color: '#333' },
  fileMeta: { fontSize: 11, color: '#999', marginTop: 4 },
  fileActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8 },
  actionText: { fontSize: 18 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  modalInfo: { marginBottom: 20 },
  modalLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, backgroundColor: '#1a73e8', padding: 12, borderRadius: 8, alignItems: 'center' },
  closeBtn: { backgroundColor: '#999' },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
});