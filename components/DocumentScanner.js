import {
  ResultFormatOptions,
  ScannerModeOptions,
  launchDocumentScannerAsync,
} from '@infinitered/react-native-mlkit-document-scanner';
import * as FileSystem from 'expo-file-system/legacy';
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
        const options = {
          pageLimit: 1,
          galleryImportAllowed: true,
          scannerMode: ScannerModeOptions.FULL,
          resultFormats: ResultFormatOptions.JPEG,
        };

        const result = await launchDocumentScannerAsync(options);

        if (!result.canceled && result.pages?.[0]) {
          const imageUri = result.pages[0];
          
          let base64Data = null;
          try {
            console.log("🔄 Converting to base64...");
            // ✅ সরাসরি 'base64' স্ট্রিং ব্যবহার করুন
            base64Data = await FileSystem.readAsStringAsync(imageUri, {
              encoding: 'base64',
            });
            console.log("✅ Base64 done, length:", base64Data?.length);
          } catch (err) {
            console.log("❌ Base64 error:", err.message);
          }
          
          onScanComplete(imageUri, base64Data);
        }
      } catch (error) {
        console.error('Scanner error:', error);
        Alert.alert('Error', 'Scanner could not open. Please try again.');
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
            {launching ? 'Opening scanner...' : 'Preparing...'}
          </Text>
          <Text style={styles.subtitle}>
            Auto edge detection, crop, and perspective correction
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