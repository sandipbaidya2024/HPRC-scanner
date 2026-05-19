import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { ThemeProvider } from '../context/ThemeContext';

export default function Layout() {
  useEffect(() => {
    // গ্লোবাল error handler
    const errorHandler = (error, isFatal) => {
      console.error('Global error:', error);
      if (isFatal) {
        Alert.alert(
          'Unexpected Error',
          'Something went wrong. Please restart the app.\n\nError: ' + error.message,
          [{ text: 'OK' }]
        );
      }
    };
    
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler(errorHandler);
    
    return () => {
      ErrorUtils.setGlobalHandler(originalHandler);
    };
  }, []);

  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="profileSetup" options={{ headerShown: false }} />
        <Stack.Screen name="editData" options={{ title: 'Edit Marks', headerBackTitle: 'Back' }} />
        <Stack.Screen name="studentList" options={{ title: 'Student Profiles', headerBackTitle: 'Back' }} />
        <Stack.Screen name="studentDetails" options={{ title: 'Student Details', headerBackTitle: 'Back' }} />
        <Stack.Screen name="portal" options={{ title: 'School Portal', headerBackTitle: 'Back' }} />
        <Stack.Screen name="reports" options={{ title: 'Reports', headerBackTitle: 'Back' }} />
      </Stack>
    </ThemeProvider>
  );
}