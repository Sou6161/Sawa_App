# Mobile App Setup Guide

This guide explains how to set up and run the Sawa mobile app for iOS and Android development.

## 📱 Mobile App Development Setup

### Prerequisites
- **Expo Go** app installed on your physical device (iOS/Android)
- **iOS Simulator** (Mac only) or **Android Emulator** for local testing
- Your computer and mobile device on the same Wi-Fi network

### Development Setup

#### 1. Start the Backend API Server
```bash
cd backend
npm run dev
# Backend runs on http://localhost:3001
```

#### 2. Configure API URL for Mobile Device

**Important**: When testing on a physical device, you need to use your computer's local IP address instead of `localhost`.

**Find your local IP address:**
- **Mac/Linux**: Run `ifconfig | grep "inet "` or `ipconfig getifaddr en0`
- **Windows**: Run `ipconfig` and look for IPv4 Address

**Example**: If your IP is `192.168.1.100`, your API URL should be `http://192.168.1.100:3001`

**Update API Configuration:**

1. Create `frontend/.env.local`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
```

2. Or update `frontend/src/config/api.ts`:
```typescript
if (__DEV__) {
  return "http://192.168.1.100:3001"; // Replace with your IP
}
```

#### 3. Start the Mobile App
```bash
cd frontend
npm start
```

This will:
- Start the Expo development server
- Open Expo DevTools in your browser
- Display a QR code

#### 4. Run on Device

**Option A: Expo Go (Easiest for development)**
1. Open **Expo Go** app on your phone
2. Scan the QR code from the terminal or browser
3. The app will load on your device

**Option B: iOS Simulator (Mac only)**
- Press `i` in the terminal to open iOS Simulator
- Or click "Open in iOS Simulator" in Expo DevTools

**Option C: Android Emulator**
- Press `a` in the terminal to open Android Emulator
- Or click "Open in Android Emulator" in Expo DevTools

### Testing API Connection

The app includes API service utilities in `frontend/src/services/api.ts`. You can test the connection:

```typescript
import apiService from "@/services/api";

// Test health check
const health = await apiService.healthCheck();
console.log(health);
```

### Production Build

For production builds, you'll use **EAS Build**:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Environment Variables for Mobile App

Create `frontend/.env.local` for development:
```env
EXPO_PUBLIC_API_URL=http://your-local-ip:3001
```

For production, set environment variables in `app.json` or EAS secrets:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.sawaapp.com
```

## 🔧 Troubleshooting

### Can't connect to backend from mobile device
- ✅ Ensure backend is running
- ✅ Check that your IP address is correct
- ✅ Verify both devices are on the same Wi-Fi network
- ✅ Check firewall settings (allow port 3001)

### CORS errors
- Mobile apps don't use CORS in production (only web browsers do)
- CORS is only needed for Expo web development
- If you see CORS errors, you're likely testing on web - use Expo Go or simulator instead

### Network request failed
- Check your API URL configuration
- Verify backend is accessible: `curl http://your-ip:3001/health`
- Check backend logs for errors

## 📱 Platform-Specific Notes

### iOS
- Requires Apple Developer account for production builds
- TestFlight for beta testing
- App Store submission via EAS

### Android
- Requires Google Play Developer account
- Internal testing track available
- Google Play Store submission via EAS

## 🚀 Next Steps

1. Set up your API endpoints in `backend/src/routes/`
2. Create API service methods in `frontend/src/services/api.ts`
3. Build your mobile app screens in `frontend/app/`
4. Test on physical devices regularly
5. Set up EAS Build for production

For more information, see:
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/)

