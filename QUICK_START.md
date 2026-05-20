# ⚡ Quick Start - Do These 3 Things

## 1️⃣ Wait for Railway (2-3 minutes)

**Check Status**: https://railway.app/ → Your HamRah project → Backend service

**Test When Ready**:
```bash
curl https://hamrah-production.up.railway.app/api/health
```

**Expected**: `{"status":"healthy","service":"HamRah Backend API"}`

---

## 2️⃣ Fix Vercel Admin App (5 minutes)

1. Go to: https://vercel.com/
2. Click your HamRah project
3. Settings → General → Build & Development Settings
4. Root Directory → Edit → Enter: `apps/admin`
5. ☑️ Check "Include source files outside Root Directory"
6. Save → Deployments → Redeploy

---

## 3️⃣ Build Mobile APKs (30 minutes)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login (username: fazl.sardar)
eas login

# Build Rider App
cd apps/rider
eas build --platform android --profile preview

# Build Driver App
cd apps/driver
eas build --platform android --profile preview
```

**Download**: https://expo.dev/accounts/fazl.sardar → Builds tab

---

## ✅ Done!

Install APKs on your phone and test ride matching!

**Need Details?** See `DEPLOYMENT_STATUS_FINAL.md`
