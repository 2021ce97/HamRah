/**
 * Unit Tests for FareValidator Utility
 * 
 * Tests validation and formatting functions for fare amounts.
 * Validates: Requirements 3.4, 6.2, 5.4
 */

const { isValidFare, formatFare } = require('./fareValidator');

describe('FareValidator', () => {
  describe('isValidFare', () => {
    test('returns true for positive numbers', () => {
      expect(isValidFare(1)).toBe(true);
      expect(isValidFare(100)).toBe(true);
      expect(isValidFare(0.01)).toBe(true);
      expect(isValidFare(9999.99)).toBe(true);
    });

    test('returns false for zero', () => {
      expect(isValidFare(0)).toBe(false);
    });

    test('returns false for negative numbers', () => {
      expect(isValidFare(-1)).toBe(false);
      expect(isValidFare(-100)).toBe(false);
      expect(isValidFare(-0.01)).toBe(false);
    });

    test('returns false for non-numeric values', () => {
      expect(isValidFare('100')).toBe(false);
      expect(isValidFare(null)).toBe(false);
      expect(isValidFare(undefined)).toBe(false);
      expect(isValidFare({})).toBe(false);
      expect(isValidFare([])).toBe(false);
      expect(isValidFare(NaN)).toBe(false);
    });

    test('returns false for Infinity', () => {
      expect(isValidFare(Infinity)).toBe(false);
      expect(isValidFare(-Infinity)).toBe(false);
    });
  });

  describe('formatFare', () => {
    describe('English locale', () => {
      test('formats simple amounts with AFN symbol', () => {
        expect(formatFare(100, 'English')).toBe('100 AFN');
        expect(formatFare(1, 'English')).toBe('1 AFN');
        expect(formatFare(50, 'English')).toBe('50 AFN');
      });

      test('formats amounts with thousands separator', () => {
        expect(formatFare(1000, 'English')).toBe('1,000 AFN');
        expect(formatFare(1234, 'English')).toBe('1,234 AFN');
        expect(formatFare(10000, 'English')).toBe('10,000 AFN');
      });

      test('formats decimal amounts', () => {
        expect(formatFare(123.5, 'English')).toBe('123.5 AFN');
        expect(formatFare(1234.56, 'English')).toBe('1,234.56 AFN');
      });

      test('handles default locale (English)', () => {
        expect(formatFare(100)).toBe('100 AFN');
        expect(formatFare(1234)).toBe('1,234 AFN');
      });
    });

    describe('Dari locale', () => {
      test('formats amounts with Eastern Arabic numerals', () => {
        expect(formatFare(100, 'Dari')).toBe('۱۰۰ AFN');
        expect(formatFare(123, 'Dari')).toBe('۱۲۳ AFN');
        expect(formatFare(1, 'Dari')).toBe('۱ AFN');
      });

      test('formats amounts with thousands separator using Eastern Arabic numerals', () => {
        expect(formatFare(1000, 'Dari')).toBe('۱,۰۰۰ AFN');
        expect(formatFare(1234, 'Dari')).toBe('۱,۲۳۴ AFN');
      });

      test('formats decimal amounts with Eastern Arabic numerals', () => {
        expect(formatFare(123.5, 'Dari')).toBe('۱۲۳.۵ AFN');
      });

      test('handles case-insensitive locale name', () => {
        expect(formatFare(100, 'dari')).toBe('۱۰۰ AFN');
        expect(formatFare(100, 'DARI')).toBe('۱۰۰ AFN');
      });
    });

    describe('Pashto locale', () => {
      test('formats amounts with Eastern Arabic numerals', () => {
        expect(formatFare(100, 'Pashto')).toBe('۱۰۰ AFN');
        expect(formatFare(456, 'Pashto')).toBe('۴۵۶ AFN');
      });

      test('formats amounts with thousands separator using Eastern Arabic numerals', () => {
        expect(formatFare(5000, 'Pashto')).toBe('۵,۰۰۰ AFN');
      });

      test('handles case-insensitive locale name', () => {
        expect(formatFare(100, 'pashto')).toBe('۱۰۰ AFN');
        expect(formatFare(100, 'PASHTO')).toBe('۱۰۰ AFN');
      });
    });

    describe('locale code support', () => {
      test('supports fa (Farsi/Dari) locale code', () => {
        expect(formatFare(100, 'fa')).toBe('۱۰۰ AFN');
      });

      test('supports ps (Pashto) locale code', () => {
        expect(formatFare(100, 'ps')).toBe('۱۰۰ AFN');
      });
    });

    describe('invalid amounts', () => {
      test('returns "0 AFN" for invalid amounts', () => {
        expect(formatFare(0, 'English')).toBe('0 AFN');
        expect(formatFare(-100, 'English')).toBe('0 AFN');
        expect(formatFare(NaN, 'English')).toBe('0 AFN');
      });
    });

    describe('edge cases', () => {
      test('formats very large amounts', () => {
        expect(formatFare(1000000, 'English')).toBe('1,000,000 AFN');
        expect(formatFare(1000000, 'Dari')).toBe('۱,۰۰۰,۰۰۰ AFN');
      });

      test('formats very small decimal amounts', () => {
        expect(formatFare(0.01, 'English')).toBe('0.01 AFN');
        expect(formatFare(0.99, 'English')).toBe('0.99 AFN');
      });
    });
  });
});
