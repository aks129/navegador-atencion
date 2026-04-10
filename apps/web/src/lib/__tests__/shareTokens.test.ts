import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateShareToken, verifyShareToken, isTokenExpired, getTokenExpiry } from '../shareTokens'

// Mock crypto for consistent testing
const mockHmac = vi.hoisted(() => ({
  update: vi.fn().mockReturnThis(),
  digest: vi.fn().mockReturnValue('mock-signature')
}))

vi.mock('crypto', () => ({
  default: { createHmac: vi.fn().mockReturnValue(mockHmac) },
  createHmac: vi.fn().mockReturnValue(mockHmac)
}))

describe('shareTokens', () => {
  const mockData = {
    bundleId: 'test-bundle-123',
    summaryData: {
      sections: [
        {
          title: 'Test Section',
          content: 'Test content'
        }
      ]
    },
    reviewItems: [
      {
        title: 'Test Review Item',
        description: 'Test description'
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date.now to ensure consistent timestamps
    vi.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01T00:00:00.000Z
  })

  describe('generateShareToken', () => {
    it('should generate a valid base64 token', () => {
      const token = generateShareToken(mockData)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)

      // Should be valid base64
      expect(() => Buffer.from(token, 'base64')).not.toThrow()
    })

    it('should include all required data in token', () => {
      const token = generateShareToken(mockData)
      const decodedData = JSON.parse(Buffer.from(token, 'base64').toString())

      expect(decodedData).toHaveProperty('bundleId', mockData.bundleId)
      expect(decodedData).toHaveProperty('summaryData', mockData.summaryData)
      expect(decodedData).toHaveProperty('reviewItems', mockData.reviewItems)
      expect(decodedData).toHaveProperty('signature', 'mock-signature')
      expect(decodedData).toHaveProperty('expiry')
      expect(decodedData).toHaveProperty('created')
    })

    it('should set expiry to 7 days from creation', () => {
      const token = generateShareToken(mockData)
      const decodedData = JSON.parse(Buffer.from(token, 'base64').toString())

      const expectedExpiry = 1640995200000 + (7 * 24 * 60 * 60 * 1000) // 7 days from mock timestamp
      expect(decodedData.expiry).toBe(expectedExpiry)
    })
  })

  describe('verifyShareToken', () => {
    it('should verify a valid token', () => {
      const token = generateShareToken(mockData)
      const verified = verifyShareToken(token)

      expect(verified).toBeDefined()
      expect(verified?.bundleId).toBe(mockData.bundleId)
      expect(verified?.summaryData).toEqual(mockData.summaryData)
      expect(verified?.reviewItems).toEqual(mockData.reviewItems)
    })

    it('should return null for invalid base64', () => {
      const invalidToken = 'invalid-base64-token!'
      const verified = verifyShareToken(invalidToken)

      expect(verified).toBeNull()
    })

    it('should return null for malformed JSON', () => {
      const invalidToken = Buffer.from('invalid json content').toString('base64')
      const verified = verifyShareToken(invalidToken)

      expect(verified).toBeNull()
    })

    it('should return null for expired token', () => {
      // Generate token at the original (mocked) time → expiry = original + 7 days
      const token = generateShareToken(mockData)

      // Verify 8 days later (past the 7-day expiry)
      const futureTime = 1640995200000 + (8 * 24 * 60 * 60 * 1000)
      vi.spyOn(Date, 'now').mockReturnValue(futureTime)
      const verified = verifyShareToken(token)

      expect(verified).toBeNull()
    })

    it('should return null for token with invalid signature', () => {
      // Create a token with a different signature
      const token = generateShareToken(mockData)
      const decodedData = JSON.parse(Buffer.from(token, 'base64').toString())

      // Tamper with the signature
      decodedData.signature = 'tampered-signature'
      const tamperedToken = Buffer.from(JSON.stringify(decodedData)).toString('base64')

      const verified = verifyShareToken(tamperedToken)
      expect(verified).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const token = generateShareToken(mockData)
      const expired = isTokenExpired(token)

      expect(expired).toBe(false)
    })

    it('should return true for expired token', () => {
      const token = generateShareToken(mockData)

      // Mock time to be after expiry
      const futureTime = 1640995200000 + (8 * 24 * 60 * 60 * 1000) // 8 days later
      vi.spyOn(Date, 'now').mockReturnValue(futureTime)

      const expired = isTokenExpired(token)
      expect(expired).toBe(true)
    })

    it('should return true for invalid token', () => {
      const expired = isTokenExpired('invalid-token')
      expect(expired).toBe(true)
    })
  })

  describe('getTokenExpiry', () => {
    it('should return expiry date for valid token', () => {
      const token = generateShareToken(mockData)
      const expiry = getTokenExpiry(token)

      expect(expiry).toBeInstanceOf(Date)

      const expectedExpiry = new Date(1640995200000 + (7 * 24 * 60 * 60 * 1000))
      expect(expiry).toEqual(expectedExpiry)
    })

    it('should return null for invalid token', () => {
      const expiry = getTokenExpiry('invalid-token')
      expect(expiry).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle empty review items array', () => {
      const dataWithEmptyItems = {
        ...mockData,
        reviewItems: []
      }

      const token = generateShareToken(dataWithEmptyItems)
      const verified = verifyShareToken(token)

      expect(verified).toBeDefined()
      expect(verified?.reviewItems).toEqual([])
    })

    it('should handle large data payloads', () => {
      const largeData = {
        bundleId: 'large-bundle',
        summaryData: {
          sections: Array(100).fill(0).map((_, i) => ({
            title: `Section ${i}`,
            content: 'Lorem ipsum '.repeat(100) // Large content block
          }))
        },
        reviewItems: Array(50).fill(0).map((_, i) => ({
          title: `Review Item ${i}`,
          description: 'Description '.repeat(50)
        }))
      }

      const token = generateShareToken(largeData)
      const verified = verifyShareToken(token)

      expect(verified).toBeDefined()
      expect(verified?.summaryData.sections).toHaveLength(100)
      expect(verified?.reviewItems).toHaveLength(50)
    })
  })
})
