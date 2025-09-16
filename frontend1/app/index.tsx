import "./global.css"
import { View, ActivityIndicator, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuth } from '../contexts/AuthContext';
import { Button, Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import RealTimeLocation from '../components/Location';
 
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
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground mb-2">
              Welcome, {user?.name}!
            </Text>
            <Text className="text-lg text-muted-foreground mb-4">
              Real-Time Location Tracker
            </Text>
            <Text className="text-base text-muted-foreground">
              Phone: {user?.phoneNumber}
            </Text>
          </View>

          {/* Location Component */}
          <View className="flex-1 mb-8">
            <View className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <Text className="text-xl font-semibold text-foreground mb-4">
                Your Current Location
              </Text>
              <RealTimeLocation />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-4">
            <Button
              title="Logout"
              onPress={logout}
              variant="outline"
              className="w-full"
            />
          </View>

          {/* Footer Info */}
          <View className="mt-8 pt-6 border-t border-gray-200">
            <Text className="text-center text-sm text-gray-500 leading-relaxed">
              Your location is being tracked in real-time for security and safety purposes.
              You can disable location sharing in your device settings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}