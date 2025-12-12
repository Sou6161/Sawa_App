# Sawa App - Full Stack Mobile Application

A professional full-stack **mobile application** built with React Native (Expo) and Node.js, following modern best practices for mobile app development.

## 🏗️ Project Structure

```
Sawa_App/
├── frontend/          # React Native Expo app with NativeWind
├── backend/           # Express.js API server with TypeScript
├── package.json       # Root workspace configuration
└── README.md          # This file
```

## 🚀 Tech Stack

### Frontend (Mobile App)
- **React Native** with **Expo Router** - Native iOS & Android mobile app development
- **NativeWind** v4 - Tailwind CSS for React Native styling
- **TypeScript** - Type-safe mobile app development
- **React** 19.1.0 - Latest React features
- **Expo** - Development platform for React Native apps

### Backend (Mobile API Server)
- **Node.js** with **Express** - RESTful API server for mobile app
- **TypeScript** - Type-safe backend development
- **Helmet** - Security headers
- **CORS** - For development (Expo web), not needed for native mobile apps
- **Morgan** - HTTP request logger
- **Express Rate Limit** - API rate limiting for mobile clients
- **Compression** - Response compression for mobile data efficiency

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Expo Go** app (for iOS/Android testing) - Download from App Store/Play Store
- **iOS Simulator** (Mac only) or **Android Emulator** (for local testing)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Sawa_App
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   Or install individually:
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install && cd ..
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   ```

3. **Set up environment variables**
   
   **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```
   
   **Frontend:**
   ```bash
   cd frontend
   # Create .env.local if needed
   ```

## 🏃 Development

### Run Both Frontend and Backend
```bash
npm run dev
```

### Run Frontend Only
```bash
npm run dev:frontend
# or
cd frontend && npm start
```

### Run Backend Only
```bash
npm run dev:backend
# or
cd backend && npm run dev
```

## 🏗️ Building

### Build Everything
```bash
npm run build
```

### Build Frontend
```bash
npm run build:frontend
```

### Build Backend
```bash
npm run build:backend
```

## 🧹 Code Quality

### Linting
```bash
# Lint all
npm run lint

# Lint frontend
npm run lint:frontend

# Lint backend
npm run lint:backend
```

### Formatting
```bash
# Format all
npm run format

# Format frontend
npm run format:frontend

# Format backend
npm run format:backend
```

## 📁 Project Structure Details

### Frontend (`/frontend`)
- `app/` - Expo Router pages and layouts
- `assets/` - Images, fonts, and other assets
- `global.css` - Global Tailwind CSS styles
- Configuration files for Expo, TypeScript, Babel, Metro, etc.

### Backend (`/backend`)
- `src/` - Source code
  - `index.ts` - Application entry point
  - `routes/` - API route handlers
  - `middleware/` - Express middleware
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions
- `dist/` - Compiled JavaScript (generated)
- Configuration files for TypeScript, ESLint, Prettier, etc.

## 🔌 API Endpoints

### Health Check
- `GET /health` - Root health check
- `GET /api/health` - API health check

More endpoints will be added as the application grows.

## 🔒 Security Features

- **Helmet** - Sets various HTTP headers for security
- **CORS** - Configured for frontend origin
- **Rate Limiting** - Prevents API abuse
- **Environment Variables** - Sensitive data stored securely
- **Input Validation** - (To be implemented)

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
API_VERSION=v1
API_PREFIX=/api
CORS_ORIGIN=http://localhost:8081
JWT_SECRET=your-secret-key-change-in-production
```

See `backend/.env.example` for all available options.

## 🧪 Testing

Testing setup will be added in future updates.

## 📦 Deployment

### Frontend (Mobile App)
- **iOS**: Build with Expo EAS Build and submit to App Store
- **Android**: Build with Expo EAS Build and submit to Google Play Store
- Use EAS (Expo Application Services) for production builds
- Configure app.json with production API URLs

### Backend (API Server)
- Deploy to cloud platforms (AWS, Railway, Render, Heroku, etc.)
- Ensure environment variables are set
- Run `npm run build` before deployment
- Update mobile app with production API URL

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and formatting
4. Submit a pull request

## 📄 License

ISC

## 👥 Team

Sawa App Development Team

---

**Built with ❤️ using modern technologies and best practices**
