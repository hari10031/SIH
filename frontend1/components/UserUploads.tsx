import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from './ui';

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface UploadData {
  id: string;
  description: string;
  timestamp: string;
  location?: Coords;
  imageSource?: 'camera' | 'gallery';
  locationType?: 'automatic' | 'manual' | 'none';
  hasVoiceNote?: boolean;
  voiceNoteDuration?: number | null;
  status?: string;
}

interface UserUploadsProps {
  uploads: UploadData[];
}

export default function UserUploads({ uploads }: UserUploadsProps) {
  return (
    <View className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-20">
      <Text className="text-xl font-semibold text-foreground mb-4">
        Your Uploads ({uploads.length})
      </Text>
      
      {uploads.length === 0 ? (
        <Text className="text-gray-500 text-center py-8">
          No uploads yet
        </Text>
      ) : (
        <ScrollView className="max-h-64">
          {uploads.map((upload) => (
            <View key={upload.id} className="border border-gray-200 rounded-lg p-4 mb-3">
              <Text className="text-sm text-gray-500 flex-row items-center">
                {new Date(upload.timestamp).toLocaleDateString()}
                {upload.imageSource && (
                  <Text className="ml-2">
                    {upload.imageSource === 'camera' ? '📷' : '🖼️'}
                  </Text>
                )}
              </Text>
              <Text className="text-gray-800 mt-1">{upload.description}</Text>
              
              <View className="flex-row flex-wrap mt-2 space-x-4">
                {upload.location && (
                  <Text className="text-green-600 text-xs">
                    📍 {upload.locationType === 'automatic' ? 'Auto location' : 'Manual location'}
                  </Text>
                )}
                {upload.hasVoiceNote && (
                  <Text className="text-blue-600 text-xs">
                    🎤 Voice note
                    {upload.voiceNoteDuration && (
                      <Text className="ml-1">({Math.floor(upload.voiceNoteDuration / 60)}:{(upload.voiceNoteDuration % 60).toString().padStart(2, '0')})</Text>
                    )}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}