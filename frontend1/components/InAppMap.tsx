import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Button, Text, Input } from './ui';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';

interface InAppMapProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  currentLocation?: { latitude: number; longitude: number } | null;
}

export default function InAppMap({ 
  visible, 
  onClose, 
  onLocationSelect, 
  currentLocation 
}: InAppMapProps) {
  const [coordinates, setCoordinates] = useState({
    latitude: currentLocation?.latitude?.toString() || '28.6139',
    longitude: currentLocation?.longitude?.toString() || '77.2090'
  });
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [previewAddress, setPreviewAddress] = useState('');

  // Get address from coordinates
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

  // Preview address when coordinates change
  const handleCoordinateChange = async (field: 'latitude' | 'longitude', value: string) => {
    setCoordinates(prev => ({ ...prev, [field]: value }));
    
    const lat = parseFloat(field === 'latitude' ? value : coordinates.latitude);
    const lng = parseFloat(field === 'longitude' ? value : coordinates.longitude);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const address = await getAddressFromCoords(lat, lng);
      setPreviewAddress(address);
    } else {
      setPreviewAddress('');
    }
  };

  // Open interactive map in browser
  const openInteractiveMap = async () => {
    const lat = parseFloat(coordinates.latitude) || 28.6139;
    const lng = parseFloat(coordinates.longitude) || 77.2090;
    
    try {
      const mapUrl = `https://www.openstreetmap.org/#map=15/${lat}/${lng}`;
      await WebBrowser.openBrowserAsync(mapUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        controlsColor: '#007AFF',
        toolbarColor: '#ffffff'
      });
    } catch (error) {
      Alert.alert('Error', 'Could not open map. Please use coordinate input.');
    }
  };

  // Use current GPS location
  const useCurrentLocation = async () => {
    if (!currentLocation) {
      Alert.alert('GPS Not Available', 'Current location is not available.');
      return;
    }

    setCoordinates({
      latitude: currentLocation.latitude.toString(),
      longitude: currentLocation.longitude.toString()
    });

    const address = await getAddressFromCoords(currentLocation.latitude, currentLocation.longitude);
    setPreviewAddress(address);
  };

  // Confirm location selection
  const confirmLocation = async () => {
    const lat = parseFloat(coordinates.latitude);
    const lng = parseFloat(coordinates.longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude and longitude values.');
      return;
    }

    const address = previewAddress || await getAddressFromCoords(lat, lng);
    
    onLocationSelect({
      latitude: lat,
      longitude: lng,
      address: address
    });
    
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-blue-600 text-lg font-medium">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-800">🗺️ Select Location</Text>
          <TouchableOpacity 
            onPress={confirmLocation}
            disabled={isLoadingAddress}
          >
            <Text className={`text-lg font-medium ${
              isLoadingAddress ? 'text-gray-400' : 'text-blue-600'
            }`}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-6">
          {/* Interactive Map Option */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">🗺️ Interactive Map</Text>
            <Button
              title="Open Map in Browser"
              onPress={openInteractiveMap}
              variant="default"
              className="w-full mb-2"
            />
            <Text className="text-sm text-gray-600 text-center">
              Opens OpenStreetMap where you can click to select precise location
            </Text>
          </View>

          {/* GPS Location Option */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">📍 Current GPS</Text>
            <Button
              title="Use Current Location"
              onPress={useCurrentLocation}
              variant="outline"
              className="w-full"
              disabled={!currentLocation}
            />
            {!currentLocation && (
              <Text className="text-sm text-orange-600 text-center mt-2">
                GPS location not available
              </Text>
            )}
          </View>

          {/* Manual Coordinate Input */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">⌨️ Enter Coordinates</Text>
            
            <View className="flex-row space-x-3 mb-4">
              <View className="flex-1">
                <Input
                  label="Latitude"
                  placeholder="e.g., 28.6139"
                  value={coordinates.latitude}
                  onChangeText={(value) => handleCoordinateChange('latitude', value)}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Longitude"
                  placeholder="e.g., 77.2090"
                  value={coordinates.longitude}
                  onChangeText={(value) => handleCoordinateChange('longitude', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Address Preview */}
            {previewAddress && (
              <View className="bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
                <Text className="text-green-800 font-medium mb-1">📍 Address Preview</Text>
                <Text className="text-green-600 text-sm">{previewAddress}</Text>
              </View>
            )}

            {isLoadingAddress && (
              <View className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                <Text className="text-blue-600 text-center">🔍 Looking up address...</Text>
              </View>
            )}
          </View>

          {/* Tips */}
          <View className="bg-gray-50 p-4 rounded-lg">
            <Text className="text-sm text-gray-600 font-medium mb-2">💡 Tips:</Text>
            <Text className="text-xs text-gray-500 leading-relaxed">
              • Use the interactive map for precise location selection{"\n"}
              • GPS location provides your current position{"\n"}
              • Coordinates should be in decimal format (not degrees/minutes){"\n"}
              • Address will be automatically looked up for valid coordinates
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}