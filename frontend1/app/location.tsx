import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Button, Text } from '../components/ui';
import RealTimeLocation from '../components/Location';
import { ProtectedRoute } from '../components/ProtectedRoute';

export default function LocationScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ProtectedRoute>
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-8">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-foreground mb-2">
                Real-Time Location
              </Text>
              <Text className="text-lg text-muted-foreground mb-4">
                Welcome, {user?.name}!
              </Text>
              <Text className="text-base text-muted-foreground">
                Phone: {user?.phoneNumber}
              </Text>
            </View>

            {/* Location Component */}
            <View className="flex-1 mb-8">
              <View className="bg-white rounded-lg p-6 shadow-sm border border-border">
                <Text className="text-xl font-semibold text-foreground mb-4">
                  Your Current Location
                </Text>
                <RealTimeLocation />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="space-y-4">
              <Button
                title="Go to Profile"
                onPress={() => router.push('/profile')}
                variant="default"
                className="w-full"
              />
              
              <Button
                title="Logout"
                onPress={handleLogout}
                variant="outline"
                className="w-full"
              />
            </View>

            {/* Footer Info */}
            <View className="mt-8 pt-6 border-t border-border">
              <Text className="text-center text-sm text-muted-foreground leading-relaxed">
                Your location is being tracked in real-time for security and safety purposes.
                You can disable location sharing in your device settings.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}