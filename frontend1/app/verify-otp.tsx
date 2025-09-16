import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { otpService } from '../services/otpService';
import { validateOTP } from '../utils/phoneValidation';
import { maskPhoneNumber } from '../utils/phoneValidation';

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams();
  const { phoneNumber, type, name, email } = params as {
    phoneNumber: string;
    type: 'login' | 'signup';
    name?: string;
    email?: string;
  };

  const { login, signup } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear error when user starts typing
    if (error) {
      setError('');
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    const validation = validateOTP(otpCode);
    
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Invalid OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await otpService.verifyOTP(phoneNumber, otpCode);
      
      if (response.success) {
        if (type === 'login') {
          await login(phoneNumber, otpCode);
        } else {
          await signup({
            name: name || '',
            email: email || '',
            phoneNumber,
          });
        }
        
        // Navigate to home/dashboard
        router.replace('/');
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const response = await otpService.resendOTP(phoneNumber);
      
      if (response.success) {
        setOtp(['', '', '', '', '', '']);
        setTimer(60);
        setCanResend(false);
        setError('');
        Alert.alert('Success', 'OTP sent successfully');
        
        // Focus first input
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                Verify Your Phone
              </Text>
              <Text className="text-lg text-muted-foreground mb-4">
                Enter the 6-digit code sent to
              </Text>
              <Text className="text-lg font-semibold text-foreground">
                {maskPhoneNumber(phoneNumber)}
              </Text>
            </View>

            {/* OTP Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-foreground mb-4">
                Verification Code
              </Text>
              <View className="flex-row justify-between mb-2">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => { inputRefs.current[index] = ref; }}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    maxLength={1}
                    keyboardType="numeric"
                    className={`w-12 h-12 border rounded-md text-center text-lg font-semibold ${
                      error ? 'border-destructive' : 'border-input'
                    } ${digit ? 'bg-accent border-primary' : 'bg-background'}`}
                    autoFocus={index === 0}
                  />
                ))}
              </View>
              {error && (
                <Text className="text-red-500 text-sm mt-2">{error}</Text>
              )}
            </View>

            {/* Timer and Resend */}
            <View className="mb-6">
              {!canResend ? (
                <Text className="text-center text-gray-600">
                  Resend code in {formatTime(timer)}
                </Text>
              ) : (
                <View className="flex-row justify-center">
                  <Text className="text-gray-600">Didn't receive the code? </Text>
                  <Button
                    title="Resend"
                    onPress={handleResendOTP}
                    disabled={isResending}
                    loading={isResending}
                    variant="outline"
                    size="sm"
                    className="ml-2 px-3 py-1"
                  />
                </View>
              )}
            </View>

            {/* Verify Button */}
            <Button
              title={type === 'login' ? 'Sign In' : 'Create Account'}
              onPress={handleVerifyOTP}
              disabled={!isOtpComplete || isLoading}
              loading={isLoading}
              className="mb-6"
            />

            {/* Back Button */}
            <Button
              title="Change Phone Number"
              onPress={() => router.back()}
              variant="outline"
              disabled={isLoading}
            />

            {/* Footer Info */}
            <View className="mt-8 pt-6 border-t border-gray-200">
              <Text className="text-center text-sm text-gray-500 leading-relaxed">
                By verifying your phone number, you confirm that you have access to this device.
                Standard message and data rates may apply.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}