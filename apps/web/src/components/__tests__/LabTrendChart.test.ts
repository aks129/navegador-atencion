import { describe, it, expect } from 'vitest'
import { isValueOutOfRange, extractNumericValue } from '../LabTrendChart'

describe('LabTrendChart Utilities', () => {
  describe('isValueOutOfRange', () => {
    it('should return false when no reference range is provided', () => {
      expect(isValueOutOfRange(50)).toBe(false)
      expect(isValueOutOfRange(50, undefined)).toBe(false)
    })

    it('should return false when value is within range', () => {
      const range = { low: 10, high: 100 }

      expect(isValueOutOfRange(50, range)).toBe(false)
      expect(isValueOutOfRange(10, range)).toBe(false) // boundary low
      expect(isValueOutOfRange(100, range)).toBe(false) // boundary high
      expect(isValueOutOfRange(55.5, range)).toBe(false) // decimal value
    })

    it('should return true when value is below low range', () => {
      const range = { low: 10, high: 100 }

      expect(isValueOutOfRange(5, range)).toBe(true)
      expect(isValueOutOfRange(9.9, range)).toBe(true)
      expect(isValueOutOfRange(0, range)).toBe(true)
      expect(isValueOutOfRange(-5, range)).toBe(true)
    })

    it('should return true when value is above high range', () => {
      const range = { low: 10, high: 100 }

      expect(isValueOutOfRange(101, range)).toBe(true)
      expect(isValueOutOfRange(100.1, range)).toBe(true)
      expect(isValueOutOfRange(200, range)).toBe(true)
    })

    it('should handle missing low boundary', () => {
      const range = { high: 100 }

      expect(isValueOutOfRange(50, range)).toBe(false)
      expect(isValueOutOfRange(0, range)).toBe(false)
      expect(isValueOutOfRange(-10, range)).toBe(false)
      expect(isValueOutOfRange(101, range)).toBe(true)
    })

    it('should handle missing high boundary', () => {
      const range = { low: 10 }

      expect(isValueOutOfRange(50, range)).toBe(false)
      expect(isValueOutOfRange(1000, range)).toBe(false)
      expect(isValueOutOfRange(10, range)).toBe(false)
      expect(isValueOutOfRange(9, range)).toBe(true)
    })

    it('should handle empty range object', () => {
      const range = {}

      expect(isValueOutOfRange(50, range)).toBe(false)
      expect(isValueOutOfRange(-10, range)).toBe(false)
      expect(isValueOutOfRange(1000, range)).toBe(false)
    })

    it('should handle edge cases with zero boundaries', () => {
      const range = { low: 0, high: 10 }

      expect(isValueOutOfRange(0, range)).toBe(false)
      expect(isValueOutOfRange(5, range)).toBe(false)
      expect(isValueOutOfRange(10, range)).toBe(false)
      expect(isValueOutOfRange(-1, range)).toBe(true)
      expect(isValueOutOfRange(11, range)).toBe(true)
    })
  })

  describe('extractNumericValue', () => {
    it('should return number values as-is', () => {
      expect(extractNumericValue(42)).toBe(42)
      expect(extractNumericValue(0)).toBe(0)
      expect(extractNumericValue(-10)).toBe(-10)
      expect(extractNumericValue(3.14159)).toBe(3.14159)
    })

    it('should extract numbers from simple string values', () => {
      expect(extractNumericValue('42')).toBe(42)
      expect(extractNumericValue('0')).toBe(0)
      expect(extractNumericValue('-10')).toBe(-10)
      expect(extractNumericValue('3.14')).toBe(3.14)
    })

    it('should extract numbers from strings with units', () => {
      expect(extractNumericValue('120 mg/dL')).toBe(120)
      expect(extractNumericValue('98.6 °F')).toBe(98.6)
      expect(extractNumericValue('7.2 mmol/L')).toBe(7.2)
      expect(extractNumericValue('150mg')).toBe(150)
    })

    it('should extract first number from complex strings', () => {
      expect(extractNumericValue('Normal (120-140 mg/dL)')).toBe(120)
      expect(extractNumericValue('Result: 85.5 units')).toBe(85.5)
      expect(extractNumericValue('High 200+ mg/dL')).toBe(200)
    })

    it('should handle negative numbers in strings', () => {
      expect(extractNumericValue('-5.2 degrees')).toBe(-5.2)
      expect(extractNumericValue('Below normal -10 units')).toBe(-10)
    })

    it('should return null for strings without numbers', () => {
      expect(extractNumericValue('Normal')).toBe(null)
      expect(extractNumericValue('High')).toBe(null)
      expect(extractNumericValue('N/A')).toBe(null)
      expect(extractNumericValue('')).toBe(null)
      expect(extractNumericValue('Positive')).toBe(null)
    })

    it('should handle decimal-only numbers', () => {
      expect(extractNumericValue('.5')).toBe(0.5)
      expect(extractNumericValue('0.75 units')).toBe(0.75)
    })

    it('should handle whitespace and special characters', () => {
      expect(extractNumericValue('  120.5  ')).toBe(120.5)
      expect(extractNumericValue('~100 mg')).toBe(100)
      expect(extractNumericValue('>75 units')).toBe(75)
      expect(extractNumericValue('<50 mg/dL')).toBe(50)
    })

    it('should handle scientific notation in strings', () => {
      expect(extractNumericValue('1.5e3 units')).toBe(1.5)
      expect(extractNumericValue('2.1E-2 mg')).toBe(2.1)
    })
  })

  describe('Integration - Out-of-range detection with extracted values', () => {
    it('should correctly identify out-of-range values from string inputs', () => {
      const range = { low: 70, high: 100 }

      // Normal values
      expect(isValueOutOfRange(extractNumericValue('85.2 mg/dL')!, range)).toBe(false)
      expect(isValueOutOfRange(extractNumericValue('100 mg/dL')!, range)).toBe(false)

      // Out of range values
      expect(isValueOutOfRange(extractNumericValue('65 mg/dL')!, range)).toBe(true)
      expect(isValueOutOfRange(extractNumericValue('110 mg/dL')!, range)).toBe(true)
    })

    it('should handle complex lab result formats', () => {
      const range = { low: 4.5, high: 11.0 }

      // HbA1c percentages
      expect(isValueOutOfRange(extractNumericValue('5.7% (39 mmol/mol)')!, range)).toBe(false)
      expect(isValueOutOfRange(extractNumericValue('12.1% (109 mmol/mol)')!, range)).toBe(true)
      expect(isValueOutOfRange(extractNumericValue('3.8% (18 mmol/mol)')!, range)).toBe(true)
    })

    it('should work with medication dosages', () => {
      const range = { low: 5, high: 40 }

      expect(isValueOutOfRange(extractNumericValue('10 mg twice daily')!, range)).toBe(false)
      expect(isValueOutOfRange(extractNumericValue('50 mg daily')!, range)).toBe(true)
      expect(isValueOutOfRange(extractNumericValue('2.5 mg as needed')!, range)).toBe(true)
    })
  })
})