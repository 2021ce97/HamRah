# 🇦🇫 HamRah Ride-Hailing Handover & Next Steps Prompt

Use the prompt below to resume development in your next session. It provides all the necessary context about what has been built, the infrastructure setup, and the next steps.

---

### Copy/Paste this Prompt to Start the Next Session:

```markdown
Hi! I am working on a ride-hailing app for Afghanistan called HamRah. Please read the C:\Users\Allah\.gemini\antigravity\scratch\HamRah_Progress_Tracker.md file to see the project progress.

We have successfully:
1. Deployed the backend on Railway (connected to MongoDB Atlas with 0.0.0.0/0 whitelisted).
2. Deployed the Admin panel on Vercel.
3. Created signed Android APK builds for both Rider and Driver apps via EAS Build.
4. Integrated native Google Maps (react-native-maps) into the mobile screens.
5. Implemented Twilio SMS OTP wrapper and Mapbox Directions API wrapper with fallback options on the backend.

Let's begin Phase 6: Step 6.3 (Frontend Hooking). 
We need to:
1. Update `apps/rider/src/app/index.tsx` so that when coordinates change, it queries the backend's `/api/navigation/directions` endpoint and draws the route line on the map.
2. Replace the setTimeout mock in the Rider app with a live Socket.IO connection to request rides.
3. Update the Driver app (`apps/driver/src/app/index.tsx`) to subscribe to the Socket.IO server and display real-time ride request cards, and wire up the counter-offer accept/reject buttons.

Let's start by modifying the Rider app to draw route paths on the map using our backend directions endpoint!
```

---

## 📋 Comprehensive Status Check & Remaining Tasks

### 1. Backend API (`apps/backend`)
* **Completed:** MongoDB Atlas setup, schemas, JWT authentication, Gemini Tazkira OCR verification endpoint, Claude Smart Fare suggestions endpoint, Twilio SMS service wrapper (with fallback console logs), and Mapbox directions route API.
* **Remaining:**
  * Connect HesabPay, AWCC My Money, and Stripe API keys to process actual payments (currently mocked in `walletService.js`).
  * Wire up the Firebase Realtime Database config for live driver GPS coordinate streaming.

### 2. Rider App (`apps/rider`)
* **Completed:** EAS build setups, RTL Pashto/Dari localization infrastructure, native Google Map view implementation.
* **Remaining:**
  * Hook up the pickup and destination inputs to fetch routes from `/api/navigation/directions` and draw a polyline.
  * Connect to Socket.IO events (`requestRide`, `rideAccepted`, `fareCounter`) to communicate with the driver app.
  * Change mock wallet views to call the backend top-up API.

### 3. Driver App (`apps/driver`)
* **Completed:** Online/Offline UI toggle, Document upload UI, counter-offer UI screens, Google Maps view implementation.
* **Remaining:**
  * Hook the document upload screen directly to `/api/ai/verify-tazkira` so drivers can scan their ID cards.
  * Connect Socket.IO to receive live pings from nearby riders when the driver's status is toggled to "ONLINE".
  * Implement the counter-offer return stream.

### 4. Admin Dashboard (`apps/admin`)
* **Completed:** Initial layout and Next.js Vercel deployment.
* **Remaining:**
  * Connect the driver verification dashboard to the database so admins can manually review Gemini AI-parsed Tazkira details and approve drivers.
