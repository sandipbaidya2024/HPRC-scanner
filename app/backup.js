import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { createBackup, deleteBackup, exportTemplateCSV, listBackups, restoreBackup, shareBackup } from '../utils/backup';

export default function Backup() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    const backupList = await listBackups();
    setBackups(backupList);
    setLoading(false);
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    const result = await createBackup();
    setCreating(false);
    
    if (result.success) {
      Alert.alert('Backup Created', `✅ ${result.count} students backed up successfully!\n\nFile: ${result.fileName}`, [
        { text: 'OK', onPress: () => loadBackups() }
      ]);
    } else {
      Alert.alert('Backup Failed', result.error);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    
    setRestoring(true);
    const result = await restoreBackup(selectedBackup.path);
    setRestoring(false);
    setShowConfirmModal(false);
    
    if (result.success) {
      Alert.alert('Restore Complete', `✅ ${result.count} students restored from backup!\n\nBackup date: ${new Date(result.timestamp).toLocaleString()}`, [
        { text: 'OK' }
      ]);
      setSelectedBackup(null);
    } else {
      Alert.alert('Restore Failed', result.error);
    }
  };

  const handleShare = async (backup) => {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await shareBackup(backup.path, backup.name);
    } else {
      Alert.alert('Error', 'Sharing is not available on this device');
    }
  };

  const handleDelete = async (backup) => {
    Alert.alert('Delete Backup', `Delete "${backup.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const success = await deleteBackup(backup.path);
        if (success) {
          loadBackups();
          Alert.alert('Deleted', 'Backup file deleted successfully');
        }
      }}
    ]);
  };

  const handleExportTemplate = async () => {
    const success = await exportTemplateCSV();
    if (success) {
      Alert.alert('Template Exported', 'CSV template file has been shared');
    }
  };

  const formatDate = (dateStr) => {
    const parts = dateStr.split(':');
    if (parts.length === 3) {
      return `${parts[0]}:${parts[1]}:${parts[2].substring(0, 2)}`;
    }
    return dateStr;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <Text style={styles.headerTitle}>☁️ Backup & Restore</Text>
        <Text style={styles.headerSubtitle}>Save your data locally</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Create Backup Button */}
        <TouchableOpacity 
          style={[styles.createBtn, creating && styles.disabledBtn]}
          onPress={handleCreateBackup}
          disabled={creating}
        >
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={styles.createGradient}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.createText}>Create New Backup</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Export Template Button */}
        <TouchableOpacity 
          style={styles.templateBtn}
          onPress={handleExportTemplate}
        >
          <LinearGradient
            colors={['#FF9800', '#E65100']}
            style={styles.templateGradient}
          >
            <MaterialCommunityIcons name="file-excel" size={24} color="#fff" />
            <Text style={styles.createText}>Download CSV Template</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}>
          <Text style={styles.infoTitle}>📌 About Backup</Text>
          <Text style={styles.infoText}>• Creates a complete backup of all student data</Text>
          <Text style={styles.infoText}>• Backups are stored locally on your device</Text>
          <Text style={styles.infoText}>• You can share backups to Google Drive/WhatsApp</Text>
          <Text style={styles.infoText}>• Restore from any previous backup</Text>
        </View>

        {/* Backups List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📁 Saved Backups</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : backups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cloud-off-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No backups found</Text>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Click "Create New Backup" to save your data</Text>
          </View>
        ) : (
          backups.map(backup => (
            <View key={backup.name} style={[styles.backupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.backupIcon}>
                <MaterialCommunityIcons name="cloud-check" size={30} color={colors.primary} />
              </View>
              <View style={styles.backupInfo}>
                <Text style={[styles.backupName, { color: colors.text }]}>{backup.name}</Text>
                <Text style={[styles.backupMeta, { color: colors.textSecondary }]}>
                  📅 {formatDate(backup.date)} • 💾 {formatSize(backup.size)}
                </Text>
              </View>
              <View style={styles.backupActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(backup)}>
                  <Ionicons name="share-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => {
                  setSelectedBackup(backup);
                  setShowConfirmModal(true);
                }}>
                  <MaterialCommunityIcons name="restore" size={20} color="#FF9800" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(backup)}>
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Restore Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="alert-circle" size={50} color="#FF9800" />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Restore Backup?</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              This will overwrite all current student data with the backup data.
            </Text>
            <Text style={[styles.modalWarning, { color: '#FF9800' }]}>
              ⚠️ This action cannot be undone!
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.restoreBtn]} 
                onPress={handleRestore}
                disabled={restoring}
              >
                {restoring ? <ActivityIndicator color="#fff" /> : <Text style={styles.restoreBtnText}>Restore</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#e0e0e0', marginTop: 5 },
  content: { flex: 1, padding: 16 },
  createBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 12, elevation: 3 },
  templateBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 20, elevation: 3 },
  createGradient: { flexDirection: 'row', padding: 16, justifyContent: 'center', alignItems: 'center', gap: 10 },
  templateGradient: { flexDirection: 'row', padding: 16, justifyContent: 'center', alignItems: 'center', gap: 10 },
  createText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  disabledBtn: { opacity: 0.6 },
  infoCard: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  infoTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  infoText: { fontSize: 12, marginBottom: 4, opacity: 0.8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, marginTop: 10 },
  emptySubText: { fontSize: 12, marginTop: 5 },
  backupCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  backupIcon: { marginRight: 12 },
  backupInfo: { flex: 1 },
  backupName: { fontSize: 13, fontWeight: '500' },
  backupMeta: { fontSize: 11, marginTop: 2 },
  backupActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 20, borderRadius: 16, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15 },
  modalText: { fontSize: 14, textAlign: 'center', marginTop: 10 },
  modalWarning: { fontSize: 12, marginTop: 15 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#e0e0e0' },
  cancelBtnText: { color: '#333', fontWeight: 'bold' },
  restoreBtn: { backgroundColor: '#FF9800' },
  restoreBtnText: { color: '#fff', fontWeight: 'bold' },
});