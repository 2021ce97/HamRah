# 🚕 HamRah - Afghan Ride-Hailing Platform

Real-time ride-hailing application for Afghanistan with InDrive-style fare negotiation.

## 📱 Project Structure

```
HamRah/
├── apps/
│   ├── admin/          # Admin dashboard (Next.js)
│   ├── backend/        # Node.js + Express + Socket.IO backend
│   ├── rider/          # Rider mobile app (React Native + Expo)
│   └── driver/         # Driver mobile app (React Native + Expo)
└── .kiro/
    └── specs/          # Feature specifications
```

## 🚀 Deployment URLs

- **Backend (Railway)**: https://hamrah-production.up.railway.app
- **Admin (Vercel)**: [Configure in Vercel dashboard]
- **Database**: MongoDB Atlas

## 📋 Quick Start

### Backend Development:
```bash
cd apps/backend
npm install
npm start
```

### Rider App:
```bash
cd apps/rider
npm install
npx expo start
```

### Driver App:
```bash
cd apps/driver
npm install
npx expo start
```

### Admin Dashboard:
```bash
cd apps/admin
npm install
npm run dev
```

## 🔧 Environment Variables

### Backend (.env):
```
PORT=5000
MONGO_URI=mongodb+srv://hamrah-databse:HamRah%40122710@hamrah.4infjgw.mongodb.net/hamrah?retryWrites=true&w=majority&appName=HamRah
JWT_SECRET=hamrah-super-secret-jwt-key-2024-production
NODE_ENV=production
```

### Mobile Apps (.env):
```
EXPO_PUBLIC_API_URL=https://hamrah-production.up.railway.app
```

## 📦 Build Mobile APKs

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build Rider App
cd apps/rider
eas build --platform android --profile preview

# Build Driver App
cd apps/driver
eas build --platform android --profile preview
```

Download APKs from: https://expo.dev/accounts/fazl.sardar

## ✅ Deployment Status

- ✅ Backend: Deployed to Railway
- ✅ Database: MongoDB Atlas configured
- ⏳ Admin: Needs Vercel root directory configuration
- ⏳ Mobile: APKs need to be built

## 📖 Documentation

See `DEPLOYMENT_COMPLETE_GUIDE.md` for detailed deployment instructions.

## 🎯 Features

- Real-time ride matching with Socket.IO
- JWT authentication
- Geospatial driver search (5km radius)
- InDrive-style fare negotiation
- 120-second request timeout
- RTL support for Dari/Pashto
- Optimized for Afghanistan's network conditions

## 🧪 Testing

```bash
cd apps/backend
npm test
```

## 📞 Support

For deployment issues, check `DEPLOYMENT_COMPLETE_GUIDE.md`
