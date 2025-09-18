import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from './ui';

type TabType = 'home' | 'upload';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
      <View className="flex-row justify-around">
        <TouchableOpacity
          onPress={() => onTabChange('home')}
          className={`flex-1 items-center py-2 ${activeTab === 'home' ? 'opacity-100' : 'opacity-50'}`}
        >
          <Text className="text-2xl mb-1">🏠</Text>
          <Text className={`text-sm ${activeTab === 'home' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => onTabChange('upload')}
          className={`flex-1 items-center py-2 ${activeTab === 'upload' ? 'opacity-100' : 'opacity-50'}`}
        >
          <Text className="text-2xl mb-1">📤</Text>
          <Text className={`text-sm ${activeTab === 'upload' ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
            Upload
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}