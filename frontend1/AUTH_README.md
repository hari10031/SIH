# Authentication System with shadcn/ui Documentation

## Overview
This authentication system provides secure phone-based authentication for Indian mobile numbers with OTP verification, built using **shadcn/ui** design system with Tailwind CSS. It includes signup, login, phone verification, and protected routes with a beautiful, consistent UI.

## Features
- 📱 Indian phone number validation
- 🔐 OTP-based authentication
- 👤 User registration and login
- 🛡️ Protected routes
- 💾 Persistent authentication state
- 🎨 **shadcn/ui** components with Tailwind CSS
- 🎯 Consistent design system
- ♿ Accessible UI components

## UI Components (shadcn/ui Style)

### Button Component
```tsx
import { Button } from '../components/ui';

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
<Button title="Click me" onPress={handlePress} variant="default" />
<Button title="Danger" onPress={handlePress} variant="destructive" />
<Button title="Outline" onPress={handlePress} variant="outline" />
```

### Input Component
```tsx
import { Input } from '../components/ui';

<Input
  label="Phone Number"
  placeholder="Enter phone number"
  value={phoneNumber}
  onChangeText={setPhoneNumber}
  error={error}
/>
```

### Text Component
```tsx
import { Text } from '../components/ui';

// Variants: default, muted, destructive, primary, secondary
// Sizes: default, sm, lg, xl, 2xl, 3xl
// Weights: normal, medium, semibold, bold
<Text variant="muted" size="sm">Helper text</Text>
<Text variant="destructive" weight="semibold">Error message</Text>
```

## Design System

### Color Palette
The app uses a carefully crafted color palette based on shadcn/ui:

- **Primary**: `hsl(222.2 84% 4.9%)` - Main brand color
- **Secondary**: `hsl(210 40% 96%)` - Secondary backgrounds
- **Destructive**: `hsl(0 84.2% 60.2%)` - Error states
- **Muted**: `hsl(210 40% 96%)` - Subtle backgrounds
- **Border**: `hsl(214.3 31.8% 91.4%)` - Border colors
- **Foreground**: `hsl(222.2 84% 4.9%)` - Text colors

### Typography
- Consistent font sizing using Tailwind classes
- Semantic text variants (muted, destructive, etc.)
- Proper font weights for hierarchy
- Native-optimized text sizes

### Spacing & Layout
- Consistent spacing using Tailwind spacing scale
- Proper component padding and margins
- Responsive layouts for different screen sizes

## File Structure
```
├── app/
│   ├── _layout.tsx          # Root layout with AuthProvider
│   ├── index.tsx            # Protected home screen
│   ├── login.tsx            # Login screen
│   ├── signup.tsx           # Registration screen
│   ├── verify-otp.tsx       # OTP verification screen
│   └── profile.tsx          # User profile screen
├── components/
│   ├── ui/
│   │   ├── Button.tsx       # Reusable button component
│   │   └── Input.tsx        # Reusable input component
│   └── ProtectedRoute.tsx   # Route protection wrapper
├── contexts/
│   └── AuthContext.tsx      # Authentication state management
├── services/
│   └── otpService.ts        # OTP handling service
├── utils/
│   └── phoneValidation.ts   # Phone number validation utilities
└── lib/
    └── utils.ts             # General utility functions
```

## Usage Guide

### 1. Phone Number Validation
The system validates Indian mobile numbers with the following rules:
- Must be 10 digits
- Must start with valid prefixes (6x, 7x, 8x, 9x series)
- Automatically formats for display and API calls
- Handles different input formats (+91, 91, plain 10-digit)

### 2. Authentication Flow

#### Signup Process:
1. User enters name, email (optional), and phone number
2. System validates inputs and sends OTP
3. User enters 6-digit OTP
4. Account is created and user is logged in

#### Login Process:
1. User enters phone number
2. System sends OTP to registered number
3. User enters 6-digit OTP
4. User is authenticated and redirected to home

### 3. OTP System
- 6-digit numeric codes
- 5-minute expiration
- Maximum 3 attempts per session
- Resend functionality with timer
- Development mode stores OTP locally for testing

### 4. Protected Routes
Use the `ProtectedRoute` component to protect screens:

```tsx
import { ProtectedRoute } from '../components/ProtectedRoute';

export default function MyProtectedScreen() {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  );
}
```

### 5. Using Authentication Context
```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  
  // Your component logic
}
```

## API Integration

### Development vs Production
Currently set up for development with local OTP storage. To integrate with a real backend:

1. Update `baseURL` in `otpService.ts`
2. Uncomment API calls in the service methods
3. Remove local storage logic
4. Configure your SMS provider (Twilio, AWS SNS, etc.)

### Expected API Endpoints
- `POST /auth/send-otp` - Send OTP to phone number
- `POST /auth/verify-otp` - Verify OTP code
- `POST /auth/login` - Login with phone/OTP
- `POST /auth/signup` - Register new user

## Security Features
- Phone number validation and sanitization
- OTP expiration and attempt limits
- Secure storage of user data
- Protected route access control
- Input validation and error handling

## Testing

### Development Testing
For testing purposes, the system logs OTP codes to the console. Check your development console to see the generated OTP.

### Test Phone Numbers
Any valid Indian mobile number format:
- 9876543210
- +91 9876543210
- 91 9876543210

## Styling
The system uses Tailwind CSS with NativeWind for styling. All components are fully responsive and follow a consistent design system.

## Error Handling
- Comprehensive input validation
- Network error handling
- User-friendly error messages
- Graceful loading states

## Dependencies
- `@react-native-async-storage/async-storage` - Local storage
- `react-native-safe-area-context` - Safe area handling
- `class-variance-authority` - Component variants
- `clsx` - Utility classes
- `tailwind-merge` - Tailwind class merging
- `expo-router` - Navigation
- `nativewind` - Tailwind CSS for React Native

## Styling Philosophy
This project follows **shadcn/ui** design principles:
- Consistent component API
- Composable and reusable components
- Accessible by default
- Beautiful and modern design
- Customizable through variants
- Type-safe component props