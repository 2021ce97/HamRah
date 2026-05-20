/**
 * RTL (Right-to-Left) utilities for Dari and Pashto languages
 */

import { I18nManager } from 'react-native';

export type Locale = 'en' | 'fa' | 'ps'; // English, Dari (Farsi), Pashto

/**
 * Check if the current locale is RTL
 */
export function isRTL(locale: Locale): boolean {
  return locale === 'fa' || locale === 'ps';
}

/**
 * Force RTL layout for the app
 * Call this on app startup if user's language is Dari or Pashto
 */
export function forceRTL(enable: boolean = true): void {
  if (I18nManager.isRTL !== enable) {
    I18nManager.forceRTL(enable);
    I18nManager.allowRTL(enable);
  }
}

/**
 * Get text alignment based on locale
 */
export function getTextAlign(locale: Locale): 'left' | 'right' | 'center' {
  return isRTL(locale) ? 'right' : 'left';
}

/**
 * Get flex direction based on locale
 */
export function getFlexDirection(locale: Locale): 'row' | 'row-reverse' {
  return isRTL(locale) ? 'row-reverse' : 'row';
}

/**
 * Get writing direction based on locale
 */
export function getWritingDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}
