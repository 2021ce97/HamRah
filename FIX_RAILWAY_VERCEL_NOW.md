# 🚨 FIX RAILWAY & VERCEL - Step by Step

## 🔴 RAILWAY FIX (Critical - Do This First)

### Problem:
- Railway is trying to connect to `localhost:27017` instead of MongoDB Atlas
- Deployment is stuck on old version (23 hours ago)
- Environment variables might not be applied correctly

### Solution:

#### Step 1: Force New Deployment

1. Go to: **https://railway.app/**
2. Click on your **HamRah** project
3. Click on the **HamRah service** (the one showing "ACTIVE")
4. Click **"Settings"** tab
5. Scroll down to **"Service"** section
6. Click **"Delete Service"** button
7. Confirm deletion

**Don't worry!** We'll recreate it immediately.

#### Step 2: Create New Service from GitHub

1. Still in your HamRah project
2. Click **"+ New"** button (top right)
3. Select **"GitHub Repo"**
4. Find and select your **HamRah** repository
5. Railway will detect it and start setting up

#### Step 3: Configure the New Service

1. After Railway creates the service, click on it
2. Click **"Settings"** tab
3. Find **"Root Directory"** section
4. Click **"/"** (the current value)
5. Type: `apps/backend`
6. Press Enter or click outside to save

#### Step 4: Set Start Command

1. Still in **"Settings"** tab
2. Find **"Start Command"** section
3. Click the empty field or current value
4. Type: `node server.js`
5. Press Enter or click outside to save

#### Step 5: Add Environment Variables

1. Click **"Variables"** tab (top of page)
2. Click **"+ New Variable"** button

**Add these 4 variables ONE BY ONE:**

**Variable 1:**
```
PORT
5000
```
Click **"Add"**

**Variable 2:**
```
MONGO_URI
mongodb+srv://hamrah-databse:HamRah%40122710@hamrah.4infjgw.mongodb.net/hamrah?retryWrites=true&w=majority&appName=HamRah
```
Click **"Add"**

**Variable 3:**
```
JWT_SECRET
hamrah-super-secret-jwt-key-2024-production
```
Click **"Add"**

**Variable 4:**
```
NODE_ENV
production
```
Click **"Add"**

#### Step 6: Trigger Deployment

1. Click **"Deployments"** tab
2. Railway should automatically start deploying
3. If not, click **"Deploy"** button
4. Wait 2-3 minutes for deployment to complete

#### Step 7: Check Logs

1. Click **"Logs"** tab
2. Look for these messages:
   ```
   ✅ Connected to MongoDB
   🚀 Server running on port 5000
   🔌 Socket.IO server ready
   ```

3. If you see these, **SUCCESS!** ✅

#### Step 8: Get Your Railway URL

1. Click **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"** button
4. Copy the generated URL (e.g., `hamrah-production.up.railway.app`)
5. **SAVE THIS URL!**

#### Step 9: Test Railway Backend

Open Command Prompt:
```bash
curl https://YOUR-RAILWAY-URL.railway.app/api/health
```

**Expected Response:**
```json
{"status":"healthy","service":"HamRah Backend API"}
```

---

## 🌐 VERCEL FIX

### Problem:
- Can't find "Root Directory" setting
- Not sure if deployment is working

### Solution:

#### Step 1: Access Vercel Project Settings

1. Go to: **https://vercel.com/**
2. Click on your **HamRah admin** project (or the project with "ham-rah" in the name)
3. Click **"Settings"** tab (top right, next to "Deployments")

#### Step 2: Find Root Directory (It's Hidden!)

1. In **"Settings"**, look at the left sidebar
2. Click **"General"** (should be first option)
3. Scroll down to **"Build & Development Settings"** section
4. You'll see:
   - Framework Preset
   - Build Command
   - Output Directory
   - Install Command
   - **Root Directory** ← This is what you need!

#### Step 3: Set Root Directory

1. Find **"Root Directory"** field
2. Click **"OVERRIDE"** button next to it
3. A text field will appear
4. Type: `apps/admin`
5. Click the **checkmark** or press Enter

#### Step 4: Enable Source Files

1. Below the Root Directory field, you'll see a checkbox:
   **"Include source files outside of the Root Directory in the Build Step"**
2. ✅ **CHECK THIS BOX**
3. This is important for monorepo setup

#### Step 5: Verify Other Settings

Make sure these are set:
- **Framework Preset:** Next.js
- **Build Command:** (leave empty or `next build`)
- **Output Directory:** (leave empty or `.next`)
- **Install Command:** (leave empty or `npm install`)

#### Step 6: Save and Redeploy

1. Scroll to the bottom
2. Click **"Save"** button
3. Go to **"Deployments"** tab (top)
4. Find the latest deployment
5. Click the **three dots (...)** on the right
6. Click **"Redeploy"**
7. Confirm by clicking **"Redeploy"** again

#### Step 7: Wait for Build

1. Watch the deployment progress
2. It will show "Building..." then "Ready"
3. Wait 2-3 minutes

#### Step 8: Check Deployment

1. Once it shows **"Ready"** with green checkmark
2. Click on the deployment
3. Click **"Visit"** button (top right)
4. Your admin app should load

---

## 📱 UPDATE MOBILE APPS

After Railway deployment succeeds:

### Step 1: Update Rider App

1. Open file: `c:\Users\Allah\.gemini\antigravity\scratch\HamRah\apps\rider\.env`
2. Replace content with (use your actual Railway URL):
```
EXPO_PUBLIC_API_URL=https://YOUR-RAILWAY-URL.railway.app
```
3. Save the file

### Step 2: Update Driver App

1. Open file: `c:\Users\Allah\.gemini\antigravity\scratch\HamRah\apps\driver\.env`
2. Replace content with (use your actual Railway URL):
```
EXPO_PUBLIC_API_URL=https://YOUR-RAILWAY-URL.railway.app
```
3. Save the file

---

## 🔨 BUILD APKs

After updating mobile apps:

### Install EAS CLI (if not installed):
```bash
npm install -g eas-cli
```

### Login to Expo:
```bash
eas login
```
- Username: `fazl.sardar`
- Password: (your Expo password)

### Build Rider App:
```bash
cd c:\Users\Allah\.gemini\antigravity\scratch\HamRah\apps\rider
eas build --platform android --profile preview
```

### Build Driver App:
```bash
cd c:\Users\Allah\.gemini\antigravity\scratch\HamRah\apps\driver
eas build --platform android --profile preview
```

### Download APKs:
- Click the link in terminal
- Or go to: https://expo.dev/accounts/fazl.sardar

---

## ✅ VERIFICATION CHECKLIST

### Railway:
- [ ] Old service deleted
- [ ] New service created from GitHub
- [ ] Root directory set to `apps/backend`
- [ ] Start command set to `node server.js`
- [ ] All 4 environment variables added
- [ ] Deployment shows "Success"
- [ ] Logs show "Connected to MongoDB"
- [ ] Health endpoint responds correctly

### Vercel:
- [ ] Root directory set to `apps/admin`
- [ ] "Include source files" checkbox checked
- [ ] Framework preset is Next.js
- [ ] Deployment shows "Ready"
- [ ] Admin app loads in browser

### Mobile Apps:
- [ ] Railway URL copied
- [ ] Rider app .env updated
- [ ] Driver app .env updated
- [ ] Rider APK built
- [ ] Driver APK built
- [ ] APKs downloaded
- [ ] APKs installed on phone

---

## 🆘 IF RAILWAY STILL FAILS

### Check Logs for Specific Errors:

**If you see "ECONNREFUSED ::1:27017":**
- Environment variables not loaded
- Make sure you added MONGO_URI variable correctly
- Try deleting and recreating the service

**If you see "Cannot find module":**
- Root directory is wrong
- Should be `apps/backend` (not `backend` or `/apps/backend`)

**If you see "Port already in use":**
- Railway is trying to use wrong port
- Make sure PORT variable is set to `5000`

### Last Resort - Manual Deployment:

If automatic deployment doesn't work:

1. In Railway, click **"Deployments"** tab
2. Click **"Deploy"** button manually
3. Select **"Deploy from GitHub"**
4. Select the **main** branch
5. Click **"Deploy"**

---

## 🎯 SUMMARY

**What to do:**

1. **Railway**: Delete old service, create new one, configure properly
2. **Vercel**: Set root directory to `apps/admin`, enable source files, redeploy
3. **Mobile Apps**: Update .env files with Railway URL
4. **APKs**: Build both apps with EAS

**Total Time: ~30 minutes**

---

## 📞 AFTER YOU COMPLETE

Once everything is deployed, tell me:

1. ✅ Railway deployment status (Success/Failed)
2. ✅ Railway URL
3. ✅ Vercel deployment status (Ready/Failed)
4. ✅ Any error messages you see

I'll help you with the next steps!

---

**🚀 Start with Railway now! Delete the old service and create a new one.**
