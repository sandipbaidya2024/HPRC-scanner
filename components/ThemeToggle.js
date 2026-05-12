import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ style }) {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={toggleTheme}>
      <Ionicons 
        name={isDark ? 'sunny' : 'moon'} 
        size={24} 
        color={colors.primary} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});