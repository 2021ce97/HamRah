/**
 * API configuration for the HamRah Driver app.
 *
 * Set the EXPO_PUBLIC_API_URL environment variable to your Railway backend URL
 * before building or running the app. See .env.example for details.
 *
 * Example:
 *   EXPO_PUBLIC_API_URL=https://your-railway-domain.up.railway.app
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://YOUR_RAILWAY_URL_HERE.up.railway.app';

/** Pre-built endpoint paths for convenience. */
export const API_ENDPOINTS = {
  requestOtp: `${API_BASE_URL}/api/auth/request-otp`,
  verifyOtp: `${API_BASE_URL}/api/auth/verify-otp`,
  rides: `${API_BASE_URL}/api/rides`,
  wallet: `${API_BASE_URL}/api/wallet`,
} as const;
