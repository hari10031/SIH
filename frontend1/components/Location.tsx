import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text } from './ui';
import * as Location from 'expo-location';

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export default function RealTimeLocation() {
  const [location, setLocation] = useState<Coords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest, 
            timeInterval: 3000,                 
            distanceInterval: 0,                
          },
          (pos) => {
            setLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          }
        );
      } catch (err: any) {
        setErrorMsg(err.message);
      }
    })();

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

  return (
    <View className="flex-1 justify-center items-center py-4">
      {errorMsg && (
        <Text className="text-red-500 text-base text-center mb-4">
          {errorMsg}
        </Text>
      )}
      {location ? (
        <>
          <View className="space-y-2 w-full">
            <View className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg">
              <Text className="text-sm font-medium text-gray-600">Latitude:</Text>
              <Text className="text-sm font-mono text-gray-900">{location.latitude.toFixed(6)}</Text>
            </View>
            <View className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg">
              <Text className="text-sm font-medium text-gray-600">Longitude:</Text>
              <Text className="text-sm font-mono text-gray-900">{location.longitude.toFixed(6)}</Text>
            </View>
            <View className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg">
              <Text className="text-sm font-medium text-gray-600">Accuracy:</Text>
              <Text className="text-sm font-mono text-gray-900">
                {location.accuracy ? `${location.accuracy.toFixed(1)}m` : 'N/A'}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <Text className="text-base text-gray-600 text-center">
          Fetching location…
        </Text>
      )}
    </View>
  );
}
