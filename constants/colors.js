export const lightColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1a1a2e',
  textSecondary: '#7f8c8d',
  border: '#e0e0e0',
  primary: '#1a73e8',
  primaryDark: '#0d47a1',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  icon: '#666666',
  headerGradient: ['#1a73e8', '#0d47a1'],
  statCardBg: 'rgba(255,255,255,0.15)',
  statText: '#e3f2fd',
};

export const darkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  primary: '#1a73e8',
  primaryDark: '#0d47a1',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  icon: '#B0B0B0',
  headerGradient: ['#0d47a1', '#0a3d8f'],
  statCardBg: 'rgba(0,0,0,0.3)',
  statText: '#cccccc',
};

export const getColors = (isDark) => isDark ? darkColors : lightColors;