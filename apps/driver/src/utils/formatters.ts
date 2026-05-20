/**
 * Formatting utilities for the Driver App
 * Supports RTL formatting for Dari/Pashto locales
 */

/**
 * Format currency amount with AFN symbol
 * Supports RTL formatting for Dari/Pashto
 * 
 * @param amount - The fare amount to format
 * @param locale - The locale ('en' | 'fa' | 'ps' for English, Dari, Pashto)
 * @returns Formatted currency string with AFN symbol
 * 
 * Examples:
 * - formatCurrency(1234, 'en') => "1,234 AFN"
 * - formatCurrency(1234, 'fa') => "۱,۲۳۴ AFN" (Persian numerals)
 * - formatCurrency(1234, 'ps') => "۱,۲۳۴ AFN" (Persian numerals)
 */
export function formatCurrency(amount: number, locale: string = 'en'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 AFN';
  }

  // Round to nearest integer (no decimals for AFN)
  const roundedAmount = Math.round(amount);

  // Format based on locale
  if (locale === 'fa' || locale === 'ps') {
    // Use Persian/Arabic numerals for Dari and Pashto
    const formatted = roundedAmount.toLocaleString('fa-AF');
    return `${formatted} AFN`;
  } else {
    // Use Western numerals for English
    const formatted = roundedAmount.toLocaleString('en-US');
    return `${formatted} AFN`;
  }
}

/**
 * Format rating as stars
 * Converts a numeric rating (0-5) to star display
 * 
 * @param rating - The rating value (0-5)
 * @returns Star string representation
 * 
 * Examples:
 * - formatRating(4.8) => "⭐⭐⭐⭐⭐ (4.8)"
 * - formatRating(3.2) => "⭐⭐⭐ (3.2)"
 * - formatRating(5.0) => "⭐⭐⭐⭐⭐ (5.0)"
 */
export function formatRating(rating: number): string {
  if (typeof rating !== 'number' || isNaN(rating)) {
    return '⭐⭐⭐⭐⭐ (5.0)';
  }

  // Clamp rating between 0 and 5
  const clampedRating = Math.max(0, Math.min(5, rating));
  
  // Round to nearest integer for star count
  const starCount = Math.round(clampedRating);
  
  // Generate stars
  const stars = '⭐'.repeat(starCount);
  
  // Format rating with one decimal place
  const formattedRating = clampedRating.toFixed(1);
  
  return `${stars} (${formattedRating})`;
}

/**
 * Format distance from meters to kilometers
 * 
 * @param meters - Distance in meters
 * @returns Formatted distance string in kilometers
 * 
 * Examples:
 * - formatDistance(1500) => "1.5 km"
 * - formatDistance(5000) => "5.0 km"
 * - formatDistance(250) => "0.3 km"
 */
export function formatDistance(meters: number): string {
  if (typeof meters !== 'number' || isNaN(meters) || meters < 0) {
    return '0.0 km';
  }

  // Convert meters to kilometers
  const kilometers = meters / 1000;
  
  // Format with one decimal place
  const formatted = kilometers.toFixed(1);
  
  return `${formatted} km`;
}

/**
 * Format duration from seconds to human-readable format
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 * 
 * Examples:
 * - formatDuration(90) => "1 min"
 * - formatDuration(3600) => "1 hr"
 * - formatDuration(3750) => "1 hr 3 min"
 */
export function formatDuration(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '0 min';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${hours} hr`;
  }

  return `${minutes} min`;
}

/**
 * Format location for display
 * Shows landmark name if available, otherwise coordinates
 * 
 * @param location - Location object with lat, lng, and optional landmarkName
 * @returns Formatted location string
 * 
 * Examples:
 * - formatLocation({ lat: 34.5, lng: 69.2, landmarkName: 'Kabul Airport' }) => "Kabul Airport"
 * - formatLocation({ lat: 34.5, lng: 69.2 }) => "34.5000, 69.2000"
 */
export function formatLocation(location: {
  lat: number;
  lng: number;
  landmarkName?: string;
}): string {
  if (location.landmarkName) {
    return location.landmarkName;
  }

  // Format coordinates with 4 decimal places
  const lat = location.lat.toFixed(4);
  const lng = location.lng.toFixed(4);
  
  return `${lat}, ${lng}`;
}

/**
 * Format elapsed time since a timestamp
 * 
 * @param timestamp - Date object or timestamp
 * @returns Human-readable elapsed time
 * 
 * Examples:
 * - formatElapsedTime(Date.now() - 30000) => "30s ago"
 * - formatElapsedTime(Date.now() - 120000) => "2m ago"
 */
export function formatElapsedTime(timestamp: Date | number): string {
  const now = Date.now();
  const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  const elapsedMs = now - time;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `${elapsedHours}h ago`;
}

/**
 * Convert Western numerals to Persian/Arabic numerals
 * Used for RTL locales (Dari/Pashto)
 * 
 * @param num - Number or string to convert
 * @returns String with Persian numerals
 */
export function toPersianNumerals(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}
