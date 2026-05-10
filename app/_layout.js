import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profileSetup" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ title: 'Scan Report Card', headerBackTitle: 'Back' }} />
      <Stack.Screen name="editData" options={{ title: 'Edit Marks', headerBackTitle: 'Back' }} />
      <Stack.Screen name="studentList" options={{ title: 'Student Profiles', headerBackTitle: 'Back' }} />
      <Stack.Screen name="studentDetails" options={{ title: 'Student Details', headerBackTitle: 'Back' }} />
      <Stack.Screen name="portal" options={{ title: 'School Portal', headerBackTitle: 'Back' }} />
      <Stack.Screen name="templates" options={{ title: 'Templates', headerBackTitle: 'Back' }} />
      <Stack.Screen name="exports" options={{ title: 'Exports', headerBackTitle: 'Back' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports', headerBackTitle: 'Back' }} />
    </Stack>
  );
}