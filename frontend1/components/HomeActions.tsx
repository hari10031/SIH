import React from 'react';
import { View } from 'react-native';
import { Button } from './ui';
import { router } from 'expo-router';

interface HomeActionsProps {
  onLogout: () => void;
}

export default function HomeActions({ onLogout }: HomeActionsProps) {
  return (
    <View className="space-y-4 mb-20">
      <Button
        title="Go to Profile"
        onPress={() => router.push('/profile')}
        variant="default"
        className="w-full"
      />
      
      <Button
        title="Logout"
        onPress={onLogout}
        variant="outline"
        className="w-full"
      />
    </View>
  );
}