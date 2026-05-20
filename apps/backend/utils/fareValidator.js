/**
 * FareValidator Utility
 * 
 * Provides validation and formatting functions for fare amounts in the HamRah ride-hailing system.
 * All fare amounts are in AFN (Afghan Afghani) currency.
 * 
 * Validates: Requirements 3.4, 6.2, 5.4
 */

/**
 * Validates that a fare amount is positive
 * 
 * @param {number} amount - The fare amount to validate
 * @returns {boolean} - True if amount is greater than zero, false otherwise
 * 
 * Validates: Requirements 3.4, 6.2
 */
function isValidFare(amount) {
  return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount > 0;
}

/**
 * Formats a fare amount for display with AFN currency symbol
 * 
 * Supports RTL (right-to-left) formatting for Dari and Pashto locales.
 * 
 * @param {number} amount - The fare amount to format
 * @param {string} locale - The locale for formatting ('Dari', 'Pashto', 'English', or standard locale codes)
 * @returns {string} - Formatted fare string with AFN symbol
 * 
 * Examples:
 * - formatFare(123, 'English') => "123 AFN"
 * - formatFare(123, 'Dari') => "۱۲۳ AFN"
 * - formatFare(1234.5, 'English') => "1,234.5 AFN"
 * 
 * Validates: Requirements 5.4
 */
function formatFare(amount, locale = 'English') {
  if (!isValidFare(amount)) {
    return '0 AFN';
  }

  // Normalize locale names
  const normalizedLocale = locale.toLowerCase();
  const isRTL = normalizedLocale === 'dari' || normalizedLocale === 'pashto' || 
                normalizedLocale === 'fa' || normalizedLocale === 'ps';

  // Format the number with appropriate locale
  let formattedNumber;
  
  if (isRTL) {
    // For RTL languages (Dari/Pashto), use Eastern Arabic numerals
    formattedNumber = convertToEasternArabicNumerals(amount);
  } else {
    // For English and other locales, use standard formatting with commas
    formattedNumber = amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  // Return formatted string with AFN symbol
  return `${formattedNumber} AFN`;
}

/**
 * Converts Western Arabic numerals (0-9) to Eastern Arabic numerals (۰-۹)
 * Used for Dari and Pashto locales
 * 
 * @param {number} number - The number to convert
 * @returns {string} - String with Eastern Arabic numerals
 * @private
 */
function convertToEasternArabicNumerals(number) {
  const easternArabicNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  // Format with commas first
  const formatted = number.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  // Convert each digit to Eastern Arabic
  return formatted.split('').map(char => {
    const digit = parseInt(char, 10);
    return isNaN(digit) ? char : easternArabicNumerals[digit];
  }).join('');
}

module.exports = {
  isValidFare,
  formatFare
};
