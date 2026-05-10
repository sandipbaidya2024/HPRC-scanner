import {
    ResultFormatOptions,
    ScannerModeOptions,
    launchDocumentScannerAsync,
} from '@infinitered/react-native-mlkit-document-scanner';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HolisticScanner({ visible, onClose, onScanComplete }) {
  const [scanning, setScanning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [scannedPages, setScannedPages] = useState([]);
  const launchedRef = useRef(false);

  const pageNames = {
    1: 'Student Info',
    2: 'Formative & Summative Marks',
    3: 'LPCD Assessment',
    4: 'BCO Assessment',
  };

  useEffect(() => {
    if (!visible) {
      launchedRef.current = false;
      setScanning(false);
      setCurrentPage(1);
      setScannedPages([]);
      return;
    }

    if (launchedRef.current) {
      return;
    }

    launchedRef.current = true;
    scanNextPage();
  }, [visible]);

  const scanNextPage = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'Scanner is not available on web.');
      onClose();
      return;
    }

    setScanning(true);

    try {
      const result = await launchDocumentScannerAsync({
        pageLimit: 1,
        galleryImportAllowed: true,
        scannerMode: ScannerModeOptions.FULL,
        resultFormats: ResultFormatOptions.JPEG,
      });

      if (!result.canceled && result.pages?.[0]) {
        const newPages = [...scannedPages, result.pages[0]];
        setScannedPages(newPages);

        if (currentPage < 4) {
          setCurrentPage(currentPage + 1);
          Alert.alert(
            `Page ${currentPage} of 4 Scanned`,
            `✅ ${pageNames[currentPage]} completed.\n\n📄 Please scan the next page: ${pageNames[currentPage + 1]}`,
            [{ text: 'Continue Scanning', onPress: scanNextPage }]
          );
        } else {
          // All 4 pages scanned
          Alert.alert(
            'Scan Complete!',
            'All 4 pages have been scanned. Processing your holistic report card...',
            [{ text: 'OK' }]
          );
          onScanComplete(newPages);
          onClose();
        }
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Scanner error:', error);
      Alert.alert('Error', 'Failed to scan page');
      onClose();
    } finally {
      setScanning(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.title}>
            {scanning ? `Scanning ${pageNames[currentPage]}...` : 'Preparing scanner...'}
          </Text>
          <Text style={styles.subtitle}>
            Holistic Report Card Scanner
          </Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${(currentPage / 4) * 100}%` }]} />
          </View>
          <Text style={styles.pageInfo}>
            Page {currentPage} of 4 • {pageNames[currentPage]}
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1a73e8',
    borderRadius: 3,
  },
  pageInfo: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  cancelButton: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a73e8',
  },
});