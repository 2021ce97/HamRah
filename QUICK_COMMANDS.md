# ⚡ Quick Commands Reference

## 🔧 MongoDB Atlas (Manual - Web Browser)
```
1. Go to: https://cloud.mongodb.com/
2. Login → Select "HamRah" project
3. Click "Network Access" → "Add IP Address"
4. Select "Allow Access from Anywhere" (0.0.0.0/0)
5. Click "Confirm" → Wait 2-3 minutes
```

## 🚂 Railway Deployment

### Update Environment Variables:
```
Go to: https://railway.app/
Find: HamRah backend project
Click: "Variables" tab
Add/Update:
  MONGO_URI=mongodb+srv://hamrah-databse:HamRah%40122710@hamrah.4infjgw.mongodb.net/hamrah?retryWrites=true&w=majority&appName=HamRah
  JWT_SECRET=hamrah-super-secret-jwt-key-2024-production
  NODE_ENV=production
  PORT=5000
```

### Test Railway Backend:
```bash
curl https://hamrah-production.up.railway.app/api/health
```

## 🌐 Vercel Deployment

### Redeploy Admin App:
```
1. Go to: https://vercel.com/
2. Find: HamRah admin project
3. Click: "Deployments" → "Redeploy"
4. Wait for build to complete
5. Click "Visit" to test
```

## 📱 Build Rider App APK

```bash
# Navigate to rider app
cd c:\Users\Allah\.gemini\antigravity\scratch\HamRah\apps\rider

# Login to Expo (first time only)
eas login
# Username: fazl.sardar

# Build APK
eas build --platform android --profile preview

# Download link will be provided in terminal
# Or visit: https://expo.dev/accounts/fazl.sardar/projects/rider/builds
```

## 🚗 Build Driver App APK

```bash
# Navigate to driver app
cd c:\Users\Allah\.gemini\antigravity\scratch\HamRah\apps\driver

# Build APK
eas build --platform android --profile preview

# Download link will be provided in terminal
# Or visit: https://expo.dev/accounts/fazl.sardar/projects/driver/builds
```

## 🧪 Test Local Backend (Optional)

```bash
# Start backend
cd c:\Users\Allah\.gemini\antigravity\scratch\HamRah\apps\backend
node server.js

# Test MongoDB connection (in new terminal)
cd c:\Users\Allah\.gemini\antigravity\scratch\HamRah
node test-mongodb-connection.cjs

# Run integration tests (in new terminal)
cd c:\Users\Allah\.gemini\antigravity\scratch\HamRah
node test-ride-matching.cjs
```

## 📊 Check Deployment Status

### Railway:
```
https://railway.app/ → HamRah project → Check logs
Look for: "✅ Connected to MongoDB"
```

### Vercel:
```
https://vercel.com/ → HamRah admin → Check deployment status
Should be: Green checkmark ✅
```

### Expo Builds:
```
https://expo.dev/accounts/fazl.sardar/projects
Check build status for rider and driver apps
```

## 🔍 Troubleshooting Commands

### Check Railway Logs:
```
Railway Dashboard → HamRah project → "Logs" tab
Filter by: @level:"error"
```

### Check Vercel Build Logs:
```
Vercel Dashboard → HamRah admin → "Deployments" → Click deployment → "Building"
```

### Test MongoDB Connection Manually:
```bash
# Using Node.js
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb+srv://hamrah-databse:HamRah%40122710@hamrah.4infjgw.mongodb.net/hamrah').then(() => console.log('✅ Connected')).catch(err => console.error('❌ Error:', err.message));"
```

## 📥 Download APKs

### Option 1: Terminal Link
After `eas build` completes, click the provided link

### Option 2: Expo Dashboard
```
Rider: https://expo.dev/accounts/fazl.sardar/projects/rider/builds
Driver: https://expo.dev/accounts/fazl.sardar/projects/driver/builds
```

### Option 3: QR Code
Scan the QR code shown in terminal with your phone

## 📲 Install APKs on Phone

### Method 1: Direct Download
1. Open Expo build link on phone browser
2. Download APK
3. Open downloaded file
4. Allow "Install from Unknown Sources"
5. Install

### Method 2: USB Transfer
1. Download APK to computer
2. Connect phone via USB
3. Copy APK to phone storage
4. Open file manager on phone
5. Navigate to APK and install

## ⚙️ Configuration Files

### Backend .env:
```
c:\Users\Allah\.gemini\antigravity\scratch\HamRah\apps\backend\.env
```

### Rider App .env:
```
c:\Users\Allah\.gemini\antigravity\scratch\HamRah\apps\rider\.env
```

### Driver App .env:
```
c:\Users\Allah\.gemini\antigravity\scratch\HamRah\apps\driver\.env
```

## 🎯 Quick Checklist

```
[ ] MongoDB Atlas IP whitelisted (0.0.0.0/0)
[ ] Railway env vars updated
[ ] Railway deployment successful
[ ] Vercel deployment successful
[ ] Rider APK built
[ ] Driver APK built
[ ] APKs downloaded
[ ] APKs installed on phone
[ ] Apps tested and working
```

## 📞 Quick Links

- **MongoDB Atlas**: https://cloud.mongodb.com/
- **Railway**: https://railway.app/
- **Vercel**: https://vercel.com/
- **Expo**: https://expo.dev/accounts/fazl.sardar
- **GitHub**: (your repository URL)

---

**Need detailed instructions?** See COMPLETE_DEPLOYMENT_GUIDE.md
