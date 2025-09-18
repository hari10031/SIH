import React from 'react';
import { View } from 'react-native';
import { Button, Text } from './ui';

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface LocationTrackerProps {
  location: Coords | null;
  locationError: string | null;
  hasLocationPermission: boolean;
  onRequestPermission: () => void;
}

export default function LocationTracker({
  location,
  locationError,
  hasLocationPermission,
  onRequestPermission
}: LocationTrackerProps) {
  return (
    <View className="mb-8">
      <View className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <Text className="text-xl font-semibold text-foreground mb-4">
          Your Current Location
        </Text>
        
        {locationError && (
          <Text className="text-red-500 text-base text-center mb-4">
            {locationError}
          </Text>
        )}
        
        {!hasLocationPermission ? (
          <View className="items-center py-4">
            <Text className="text-gray-600 text-center mb-4">
              Location permission is required
            </Text>
            <Button
              title="Grant Permission"
              onPress={onRequestPermission}
              variant="default"
            />
          </View>
        ) : location ? (
          <View className="space-y-2">
            <View className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg">
              <Text className="text-sm font-medium text-gray-600">Latitude:</Text>
              <Text className="text-sm font-mono text-gray-900">
                {location.latitude.toFixed(6)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg">
              <Text className="text-sm font-medium text-gray-600">Longitude:</Text>
              <Text className="text-sm font-mono text-gray-900">
                {location.longitude.toFixed(6)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg">
              <Text className="text-sm font-medium text-gray-600">Accuracy:</Text>
              <Text className="text-sm font-mono text-gray-900">
                {location.accuracy ? `${location.accuracy.toFixed(1)}m` : 'N/A'}
              </Text>
            </View>
          </View>
        ) : (
          <Text className="text-base text-gray-600 text-center py-4">
            Fetching location…
          </Text>
        )}
      </View>
    </View>
  );
}