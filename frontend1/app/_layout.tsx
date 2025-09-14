import { Stack } from "expo-router";
import { AuthProvider } from '../contexts/AuthContext';
import "./global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="verify-otp" />
      </Stack>
    </AuthProvider>
  );
}
