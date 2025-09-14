import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-foreground mb-8">Profile</Text>
        
        <View className="bg-muted rounded-lg p-6 mb-6">
          <Text className="text-lg font-semibold text-foreground mb-4">User Information</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-muted-foreground">Name</Text>
            <Text className="text-base text-foreground">{user?.name}</Text>
          </View>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-muted-foreground">Phone Number</Text>
            <Text className="text-base text-foreground">{user?.phoneNumber}</Text>
          </View>
          
          {user?.email && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-muted-foreground">Email</Text>
              <Text className="text-base text-foreground">{user.email}</Text>
            </View>
          )}
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-muted-foreground">Verification Status</Text>
            <Text className={`text-base ${user?.isVerified ? 'text-green-600' : 'text-orange-600'}`}>
              {user?.isVerified ? 'Verified' : 'Pending Verification'}
            </Text>
          </View>
        </View>
        
        <Button
          title="Logout"
          onPress={logout}
          variant="destructive"
          className="w-full"
        />
      </ScrollView>
    </SafeAreaView>
  );
}