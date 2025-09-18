import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface LocationWithAddress extends Coords {
  address?: string;
}

export function useLocation() {
  const [location, setLocation] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  // Get address from coordinates
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      
      if (result && result.length > 0) {
        const address = result[0];
        const parts = [
          address.street,
          address.city || address.subregion,
          address.region,
          address.country
        ].filter(Boolean);
        
        return parts.join(', ') || 'Address not found';
      }
      return 'Address not found';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Address lookup failed';
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasLocationPermission(true);
        startLocationTracking();
      } else {
        setLocationError('Permission to access location was denied');
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to function properly. Please grant permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Permission', onPress: requestLocationPermission }
          ]
        );
      }
    } catch (error) {
      setLocationError('Failed to request location permission');
    }
  };

  const startLocationTracking = async () => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 3000,
          distanceInterval: 0,
        },
        async (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          
          setLocation(coords);
          
          // Get address for current location
          try {
            const address = await getAddressFromCoords(coords.latitude, coords.longitude);
            setCurrentAddress(address);
          } catch (error) {
            console.error('Error getting address for current location:', error);
          }
        }
      );
      
      return () => subscription.remove();
    } catch (error: any) {
      setLocationError(error.message);
    }
  };

  return {
    location,
    locationError,
    hasLocationPermission,
    currentAddress,
    requestLocationPermission,
    getAddressFromCoords
  };
}