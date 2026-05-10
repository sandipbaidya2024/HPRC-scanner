import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, FlatList, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Templates() {
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Formative Marks Template', type: 'csv', date: '2025-03-15', size: '24 KB' },
    { id: 2, name: 'Summative Marks Template', type: 'csv', date: '2025-03-14', size: '18 KB' },
    { id: 3, name: 'LPCD Assessment Template', type: 'xlsx', date: '2025-03-10', size: '45 KB' },
    { id: 4, name: 'BCO Grades Template', type: 'csv', date: '2025-03-08', size: '12 KB' },
  ]);

  const handleExport = (template) => {
    Alert.alert('Export Template', `Export ${template.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Export', onPress: () => Alert.alert('Success', 'Template exported successfully') },
    ]);
  };

  const handleShare = async (template) => {
    try {
      await Share.share({
        message: `Template: ${template.name}\nType: ${template.type}\nDate: ${template.date}`,
        title: template.name,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share template');
    }
  };

  const renderTemplate = ({ item }) => (
    <View style={styles.templateCard}>
      <View style={styles.templateIcon}>
        <Text style={styles.iconText}>{item.type === 'csv' ? '📊' : '📑'}</Text>
      </View>
      <View style={styles.templateInfo}>
        <Text style={styles.templateName}>{item.name}</Text>
        <Text style={styles.templateMeta}>{item.date} • {item.size}</Text>
      </View>
      <View style={styles.templateActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleExport(item)}>
          <Text style={styles.actionText}>📥</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
          <Text style={styles.actionText}>↗️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <Text style={styles.headerTitle}>📄 Template Manager</Text>
        <Text style={styles.headerSubtitle}>Manage your export templates</Text>
      </LinearGradient>

      <View style={styles.uploadSection}>
        <TouchableOpacity style={styles.uploadBtn}>
          <Text style={styles.uploadBtnText}>➕ Upload New Template</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTemplate}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.listHeader}>Saved Templates</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 25, paddingTop: 50, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#e0e0e0', marginTop: 5 },
  uploadSection: { padding: 15 },
  uploadBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center' },
  uploadBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, paddingHorizontal: 15 },
  listContent: { padding: 15 },
  templateCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, alignItems: 'center', elevation: 2 },
  templateIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  iconText: { fontSize: 24 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 16, fontWeight: '600', color: '#333' },
  templateMeta: { fontSize: 12, color: '#999', marginTop: 4 },
  templateActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8 },
  actionText: { fontSize: 20 },
});