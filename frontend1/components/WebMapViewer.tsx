import React from 'react';
import { Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

interface WebMapViewerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: { latitude: number; longitude: number } | null;
}

export default function WebMapViewer({ 
  visible, 
  onClose, 
  onLocationSelect, 
  initialLocation 
}: WebMapViewerProps) {
  const lat = initialLocation?.latitude || 28.6139;
  const lng = initialLocation?.longitude || 77.2090;

  // Show map options when visible
  React.useEffect(() => {
    if (visible) {
      Alert.alert(
        '🗺️ Select Location',
        'Choose your preferred method:',
        [
          {
            text: 'Open Interactive Map',
            onPress: async () => {
              try {
                const mapUrl = `https://www.openstreetmap.org/#map=15/${lat}/${lng}`;
                const result = await WebBrowser.openBrowserAsync(mapUrl, {
                  presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                  controlsColor: '#007AFF',
                  toolbarColor: '#ffffff'
                });
                onClose();
              } catch (error) {
                console.error('Error opening web map:', error);
                Alert.alert('Error', 'Could not open map. Please try manual entry.');
                onClose();
              }
            }
          },
          {
            text: 'Enter Coordinates',
            onPress: () => {
              Alert.prompt(
                'Enter Location',
                'Format: latitude,longitude\nExample: 28.6139,77.2090',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: onClose
                  },
                  {
                    text: 'Use Location',
                    onPress: async (input: string | undefined) => {
                      if (input) {
                        const coords = input.split(',').map((c: string) => parseFloat(c.trim()));
                        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                          // Get address using reverse geocoding
                          try {
                            const response = await fetch(
                              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&accept-language=en`
                            );
                            const data = await response.json();
                            const address = data.display_name || 'Address not found';
                            
                            onLocationSelect({
                              latitude: coords[0],
                              longitude: coords[1],
                              address: address
                            });
                          } catch (error) {
                            console.error('Address lookup failed:', error);
                            onLocationSelect({
                              latitude: coords[0],
                              longitude: coords[1],
                              address: 'Address lookup failed'
                            });
                          }
                        } else {
                          Alert.alert('Error', 'Invalid coordinates format. Use: latitude,longitude');
                        }
                      }
                      onClose();
                    }
                  }
                ],
                'plain-text',
                `${lat},${lng}`
              );
            }
          },
          {
            text: 'Open Google Maps',
            onPress: async () => {
              try {
                const googleMapsUrl = `https://www.google.com/maps/@${lat},${lng},15z`;
                await Linking.openURL(googleMapsUrl);
                onClose();
              } catch (error) {
                console.error('Error opening Google Maps:', error);
                Alert.alert('Error', 'Could not open Google Maps');
                onClose();
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: onClose
          }
        ]
      );
    }
  }, [visible, lat, lng, onClose, onLocationSelect]);

  return null; // This component uses native alerts and external browsers
}