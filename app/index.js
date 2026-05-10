import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DocumentScanner from '../components/DocumentScanner';
import ScanningAnimation from '../components/ScanningAnimation';
import UpdateNotification from '../components/UpdateNotification';
import { getAppVersion, getProfile, getStudents, setAppVersion } from '../utils/database';
import { createEmptyStudent, parseStudentFromImage, toEditDataStudent } from '../utils/reportCard';

const { width } = Dimensions.get('window');

// Current App Version
const CURRENT_VERSION = '2.0.0';

// New Features List
const NEW_FEATURES = [
  {
    icon: '📄',
    title: 'Holistic Report Card Scanner',
    description: 'Scan 4 pages of Holistic Report Card at once. Complete student data extraction made easy! (Coming Soon)'
  },
  {
    icon: '🤖',
    title: 'AI-Powered OCR',
    description: 'Gemini AI integration for more accurate handwritten text recognition.'
  },
  {
    icon: '🌐',
    title: 'SMS Portal Auto-Fill',
    description: 'Live sync with Banglar Shiksha portal. Auto-fill marks with one click!'
  },
  {
    icon: '📊',
    title: 'Enhanced Reports',
    description: 'Generate LPCD, BCO, and consolidated reports in CSV/Excel format.'
  },
  {
    icon: '👨‍🏫',
    title: 'Multi-School Support',
    description: 'Now any school can use this app. Just enter your school name in profile!'
  }
];

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, classes: 0, scans: 0 });
  const [scannerVisible, setScannerVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Check profile and version
  useEffect(() => {
    checkProfileAndVersion();
  }, []);

  const checkProfileAndVersion = async () => {
    // Check Profile
    const savedProfile = await getProfile();
    if (!savedProfile) {
      router.replace('/profileSetup');
      return;
    }
    setProfile(savedProfile);
    loadStats();
    
    // Check Version for Update Notification
    const savedVersion = await getAppVersion();
    if (savedVersion !== CURRENT_VERSION) {
      setShowUpdateModal(true);
    }
  };

  const loadStats = async () => {
    const allStudents = await getStudents();
    const uniqueClasses = new Set(allStudents.map(s => s.class)).size;
    setStats({ 
      total: allStudents.length, 
      classes: uniqueClasses,
      scans: allStudents.filter(s => s.savedAt).length 
    });
  };

  // Regular Marks Register Scan
  const processScannedImage = async (imageUri) => {
    setIsProcessing(true);
    try {
      const parsedStudent = await parseStudentFromImage(imageUri);
      const nextStudent = toEditDataStudent(parsedStudent);
      
      setIsProcessing(false);
      router.push({
        pathname: '/editData',
        params: {
          imageUri: imageUri,
          data: JSON.stringify([nextStudent]),
        },
      });
    } catch (error) {
      console.error('OCR Error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to extract data from image');
      router.push({
        pathname: '/editData',
        params: {
          imageUri: imageUri,
          data: JSON.stringify([toEditDataStudent(createEmptyStudent())]),
        },
      });
    }
  };

  const openScanDocument = () => {
    setScannerVisible(true);
  };

  const showComingSoon = () => {
    Alert.alert(
      '🚀 Coming Soon!',
      'Holistic Report Card Scanner is under development.\n\nThis feature will allow you to scan 4 pages of Holistic Report Card at once.\n\nStay tuned for the next update!',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleUpdateModalClose = async () => {
    setShowUpdateModal(false);
    await setAppVersion(CURRENT_VERSION);
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Update Notification Modal */}
      <UpdateNotification
        visible={showUpdateModal}
        onClose={handleUpdateModalClose}
        version={CURRENT_VERSION}
        features={NEW_FEATURES}
      />
      
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>👋 Good {getGreeting()},</Text>
            <Text style={styles.teacherName}>{profile?.teacherName || 'Teacher'}</Text>
            <Text style={styles.schoolName}>{profile?.schoolName || 'School Name'}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profileSetup')}>
            <FontAwesome5 name="user-circle" size={36} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#4CAF50' }]}>
              <FontAwesome5 name="users" size={18} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>মোট ছাত্র</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#FF9800' }]}>
              <FontAwesome5 name="graduation-cap" size={18} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.classes}</Text>
            <Text style={styles.statLabel}>মোট ক্লাস</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#E91E63' }]}>
              <MaterialCommunityIcons name="scan-helper" size={18} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.scans}</Text>
            <Text style={styles.statLabel}>স্ক্যান সংরক্ষিত</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📸 স্ক্যানিং</Text>
          <Text style={styles.sectionSubtitle}>রিপোর্ট কার্ড স্ক্যান করুন</Text>
        </View>

        {/* Holistic Report Card Button - Coming Soon with Badge */}
        <TouchableOpacity 
          style={[styles.scanCard, styles.holisticCard]} 
          onPress={showComingSoon}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#9C27B0', '#6A1B9A']}
            style={styles.scanGradient}
          >
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
            <MaterialCommunityIcons name="file-document-multiple" size={42} color="white" />
            <Text style={styles.scanMainText}>Holistic Report Card</Text>
            <Text style={styles.scanSubText}>Scan 4 pages • Complete report at once</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* HPRC Marks Register Button */}
        <View style={styles.scanRow}>
          <TouchableOpacity 
            style={styles.scanCard} 
            onPress={openScanDocument}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.scanGradient}
            >
              <MaterialCommunityIcons name="camera-iris" size={42} color="white" />
              <Text style={styles.scanMainText}>Scan HPRC Marks Register</Text>
              <Text style={styles.scanSubText}>Camera • Gallery • Auto edge detection • AI OCR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Management Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 ম্যানেজমেন্ট</Text>
          <Text style={styles.sectionSubtitle}>স্টুডেন্ট ও পোর্টাল ম্যানেজ করুন</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/studentList')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#9C27B0', '#6A1B9A']}
            style={styles.menuIconGradient}
          >
            <FontAwesome5 name="users" size={22} color="white" />
          </LinearGradient>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Student Profiles</Text>
            <Text style={styles.menuDesc}>সকল ছাত্রছাত্রীর তথ্য দেখুন</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#c0c0c0" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/portal')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF9800', '#E65100']}
            style={styles.menuIconGradient}
          >
            <MaterialCommunityIcons name="web" size={24} color="white" />
          </LinearGradient>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>SMS Portal Auto-Fill</Text>
            <Text style={styles.menuDesc}>বাংলা শিক্ষা পোর্টালে অটো-ফিল</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#c0c0c0" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => router.push('/reports')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#009688', '#004D40']}
            style={styles.menuIconGradient}
          >
            <Ionicons name="document-text" size={22} color="white" />
          </LinearGradient>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Reports & Exports</Text>
            <Text style={styles.menuDesc}>PDF/Excel রিপোর্ট তৈরি করুন</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#c0c0c0" />
        </TouchableOpacity>

        {/* Templates & Exports Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📄 টেমপ্লেট ও ফাইল</Text>
          <Text style={styles.sectionSubtitle}>টেমপ্লেট ম্যানেজ ও এক্সপোর্ট</Text>
        </View>

        <View style={styles.rowTwoColumns}>
          <TouchableOpacity 
            style={styles.smallCard}
            onPress={() => router.push('/templates')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3F51B5', '#1A237E']}
              style={styles.smallCardGradient}
            >
              <MaterialCommunityIcons name="file-document-outline" size={36} color="white" />
              <Text style={styles.smallCardText}>Templates</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.smallCard}
            onPress={() => router.push('/exports')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#795548', '#3E2723']}
              style={styles.smallCardGradient}
            >
              <Ionicons name="folder-open-outline" size={36} color="white" />
              <Text style={styles.smallCardText}>Exports</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
        
      </ScrollView>

      {/* Processing Animation Modal */}
      <Modal
        visible={isProcessing}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <ScanningAnimation />
      </Modal>

      {/* HPRC Marks Register Scanner */}
      <DocumentScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanComplete={processScannedImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeText: { color: '#e3f2fd', fontSize: 14, fontWeight: '500' },
  teacherName: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  schoolName: { color: '#e3f2fd', fontSize: 12, marginTop: 2 },
  profileBtn: { padding: 5 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  statIconBg: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statNumber: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#e3f2fd', fontSize: 10, marginTop: 4, textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: { marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  sectionSubtitle: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  scanRow: { marginBottom: 24 },
  scanCard: { width: width - 32, borderRadius: 20, overflow: 'hidden', elevation: 4, marginBottom: 16 },
  holisticCard: { marginBottom: 16 },
  scanGradient: { padding: 20, alignItems: 'center', position: 'relative' },
  scanMainText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  scanSubText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, textAlign: 'center' },
  comingSoonBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, zIndex: 10 },
  comingSoonText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  menuItem: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12, elevation: 2 },
  menuIconGradient: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a2e' },
  menuDesc: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  rowTwoColumns: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  smallCard: { flex: 1, borderRadius: 16, overflow: 'hidden', elevation: 3 },
  smallCardGradient: { paddingVertical: 20, alignItems: 'center', gap: 8 },
  smallCardText: { color: 'white', fontSize: 14, fontWeight: '600' },
  bottomSpace: { height: 30 },
});