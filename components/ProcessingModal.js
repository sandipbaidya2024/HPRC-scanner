import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

export default function ProcessingModal({ visible, message, progress }) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.message}>{message}</Text>
          {progress && (
            <Text style={styles.progress}>{progress}</Text>
          )}
          <View style={styles.pulseDot} />
          <Text style={styles.hint}>Please wait...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  progress: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
  pulseDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a73e8',
    opacity: 0.3,
    marginTop: 20,
  },
});