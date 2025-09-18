import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

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

interface ImageData {
  image: {
    uri: string;
    type?: string;
    name?: string;
    fileSize?: number;
  };
  source: 'camera' | 'gallery';
  voiceNote?: {
    uri: string;
    duration: number;
  } | null;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  address?: string;
  type: 'automatic' | 'manual';
}

const API_BASE_URL = 'http://192.168.0.156:3002'; // Backend server URL

export function useUpload(location: Coords | null) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploads, setUploads] = useState<UploadData[]>([]);
  const [showSubmitted, setShowSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Function to create FormData for upload
  const createFormData = (imageData: ImageData, locationData: LocationData | null, description: string) => {
    const formData = new FormData();
    
    // Add image file
    const imageUri = imageData.image.uri;
    const filename = imageData.image.name || `image_${Date.now()}.jpg`;
    const type = imageData.image.type || 'image/jpeg';
    
    formData.append('image', {
      uri: imageUri,
      type,
      name: filename,
    } as any);
    
    // Add voice note if provided
    if (imageData.voiceNote) {
      const voiceFilename = `voice_${Date.now()}.m4a`;
      formData.append('voice', {
        uri: imageData.voiceNote.uri,
        type: 'audio/m4a',
        name: voiceFilename,
      } as any);
    }
    
    // Add description and basic info
    formData.append('description', description);
    formData.append('phonenumber', user?.phoneNumber || '');
    formData.append('imageSource', imageData.source);
    
    // Add location data
    if (locationData) {
      formData.append('locationType', locationData.type);
      formData.append('latitude', locationData.latitude.toString());
      formData.append('longitude', locationData.longitude.toString());
      
      if (locationData.accuracy) {
        formData.append('accuracy', locationData.accuracy.toString());
      }
      
      if (locationData.address) {
        formData.append('address', locationData.address);
      }
    } else {
      formData.append('locationType', 'none');
    }
    
    // Add metadata
    formData.append('deviceInfo', 'Mobile App');
    formData.append('appVersion', '1.0.0');
    
    // Add voice note duration if provided
    if (imageData.voiceNote) {
      formData.append('voiceNoteDuration', imageData.voiceNote.duration.toString());
    }
    
    return formData;
  };

  // Upload function
  const handleSubmit = useCallback(async (imageData: ImageData, locationData: LocationData | null) => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!user?.phoneNumber) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = createFormData(imageData, locationData, description);
      
      const response = await fetch(`${API_BASE_URL}/uploads`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }
      
      if (result.success) {
        // Add the new upload to the local state
        const newUpload: UploadData = {
          id: result.data.upload.id,
          description: result.data.upload.description,
          timestamp: result.data.upload.createdAt,
          imageSource: result.data.upload.imageSource,
          locationType: result.data.upload.locationType,
          location: result.data.upload.location ? {
            latitude: result.data.upload.location.coordinates[1],
            longitude: result.data.upload.location.coordinates[0],
            accuracy: result.data.upload.location.accuracy
          } : undefined,
          hasVoiceNote: result.data.upload.hasVoiceNote,
          voiceNoteDuration: result.data.upload.voiceNoteDuration,
          status: result.data.upload.status
        };
        
        setUploads(prev => [newUpload, ...prev]);
        
        // Reset form
        setDescription('');
        
        // Show success message
        setShowSubmitted(true);
        setTimeout(() => setShowSubmitted(false), 3000);
        
        Alert.alert('Success', 'Upload completed successfully!');
      } else {
        throw new Error(result.message || 'Upload failed');
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'An error occurred while uploading. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [description, user?.phoneNumber]);

  // Function to fetch user uploads
  const fetchUploads = useCallback(async () => {
    if (!user?.phoneNumber) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/user/${encodeURIComponent(user.phoneNumber)}?page=1&limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const fetchedUploads = result.data.uploads.map((upload: any) => ({
          id: upload.id,
          description: upload.description,
          timestamp: upload.createdAt,
          imageSource: upload.imageSource,
          locationType: upload.locationType,
          location: upload.location ? {
            latitude: upload.location.coordinates[1],
            longitude: upload.location.coordinates[0],
            accuracy: upload.location.accuracy
          } : undefined,
          hasVoiceNote: upload.hasVoiceNote,
          voiceNoteDuration: upload.voiceNoteDuration,
          status: upload.status
        }));
        
        setUploads(fetchedUploads);
      }
    } catch (error) {
      console.error('Error fetching uploads:', error);
      // Don't show alert for fetch errors, just log them
    } finally {
      setIsLoading(false);
    }
  }, [user?.phoneNumber]);

  // Function to delete upload
  const deleteUpload = useCallback(async (uploadId: string) => {
    if (!user?.phoneNumber) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/${uploadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phonenumber: user.phoneNumber
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setUploads(prev => prev.filter(upload => upload.id !== uploadId));
        Alert.alert('Success', 'Upload deleted successfully');
      } else {
        throw new Error(result.message || 'Failed to delete upload');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      Alert.alert('Delete Failed', error.message || 'Failed to delete upload');
    }
  }, [user?.phoneNumber]);

  return {
    description,
    setDescription,
    isSubmitting,
    uploads,
    showSubmitted,
    isLoading,
    handleSubmit,
    fetchUploads,
    deleteUpload
  };
}