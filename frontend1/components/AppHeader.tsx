import React from 'react';
import { View } from 'react-native';
import { Text } from './ui';

interface User {
  name?: string;
  phoneNumber?: string;
}

interface AppHeaderProps {
  user: User | null;
  activeTab: 'home' | 'upload';
}

export default function AppHeader({ user, activeTab }: AppHeaderProps) {
  const getSubtitle = () => {
    return activeTab === 'home' ? 'Real-Time Location Tracker' : 'Upload Your Content';
  };

  return (
    <View className="mb-8">
      <Text className="text-3xl font-bold text-foreground mb-2">
        Welcome, {user?.name}!
      </Text>
      <Text className="text-lg text-muted-foreground mb-4">
        {getSubtitle()}
      </Text>
      <Text className="text-base text-muted-foreground">
        Phone: {user?.phoneNumber}
      </Text>
    </View>
  );
}