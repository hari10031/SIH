import React, { useState, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text } from '../components/ui';
import { validateIndianPhoneNumber, formatPhoneInput } from '../utils/phoneValidation';
import { otpService } from '../services/otpService';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (text: string) => {
    const formattedText = formatPhoneInput(text, phoneNumber);
    setPhoneNumber(formattedText);
    
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleSendOTP = async () => {
    // Validate phone number
    const validation = validateIndianPhoneNumber(phoneNumber);
    if (!validation.isValid) {
      setPhoneError(validation.errorMessage || 'Invalid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await otpService.sendOTP(validation.formattedNumber);
      
      if (response.success) {
        // Navigate to OTP verification screen with phone number
        router.push({
          pathname: '/verify-otp',
          params: {
            phoneNumber: validation.formattedNumber,
            type: 'login',
          },
        });
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidPhone = () => {
    const validation = validateIndianPhoneNumber(phoneNumber);
    return validation.isValid;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-8">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-foreground mb-2">
                Welcome Back
              </Text>
              <Text className="text-lg text-muted-foreground">
                Sign in to your account using your phone number
              </Text>
            </View>

            {/* Phone Number Input */}
            <View className="mb-6">
              <Input
                label="Phone Number"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={12} // Allows for "XXXXX XXXXX" format
                error={phoneError}
                autoFocus
              />
              <Text className="text-sm text-muted-foreground mt-2">
                We'll send you a verification code via SMS
              </Text>
            </View>

            {/* Send OTP Button */}
            <Button
              title="Send OTP"
              onPress={handleSendOTP}
              disabled={!isValidPhone() || isLoading}
              loading={isLoading}
              className="mb-6"
            />

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-border" />
              <Text className="mx-4 text-muted-foreground">OR</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-muted-foreground">Don't have an account? </Text>
              <Link href="/signup" asChild>
                <Text className="text-primary font-semibold">Sign Up</Text>
              </Link>
            </View>

            {/* Footer Info */}
            <View className="mt-8 pt-6 border-t border-border">
              <Text className="text-center text-sm text-muted-foreground leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy Policy.
                Standard message and data rates may apply.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}