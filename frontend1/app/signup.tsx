import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text } from '../components/ui';
import { validateIndianPhoneNumber, formatPhoneInput } from '../utils/phoneValidation';
import { otpService } from '../services/otpService';

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === 'phoneNumber') {
      const formattedValue = formatPhoneInput(value, formData.phoneNumber);
      setFormData(prev => ({ ...prev, [field]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = { name: '', email: '', phoneNumber: '' };
    let isValid = true;

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    // Validate email (optional but if provided, must be valid)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    // Validate phone number
    const phoneValidation = validateIndianPhoneNumber(formData.phoneNumber);
    if (!phoneValidation.isValid) {
      newErrors.phoneNumber = phoneValidation.errorMessage || 'Invalid phone number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const phoneValidation = validateIndianPhoneNumber(formData.phoneNumber);
      const response = await otpService.sendOTP(phoneValidation.formattedNumber);
      
      if (response.success) {
        // Navigate to OTP verification screen with user data
        router.push({
          pathname: '/verify-otp',
          params: {
            phoneNumber: phoneValidation.formattedNumber,
            type: 'signup',
            name: formData.name.trim(),
            email: formData.email.trim(),
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

  const isFormValid = () => {
    const phoneValidation = validateIndianPhoneNumber(formData.phoneNumber);
    return (
      formData.name.trim().length >= 2 &&
      phoneValidation.isValid &&
      (!formData.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
    );
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
                Create Account
              </Text>
              <Text className="text-lg text-muted-foreground">
                Sign up to get started with your new account
              </Text>
            </View>

            {/* Form Fields */}
            <View className="space-y-4 mb-6">
              {/* Name Input */}
              <Input
                label="Full Name *"
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                error={errors.name}
                autoFocus
              />

              {/* Email Input */}
              <Input
                label="Email Address (Optional)"
                placeholder="Enter your email address"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                error={errors.email}
              />

              {/* Phone Number Input */}
              <Input
                label="Phone Number *"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
                maxLength={12} // Allows for "XXXXX XXXXX" format
                error={errors.phoneNumber}
              />
            </View>

            <Text className="text-sm text-gray-500 mb-6">
              We'll send you a verification code to confirm your phone number
            </Text>

            {/* Create Account Button */}
            <Button
              title="Create Account"
              onPress={handleSignup}
              disabled={!isFormValid() || isLoading}
              loading={isLoading}
              className="mb-6"
            />

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="mx-4 text-gray-500">OR</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/login" asChild>
                <Text className="text-blue-600 font-semibold">Sign In</Text>
              </Link>
            </View>

            {/* Footer Info */}
            <View className="mt-8 pt-6 border-t border-gray-200">
              <Text className="text-center text-sm text-gray-500 leading-relaxed">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
                We'll use your phone number to verify your identity and send important updates.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}