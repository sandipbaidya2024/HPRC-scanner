import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Linking, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DocumentScanner from '../components/DocumentScanner';
import ScanningAnimation from '../components/ScanningAnimation';
import ThemeToggle from '../components/ThemeToggle';
import UpdateNotification from '../components/UpdateNotification';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { getAppVersion, getProfile, getStudents, setAppVersion } from '../utils/database';
import { createEmptyStudent, parseStudentFromImage, toEditDataStudent } from '../utils/reportCard';

const { width } = Dimensions.get('window');

const CURRENT_VERSION = '2.0.0';

const NEW_FEATURES = [
  { icon: '📄', title: 'Holistic Report Card Scanner', description: 'Scan 4 pages at once. Complete student data extraction!' },
  { icon: '🤖', title: 'AI-Powered OCR', description: 'Gemini AI for accurate handwritten text recognition.' },
  { icon: '🌐', title: 'SMS Portal Auto-Fill', description: 'Live sync with Banglar Shiksha portal.' },
  { icon: '📊', title: 'Enhanced Reports', description: 'Generate LPCD, BCO reports in PDF format.' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, classes: 0, scans: 0 });
  const [scannerVisible, setScannerVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    checkProfileAndVersion();
  }, []);

  const checkProfileAndVersion = async () => {
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/profileSetup');
      return;
    }
    setProfile(savedProfile);
    loadStats();
    const savedVersion = await getAppVersion();
    if (savedVersion !== CURRENT_VERSION) setShowUpdateModal(true);
  };

  const loadStats = async () => {
    const allStudents = await getStudents();
    const uniqueClasses = new Set(allStudents.map(s => s.class)).size;
    setStats({ total: allStudents.length, classes: uniqueClasses, scans: allStudents.filter(s => s.savedAt).length });
  };

  const processScannedImage = async (imageUri) => {
    setIsProcessing(true);
    try {
      const parsedStudent = await parseStudentFromImage(imageUri);
      const nextStudent = toEditDataStudent(parsedStudent);
      setIsProcessing(false);
      router.push({ pathname: '/editData', params: { imageUri: imageUri, data: JSON.stringify([nextStudent]) } });
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to extract data from image');
      router.push({ pathname: '/editData', params: { imageUri: imageUri, data: JSON.stringify([toEditDataStudent(createEmptyStudent())]) } });
    }
  };

  const openScanDocument = () => setScannerVisible(true);
  const showComingSoon = () => Alert.alert('Coming Soon!', 'Holistic Report Card Scanner is under development.\n\nStay tuned!', [{ text: 'OK' }]);
  const handleUpdateModalClose = async () => { setShowUpdateModal(false); await setAppVersion(CURRENT_VERSION); };
  const getGreeting = () => { const hour = new Date().getHours(); if (hour < 12) return 'Morning'; if (hour < 17) return 'Afternoon'; return 'Evening'; };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <UpdateNotification visible={showUpdateModal} onClose={handleUpdateModalClose} version={CURRENT_VERSION} features={NEW_FEATURES} />

      {/* Header */}
      <LinearGradient colors={colors.headerGradient} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>👋 Good {getGreeting()},</Text>
            <Text style={styles.teacherName}>{profile?.teacherName || 'Teacher'}</Text>
            <Text style={[styles.schoolName, { color: colors.statText }]}>{profile?.schoolName || 'School Name'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ThemeToggle />
            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profileSetup')}>
              <FontAwesome5 name="user-circle" size={36} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.statCardBg }]}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.statText }]}>Students</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.statCardBg }]}>
            <Text style={styles.statNumber}>{stats.classes}</Text>
            <Text style={[styles.statLabel, { color: colors.statText }]}>Classes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.statCardBg }]}>
            <Text style={styles.statNumber}>{stats.scans}</Text>
            <Text style={[styles.statLabel, { color: colors.statText }]}>Scans</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>

        {/* SECTION 1: CAPTURE & SCAN */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📷 CAPTURE & SCAN</Text>

          <View style={styles.rowTwoColumns}>
            <TouchableOpacity style={[styles.menuCard, { backgroundColor: '#4CAF50' }]} onPress={openScanDocument}>
              <MaterialCommunityIcons name="camera-iris" size={40} color="white" />
              <Text style={styles.menuCardTitle}>Scan HPRC Register</Text>
              <Text style={styles.menuCardDesc}>Camera • Gallery • Auto crop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuCard, { backgroundColor: '#9C27B0' }]} onPress={showComingSoon}>
              <MaterialCommunityIcons name="file-document-multiple" size={40} color="white" />
              <Text style={styles.menuCardTitle}>Holistic Report Card</Text>
              <Text style={styles.menuCardDesc}>Coming Soon</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* 
// Backup & Restore Button - HIDDEN
<TouchableOpacity 
  style={[styles.menuCard, { backgroundColor: '#607D8B' }]}
  onPress={() => router.push('/backup')}
>
  <MaterialCommunityIcons name="cloud-upload" size={40} color="white" />
  <Text style={styles.menuCardTitle}>Backup & Restore</Text>
  <Text style={styles.menuCardDesc}>Save & restore your data</Text>
</TouchableOpacity>
*/}

        {/* SECTION 2: DATABASE & SMS PORTAL */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>💾 DATABASE & SMS PORTAL</Text>

          <View style={styles.rowTwoColumns}>
            <TouchableOpacity style={[styles.menuCard, { backgroundColor: '#2196F3' }]} onPress={() => router.push('/studentList')}>
              <FontAwesome5 name="users" size={40} color="white" />
              <Text style={styles.menuCardTitle}>Student Profiles</Text>
              <Text style={styles.menuCardDesc}>View & manage records</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuCard, { backgroundColor: '#FF9800' }]} onPress={() => router.push('/portal')}>
              <MaterialCommunityIcons name="web" size={40} color="white" />
              <Text style={styles.menuCardTitle}>SMS Portal Auto-Fill</Text>
              <Text style={styles.menuCardDesc}>Live sync & auto fill</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* SECTION 3: DOWNLOAD REPORTS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 DOWNLOAD REPORTS</Text>

          <View style={styles.reportGrid}>
            <TouchableOpacity style={[styles.reportCard, { backgroundColor: '#4CAF50' }]} onPress={() => router.push('/reports?type=academic')}>
              <Text style={styles.reportIcon}>📊</Text>
              <Text style={styles.reportTitle}>Academic Report</Text>
              <Text style={styles.reportDesc}>Formative & Summative</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.reportCard, { backgroundColor: '#00BCD4' }]} onPress={() => router.push('/reports?type=lpcd')}>
              <Text style={styles.reportIcon}>🧠</Text>
              <Text style={styles.reportTitle}>LPCD Report</Text>
              <Text style={styles.reportDesc}>Learning Perspective</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.reportCard, { backgroundColor: '#3F51B5' }]} onPress={() => router.push('/reports?type=bco')}>
              <Text style={styles.reportIcon}>🎯</Text>
              <Text style={styles.reportTitle}>BCO Report</Text>
              <Text style={styles.reportDesc}>Behavioural Outcomes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.reportCard, { backgroundColor: '#9C27B0' }]} onPress={() => router.push('/reports?type=dpls')}>
              <Text style={styles.reportIcon}>🌟</Text>
              <Text style={styles.reportTitle}>DPLS Report</Text>
              <Text style={styles.reportDesc}>Personality & Life Skills</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* YouTube Video Guide Button */}
        <TouchableOpacity
          style={styles.youtubeHelpBtn}
          onPress={() => {
            Linking.openURL('https://www.youtube.com/watch?v=YOUR_VIDEO_ID'); // আপনার লিংক দিন
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FF0000', '#CC0000']}
            style={styles.youtubeGradient}
          >
            <FontAwesome5 name="youtube" size={24} color="white" />
            <Text style={styles.youtubeHelpText}>🎥 Watch Video Guide</Text>
            <Text style={styles.youtubeHelpSubText}>Learn how to use this app</Text>
          </LinearGradient>
        </TouchableOpacity>

      
        {/* WhatsApp Support Button */}
        <TouchableOpacity style={styles.whatsappButton} onPress={() => Linking.openURL('https://wa.me/919876543210?text=Hello!%20I%20need%20help%20with%20Banglar%20Shiksha%20Assistant%20app')}>
          <LinearGradient colors={['#25D366', '#128C7E']} style={styles.whatsappGradient}>
            <FontAwesome5 name="whatsapp" size={24} color="white" />
            <View>
              <Text style={styles.whatsappText}>Connect on WhatsApp</Text>
              <Text style={styles.whatsappSubText}>Tap to chat with support</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <Modal visible={isProcessing} transparent animationType="fade" onRequestClose={() => { }}>
        <ScanningAnimation />
      </Modal>

      <DocumentScanner visible={scannerVisible} onClose={() => setScannerVisible(false)} onScanComplete={processScannedImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeText: { color: '#e3f2fd', fontSize: 14, fontWeight: '500' },
  teacherName: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  schoolName: { color: '#e3f2fd', fontSize: 12, marginTop: 2 },
  profileBtn: { padding: 5 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  statNumber: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 12 },
  rowTwoColumns: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  menuCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 3 },
  menuCardTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  menuCardDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 4, textAlign: 'center' },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  reportCard: { width: (width - 44) / 2, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 3 },
  reportIcon: { fontSize: 32, color: 'white', marginBottom: 8 },
  reportTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  reportDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 4, textAlign: 'center' },
  whatsappButton: { marginTop: 20, marginBottom: 10, borderRadius: 16, overflow: 'hidden', elevation: 4 },
  whatsappGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  whatsappText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  whatsappSubText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2 },
  bottomSpace: { height: 30 },
  // YouTube Button Styles
youtubeHelpBtn: {
  marginTop: 10,
  marginBottom: 10,
  borderRadius: 16,
  overflow: 'hidden',
  elevation: 4,
},
youtubeGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 14,
  gap: 12,
},
youtubeHelpText: {
  flex: 1,
  color: '#fff',
  fontSize: 15,
  fontWeight: 'bold',
},
youtubeHelpSubText: {
  color: 'rgba(255,255,255,0.8)',
  fontSize: 10,
  position: 'absolute',
  bottom: 6,
  right: 16,
},

// WhatsApp Button Styles
whatsappButton: {
  marginTop: 10,
  marginBottom: 20,
  borderRadius: 16,
  overflow: 'hidden',
  elevation: 4,
},
whatsappGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  gap: 12,
},
whatsappText: {
  flex: 1,
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
whatsappSubText: {
  color: 'rgba(255,255,255,0.8)',
  fontSize: 10,
  position: 'absolute',
  bottom: 6,
  right: 16,
},
});