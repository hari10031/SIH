import "./global.css"
import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuth } from '../contexts/AuthContext';
import { Text } from '../components/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../hooks/useLocation';
import { useUpload } from '../hooks/useUpload';
import LocationTracker from '../components/LocationTracker';
import UploadForm from '../components/UploadForm';
import UserUploads from '../components/UserUploads';
import BottomNavigation from '../components/BottomNavigation';
import AppHeader from '../components/AppHeader';
import HomeActions from '../components/HomeActions';

type TabType = 'home' | 'upload';
 
export default function Index() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  
  // Custom hooks for location and upload functionality
  const {
    location,
    locationError,
    hasLocationPermission,
    currentAddress,
    requestLocationPermission
  } = useLocation();
  
  const {
    description,
    setDescription,
    isSubmitting,
    uploads,
    showSubmitted,
    handleSubmit,
    fetchUploads
  } = useUpload(location);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else {
        requestLocationPermission();
        fetchUploads(); // Fetch user uploads
      }
    }
  }, [isAuthenticated, isLoading, fetchUploads]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8">
          <AppHeader user={user} activeTab={activeTab} />

          {/* Content based on active tab */}
          {activeTab === 'home' ? (
            <>
              <LocationTracker
                location={location}
                locationError={locationError}
                hasLocationPermission={hasLocationPermission}
                onRequestPermission={requestLocationPermission}
              />
              
              <HomeActions onLogout={handleLogout} />
            </>
          ) : (
            <>
              <UploadForm
                description={description}
                onDescriptionChange={setDescription}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                showSubmitted={showSubmitted}
                currentLocation={location}
              />
              
              <UserUploads uploads={uploads} />
            </>
          )}
        </View>
      </ScrollView>
      
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </SafeAreaView>
  );
}