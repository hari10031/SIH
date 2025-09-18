import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, Image } from 'react-native';
import { Button, Text, Input } from './ui';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import LocationPicker from './LocationPicker';

interface UploadFormProps {
  description: string;
  onDescriptionChange: (text: string) => void;
  onSubmit: (imageData: any, locationData: any) => void;
  isSubmitting: boolean;
  showSubmitted: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null;
}

export default function UploadForm({
  description,
  onDescriptionChange,
  onSubmit,
  isSubmitting,
  showSubmitted,
  currentLocation
}: UploadFormProps) {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [imageSource, setImageSource] = useState<'camera' | 'gallery' | null>(null);
  const [selectedLocationData, setSelectedLocationData] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [useManualLocation, setUseManualLocation] = useState(false);
  
  // Voice recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [audioPlayback, setAudioPlayback] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Camera and media library permissions are required to upload images.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setImageSource('camera');
      setUseManualLocation(false); // Camera uses automatic location
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setImageSource('gallery');
      // Gallery images can use manual location
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to select an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageSource(null);
    setUseManualLocation(false);
    setSelectedLocationData(null);
  };

  // Voice recording functions
  const requestAudioPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Audio recording permission is required to record voice notes.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) return;

      // Configure audio recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Store timer reference in recording object for cleanup
      (recording as any).timer = timer;
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      // Clear timer
      if ((recording as any).timer) {
        clearInterval((recording as any).timer);
      }

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        setRecordedAudio(uri);
      }
      
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording.');
    }
  };

  const playAudio = async () => {
    try {
      if (!recordedAudio) return;

      if (audioPlayback) {
        // If already playing, stop it
        await audioPlayback.stopAsync();
        await audioPlayback.unloadAsync();
        setAudioPlayback(null);
        setIsPlaying(false);
        return;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: recordedAudio });
      setAudioPlayback(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setAudioPlayback(null);
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play audio:', error);
      Alert.alert('Playback Error', 'Failed to play audio.');
    }
  };

  const deleteAudio = () => {
    if (audioPlayback) {
      audioPlayback.stopAsync();
      audioPlayback.unloadAsync();
      setAudioPlayback(null);
    }
    setRecordedAudio(null);
    setIsPlaying(false);
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    let locationData = null;
    
    if (imageSource === 'camera' && currentLocation) {
      // Use automatic location for camera images
      locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        type: 'automatic'
      };
    } else if (imageSource === 'gallery' && useManualLocation && selectedLocationData) {
      // Use manual location for gallery images
      locationData = {
        latitude: selectedLocationData.latitude,
        longitude: selectedLocationData.longitude,
        address: selectedLocationData.address,
        type: 'manual'
      };
    }

    onSubmit({
      image: selectedImage,
      source: imageSource,
      voiceNote: recordedAudio ? {
        uri: recordedAudio,
        duration: recordingDuration
      } : null
    }, locationData);

    // Reset form after submission
    setSelectedImage(null);
    setImageSource(null);
    setUseManualLocation(false);
    setSelectedLocationData(null);
    deleteAudio(); // Clear voice recording
  };
  return (
    <View className="flex-1">
      {showSubmitted && (
        <View className="bg-green-100 border border-green-400 rounded-lg p-4 mb-6">
          <Text className="text-green-800 text-center font-semibold">
            ✅ Submitted Successfully!
          </Text>
        </View>
      )}
      
      <View className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <Text className="text-xl font-semibold text-foreground mb-4">
          Upload Content
        </Text>
        
        {/* Image Upload */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Image *
          </Text>
          
          {selectedImage ? (
            <View className="space-y-3">
              <View className="border rounded-lg overflow-hidden">
                <Image
                  source={{ uri: selectedImage.uri }}
                  className={`w-full ${
                    imageSource === 'gallery' ? 'h-24' : 'h-48'
                  }`}
                  resizeMode="cover"
                />
              </View>
              
              <View className="flex-row space-x-2">
                <Button
                  title="Change Image"
                  onPress={showImagePicker}
                  variant="outline"
                  className="flex-1"
                />
                <Button
                  title="Remove"
                  onPress={removeImage}
                  variant="destructive"
                  className="flex-1"
                />
              </View>
              
              <Text className="text-xs text-gray-500">
                Source: {imageSource === 'camera' ? '📷 Camera' : '🖼️ Gallery'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={showImagePicker}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center bg-gray-50"
            >
              <View className="items-center">
                <Text className="text-gray-500 text-2xl mb-2">📷</Text>
                <Text className="text-gray-600 font-medium">Tap to select image</Text>
                <Text className="text-gray-500 text-sm mt-1">Camera or Gallery</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Location Input for Gallery Images */}
        {selectedImage && imageSource === 'gallery' && (
          <View className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-medium text-blue-800">
                📍 Location Information
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setUseManualLocation(!useManualLocation);
                  if (!useManualLocation) {
                    setSelectedLocationData(null);
                  }
                }}
                className={`px-3 py-1 rounded-full ${
                  useManualLocation ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <Text className={`text-xs font-medium ${
                  useManualLocation ? 'text-white' : 'text-gray-600'
                }`}>
                  {useManualLocation ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {useManualLocation ? (
              <LocationPicker
                onLocationSelect={(locationData) => {
                  setSelectedLocationData(locationData);
                }}
                currentLocation={currentLocation}
                initialLocation={selectedLocationData}
              />
            ) : (
              <Text className="text-xs text-gray-600">
                Location will not be included with this upload. Toggle ON to add location.
              </Text>
            )}
            
            <Text className="text-xs text-blue-600 mt-3">
              💡 Tip: Gallery images allow manual location input. Camera images use automatic GPS location.
            </Text>
          </View>
        )}

        {/* Automatic Location Info for Camera Images */}
        {selectedImage && imageSource === 'camera' && (
          <View className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <Text className="text-sm font-medium text-green-800 mb-1">
              📍 Automatic Location
            </Text>
            {currentLocation ? (
              <View>
                <Text className="text-xs text-green-700">
                  ✅ Current GPS location will be used
                </Text>
                <Text className="text-xs text-green-600 mt-1">
                  Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
                </Text>
                {currentLocation.accuracy && (
                  <Text className="text-xs text-green-600">
                    Accuracy: ±{currentLocation.accuracy.toFixed(0)}m
                  </Text>
                )}
              </View>
            ) : (
              <Text className="text-xs text-orange-600">
                ⚠️ GPS location not available. Enable location services for automatic tagging.
              </Text>
            )}
          </View>
        )}

        {/* Description */}
        <View className="mb-4">
          <Input
            label="Description * (Required)"
            placeholder="Enter description..."
            value={description}
            onChangeText={onDescriptionChange}
            multiline
            numberOfLines={3}
            className="h-20"
          />
        </View>

        {/* Voice Recording */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            🎤 Voice Note (Optional)
          </Text>
          
          {!recordedAudio ? (
            <View className="space-y-3">
              {!isRecording ? (
                <Button
                  title="🎤 Start Recording"
                  onPress={startRecording}
                  variant="outline"
                  className="w-full"
                />
              ) : (
                <View className="space-y-2">
                  <View className="flex-row items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse" />
                      <Text className="text-red-800 font-medium">Recording...</Text>
                    </View>
                    <Text className="text-red-600 font-mono">
                      {formatDuration(recordingDuration)}
                    </Text>
                  </View>
                  <Button
                    title="⏹️ Stop Recording"
                    onPress={stopRecording}
                    variant="destructive"
                    className="w-full"
                  />
                </View>
              )}
            </View>
          ) : (
            <View className="space-y-3">
              <View className="p-3 bg-green-50 rounded-lg border border-green-200">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-green-800 font-medium">✅ Voice note recorded</Text>
                  <Text className="text-green-600 text-sm">
                    Duration: {formatDuration(recordingDuration)}
                  </Text>
                </View>
                
                <View className="flex-row space-x-2">
                  <Button
                    title={isPlaying ? "⏸️ Pause" : "▶️ Play"}
                    onPress={playAudio}
                    variant="outline"
                    className="flex-1"
                  />
                  <Button
                    title="🗑️ Delete"
                    onPress={deleteAudio}
                    variant="destructive"
                    className="flex-1"
                  />
                </View>
              </View>
              
              <Button
                title="🎤 Record New"
                onPress={() => {
                  deleteAudio();
                  startRecording();
                }}
                variant="outline"
                className="w-full"
              />
            </View>
          )}
          
          <Text className="text-xs text-gray-500 mt-2">
            💡 Tip: Voice notes are optional and help provide additional context to your uploads.
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          title="Submit"
          onPress={handleSubmit}
          disabled={!description.trim() || !selectedImage || isSubmitting}
          loading={isSubmitting}
          variant="default"
          className="w-full"
        />
      </View>
    </View>
  );
}