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

export default function DocumentScanner({ visible, onClose, onScanComplete, initialMode }) {
  const [launching, setLaunching] = useState(false);
  const launchedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      launchedRef.current = false;
      setLaunching(false);
      return;
    }

    if (launchedRef.current) {
      return;
    }

    launchedRef.current = true;

    const launchScanner = async () => {
      if (Platform.OS === 'web') {
        Alert.alert('Not supported', 'Real-time document scanner is not available on web.');
        onClose();
        return;
      }

      setLaunching(true);

      try {
        // 🔥 MLKit লাইব্রেরি galleryImportAllowed true থাকলেই Gallery বাটন দেখায়
        // কিন্তু সরাসরি gallery mode এ খোলার API নেই
        // তাই আমরা galleryImportAllowed: true রেখে দিচ্ছি
        const options = {
          pageLimit: 1,
          galleryImportAllowed: true,  // Gallery বাটন দেখাবে
          scannerMode: ScannerModeOptions.FULL,
          resultFormats: ResultFormatOptions.JPEG,
        };

        const result = await launchDocumentScannerAsync(options);

        if (!result.canceled && result.pages?.[0]) {
          onScanComplete(result.pages[0]);
        }
      } catch (error) {
        console.error('Document scanner error:', error);
        Alert.alert(
          'Scanner unavailable',
          'Native document scanner could not be opened. Build a fresh Android/iOS dev client after installing native modules.'
        );
      } finally {
        setLaunching(false);
        onClose();
      }
    };

    launchScanner();
  }, [visible, onClose, onScanComplete, initialMode]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.title}>
            {launching ? 'Opening document scanner...' : 'Preparing scanner...'}
          </Text>
          <Text style={styles.subtitle}>
            {initialMode === 'gallery' 
              ? 'Opening gallery... You can select a document from your gallery.' 
              : 'Auto edge detection, crop, perspective correction, and cleanup are handled natively.'}
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
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
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    textAlign: 'center',
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