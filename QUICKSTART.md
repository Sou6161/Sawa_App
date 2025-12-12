# Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Set Up Environment Variables
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your configuration
cd ..
```

### 3. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on http://localhost:8081
npm run dev:backend   # Backend on http://localhost:3001
```

## ✅ Verify Installation

### Backend Health Check
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"...","environment":"development"}
```

### Frontend (Mobile App)
- Open Expo DevTools in your browser
- **Scan QR code with Expo Go app** on your iOS/Android device
- Or press `i` for iOS Simulator (Mac only) / `a` for Android Emulator
- **Important**: For physical device testing, update API URL with your local IP (see MOBILE_SETUP.md)

## 📁 Project Structure

```
Sawa_App/
├── frontend/          # React Native Expo app
│   ├── app/          # Expo Router pages
│   ├── assets/       # Images, fonts
│   └── ...
├── backend/          # Express API server
│   ├── src/
│   │   ├── index.ts  # Entry point
│   │   ├── routes/   # API routes
│   │   ├── middleware/ # Express middleware
│   │   └── ...
│   └── ...
└── ...
```

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start both servers
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Building
npm run build            # Build both
npm run build:frontend   # Build frontend
npm run build:backend    # Build backend

# Code Quality
npm run lint             # Lint all
npm run format           # Format all
```

## 🌐 API Endpoints

- `GET /health` - Root health check
- `GET /api/health` - API health check

More endpoints will be added as you develop the application.

## 📝 Next Steps

1. **Set up mobile app API connection** (see [MOBILE_SETUP.md](./MOBILE_SETUP.md))
2. Set up your database (update `backend/.env`)
3. Create your first API routes in `backend/src/routes/`
4. Use the API service in `frontend/src/services/api.ts` to connect mobile app to backend
5. Start building your mobile app features!

**Important**: This is a **mobile app**, not a website. Use Expo Go or simulators for testing.

For detailed documentation, see:
- [README.md](./README.md) - General documentation
- [MOBILE_SETUP.md](./MOBILE_SETUP.md) - Mobile app setup guide

