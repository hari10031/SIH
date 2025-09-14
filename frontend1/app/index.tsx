import "./global.css"
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from '../contexts/AuthContext';
import { Button, Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
 
export default function Index() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-background px-6">
      <View className="items-center">
        <Text className="text-3xl font-bold text-foreground mb-4">
          Welcome, {user?.name}!
        </Text>
        <Text className="text-lg text-muted-foreground mb-8 text-center">
          You are successfully logged in.
        </Text>
        <Text className="text-base text-muted-foreground mb-8">
          Phone: {user?.phoneNumber}
        </Text>
        <Button
          title="Logout"
          onPress={logout}
          variant="outline"
          className="w-full"
        />
      </View>
    </SafeAreaView>
  );
}