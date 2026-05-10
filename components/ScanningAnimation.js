import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export default function ScanningAnimation() {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scan line animation (up and down)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for the document
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const pulseScale = pulseAnim;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a73e8', '#0d47a1']}
        style={styles.card}
      >
        {/* Document Icon with Pulse */}
        <Animated.View style={[styles.documentIcon, { transform: [{ scale: pulseScale }] }]}>
          <View style={styles.docShape}>
            <View style={styles.docCorner} />
            <View style={[styles.docLine, { width: 60 }]} />
            <View style={[styles.docLine, { width: 40 }]} />
            <View style={[styles.docLine, { width: 50 }]} />
          </View>
        </Animated.View>

        {/* Scanning Line */}
        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.8)', 'transparent']}
            style={styles.scanLineGradient}
          />
        </Animated.View>

        {/* Text */}
        <Text style={styles.title}>Scanning Document...</Text>
        <Text style={styles.subtitle}>AI is analyzing your report card</Text>
        
        {/* Dots Animation */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  card: {
    width: '85%',
    padding: 40,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  documentIcon: {
    width: 100,
    height: 120,
    marginBottom: 30,
  },
  docShape: {
    width: 80,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  docCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#1a73e8',
  },
  docLine: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 4,
  },
  scanLine: {
    position: 'absolute',
    width: '70%',
    height: 4,
    top: 90,
  },
  scanLineGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 8,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dot1: {
    opacity: 1,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.3,
  },
});