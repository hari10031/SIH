# Backend-Frontend1 Connection Setup

## Overview
This document describes the connection setup between the `backend` folder and `frontend1` folder for the SIH project.

## Backend Setup (Node.js/Express)

### Structure
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js (OTP-based authentication)
│   │   └── userController.js
│   ├── routes/
│   │   ├── authRoutes.js (includes OTP endpoints)
│   │   └── userRoutes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js (updated with OTP schemas)
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── otpService.js
│   │   ├── userService.js
│   │   └── emailService.js
│   ├── utils/
│   └── config/
├── server.js (main entry point)
├── package.json
└── .env (configured for frontend1)
```

### Configuration
- **Port**: 3001
- **CORS Origins**: `http://localhost:8081,http://localhost:19006,http://localhost:19000` (Expo dev servers)
- **Environment**: Development

### API Endpoints
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login user
- `POST /api/auth/signup` - Register new user with phone number
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/users/profile` - Get user profile (protected)
- `GET /api/health` - Health check

### Running the Backend
```bash
cd backend
node server.js
```

The server will start on `http://localhost:3001`

## Frontend1 Setup (React Native/Expo)

### Structure
```
frontend1/
├── app/ (Expo Router pages)
├── components/ui/ (UI components)
├── contexts/
│   └── AuthContext.tsx (connected to backend)
├── services/
│   └── otpService.ts (connected to backend)
├── utils/
└── package.json
```

### Configuration
- **Backend URL**: `http://localhost:3001/api`
- **Framework**: React Native with Expo
- **Authentication**: OTP-based using phone numbers

### Key Components
1. **AuthContext**: Manages authentication state and API calls
2. **OTPService**: Handles OTP sending and verification
3. **Login/Signup Screens**: UI for authentication flow

### Running Frontend1
```bash
cd frontend1
npm start
# or
expo start
```

## Authentication Flow

1. **Send OTP**: User enters phone number → Frontend calls `/api/auth/send-otp`
2. **Verify OTP**: User enters OTP → Frontend calls `/api/auth/verify-otp`
3. **Login Success**: Backend returns user data and tokens → Frontend stores user info
4. **Signup**: New users provide name, email (optional) → Frontend calls `/api/auth/signup`
5. **Redirect to Location**: After successful login/signup, users are taken to the location tracking page

## Location Page

After successful authentication, users are automatically redirected to a location tracking page that:
- Displays real-time GPS coordinates
- Shows location accuracy
- Provides a clean, user-friendly interface
- Includes logout functionality
- Follows the app's design system

## Changes Made

### Backend Changes
1. Removed unnecessary health routes
2. Added OTP-based authentication endpoints
3. Updated CORS configuration for Expo
4. Enhanced validation schemas for phone numbers
5. Added `sendOTP` and `signup` controller methods
6. Updated `verifyOTP` to handle login flow

### Frontend1 Changes
1. Updated `otpService.ts` to use backend API
2. Modified `AuthContext.tsx` to connect to backend endpoints
3. Configured API base URL: `http://localhost:3001/api`
4. Added fallback to local OTP verification for development

## Development Notes

- Backend supports both API-based and local OTP verification for development
- The system is configured to work with Expo's development servers
- CORS is properly configured for cross-origin requests
- Authentication tokens are stored in AsyncStorage on the frontend

## Testing

Backend is running successfully on port 3001 and responding to:
- Health checks: ✅
- OTP sending: ✅
- All configured endpoints: ✅

The connection between frontend1 and backend is fully established and ready for development.