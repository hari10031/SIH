import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, Modal, Linking } from 'react-native';
import { Button, Text, Input } from './ui';
import * as Location from 'expo-location';
// import InAppMap from './InAppMap';
import InAppMap from './InAppMap';

interface Coords {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  currentLocation?: Coords | null;
  initialLocation?: LocationData | null;
}

export default function LocationPicker({ 
  onLocationSelect, 
  currentLocation, 
  initialLocation 
}: LocationPickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isInAppMapVisible, setIsInAppMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [manualCoords, setManualCoords] = useState({
    latitude: initialLocation?.latitude?.toString() || '',
    longitude: initialLocation?.longitude?.toString() || '',
  });
  const [manualAddress, setManualAddress] = useState(initialLocation?.address || '');

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      setIsLoadingAddress(true);
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
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Use current GPS location
  const useCurrentLocation = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available');
      return;
    }

    const address = await getAddressFromCoords(
      currentLocation.latitude, 
      currentLocation.longitude
    );

    const locationData: LocationData = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      address
    };

    setSelectedLocation(locationData);
    setManualCoords({
      latitude: currentLocation.latitude.toString(),
      longitude: currentLocation.longitude.toString()
    });
    setManualAddress(address);
    onLocationSelect(locationData);
  };

  // Enhanced location selection with in-app map
  const openMapForSelection = () => {
    Alert.alert(
      '📍 Select Location',
      'Choose how you want to set your location:',
      [
        {
          text: 'Open In-App Map',
          onPress: () => setIsInAppMapVisible(true)
        },
        {
          text: 'Use Current GPS',
          onPress: useCurrentLocation
        },
        {
          text: 'Open Google Maps',
          onPress: () => {
            const lat = currentLocation?.latitude || 28.6139;
            const lng = currentLocation?.longitude || 77.2090;
            const url = `https://www.google.com/maps/place/${lat},${lng}/@${lat},${lng},15z`;
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Could not open maps application');
            });
          }
        },
        {
          text: 'Enter Manually',
          onPress: () => setIsModalVisible(true)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Handle manual coordinate input
  const handleManualLocationSubmit = async () => {
    const lat = parseFloat(manualCoords.latitude);
    const lng = parseFloat(manualCoords.longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Please enter valid coordinates');
      return;
    }

    let address = manualAddress.trim();
    if (!address) {
      address = await getAddressFromCoords(lat, lng);
    }

    const locationData: LocationData = {
      latitude: lat,
      longitude: lng,
      address
    };

    setSelectedLocation(locationData);
    setManualAddress(address);
    onLocationSelect(locationData);
    setIsModalVisible(false);
  };

  // Auto-lookup address when coordinates change
  const handleCoordinateChange = async (field: 'latitude' | 'longitude', value: string) => {
    setManualCoords(prev => ({ ...prev, [field]: value }));
    
    const lat = parseFloat(field === 'latitude' ? value : manualCoords.latitude);
    const lng = parseFloat(field === 'longitude' ? value : manualCoords.longitude);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const address = await getAddressFromCoords(lat, lng);
      setManualAddress(address);
    }
  };

  return (
    <View>
      {selectedLocation ? (
        <View className="p-4 bg-green-50 rounded-lg border border-green-200">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-green-800 font-medium">📍 Location Selected</Text>
            <Button
              title="Change"
              onPress={openMapForSelection}
              variant="outline"
              className="px-3 py-1"
            />
          </View>
          
          <View className="space-y-2">
            <Text className="text-sm text-green-700">
              <Text className="font-medium">Address:</Text> {selectedLocation.address}
            </Text>
            <Text className="text-xs text-green-600">
              Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      ) : (
        <View className="space-y-3">
          <Button
            title="📍 Select Location"
            onPress={openMapForSelection}
            variant="outline"
            className="w-full"
          />
          <Text className="text-xs text-gray-500 text-center">
            Choose your location using GPS, maps, or manual entry
          </Text>
        </View>
      )}

      {/* Manual Location Input Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 bg-white p-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-semibold">📍 Enter Location</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text className="text-blue-600 text-lg">Cancel</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <Text className="text-sm text-gray-600 mb-4">
              Enter coordinates manually or paste them from Google Maps
            </Text>

            <View className="flex-row space-x-2">
              <View className="flex-1">
                <Input
                  label="Latitude"
                  placeholder="e.g., 28.6139"
                  value={manualCoords.latitude}
                  onChangeText={(value) => handleCoordinateChange('latitude', value)}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Longitude"
                  placeholder="e.g., 77.2090"
                  value={manualCoords.longitude}
                  onChangeText={(value) => handleCoordinateChange('longitude', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label="Address"
              placeholder="Address will be auto-filled"
              value={manualAddress}
              onChangeText={setManualAddress}
              multiline
              numberOfLines={2}
            />

            {isLoadingAddress && (
              <Text className="text-sm text-blue-600 text-center">
                🔍 Looking up address...
              </Text>
            )}

            <View className="mt-6 space-y-3">
              <Button
                title="Use This Location"
                onPress={handleManualLocationSubmit}
                disabled={!manualCoords.latitude || !manualCoords.longitude || isLoadingAddress}
                className="w-full"
              />
              
              {currentLocation && (
                <Button
                  title="Use Current GPS Location"
                  onPress={() => {
                    setManualCoords({
                      latitude: currentLocation.latitude.toString(),
                      longitude: currentLocation.longitude.toString()
                    });
                    handleCoordinateChange('latitude', currentLocation.latitude.toString());
                  }}
                  variant="outline"
                  className="w-full"
                />
              )}
            </View>

            <View className="mt-6 p-4 bg-gray-50 rounded-lg">
              <Text className="text-sm text-gray-600 font-medium mb-2">💡 Tips:</Text>
              <Text className="text-xs text-gray-500 leading-relaxed">
                • You can copy coordinates from Google Maps by right-clicking on a location{"\n"}
                • GPS coordinates should be in decimal format (e.g., 28.6139, 77.2090){"\n"}
                • Address will be automatically looked up from coordinates
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* In-App Map Viewer */}
      <InAppMap
        visible={isInAppMapVisible}
        onClose={() => setIsInAppMapVisible(false)}
        onLocationSelect={(locationData: LocationData) => {
          setSelectedLocation(locationData);
          setManualCoords({
            latitude: locationData.latitude.toString(),
            longitude: locationData.longitude.toString()
          });
          setManualAddress(locationData.address);
          onLocationSelect(locationData);
        }}
        currentLocation={currentLocation}
      />
    </View>
  );
}