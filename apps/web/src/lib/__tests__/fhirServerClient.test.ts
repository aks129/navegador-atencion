import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchPatientEverything,
  testConnection,
  clearCache,
  type FHIRServerConfig,
  type FHIRServerResponse
} from '../fhirServerClient'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('fhirServerClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCache()
  })

  describe('fetchPatientEverything', () => {
    const validConfig: FHIRServerConfig = {
      serverUrl: 'http://localhost:8080/fhir',
      patientId: 'test-patient-123',
      isDemoMode: false
    }

    const validBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 2,
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'test-patient-123',
            name: [{ given: ['John'], family: 'Doe' }],
            birthDate: '1980-01-01'
          }
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-123',
            code: { text: 'Blood Pressure' }
          }
        }
      ]
    }

    it('should successfully fetch patient data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(validBundle)
      })

      const result = await fetchPatientEverything(validConfig)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(validBundle)
      expect(result.fromCache).toBe(false)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/fhir/Patient/test-patient-123/$everything',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/fhir+json',
            'Content-Type': 'application/fhir+json'
          })
        })
      )
    })

    it('should return cached data on subsequent calls', async () => {
      // First call - fetch from server
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(validBundle)
      })

      const firstResult = await fetchPatientEverything(validConfig)
      expect(firstResult.fromCache).toBe(false)

      // Second call - should use cache
      const secondResult = await fetchPatientEverything(validConfig)
      expect(secondResult.success).toBe(true)
      expect(secondResult.fromCache).toBe(true)
      expect(secondResult.data).toEqual(validBundle)
      expect(mockFetch).toHaveBeenCalledTimes(1) // Not called again
    })

    it('should handle 401 authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const result = await fetchPatientEverything(validConfig)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('AUTH_ERROR')
      expect(result.error?.message).toContain('Authentication failed')
      expect(result.error?.statusCode).toBe(401)
    })

    it('should handle TLS/SSL certificate errors', async () => {
      mockFetch.mockRejectedValueOnce(
        new Error('self signed certificate in certificate chain')
      )

      const result = await fetchPatientEverything(validConfig)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('TLS_ERROR')
      expect(result.error?.message).toContain('TLS/SSL certificate error')
    })

    it('should handle network timeout', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100)
        })
      )

      const result = await fetchPatientEverything(validConfig)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('NETWORK_ERROR')
    })

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Not valid JSON {{'
      })

      const result = await fetchPatientEverything(validConfig)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MALFORMED_DATA')
      expect(result.error?.message).toContain('invalid JSON')
    })

    it('should handle invalid Bundle structure', async () => {
      const invalidBundle = {
        resourceType: 'NotABundle',
        data: []
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(invalidBundle)
      })

      const result = await fetchPatientEverything(validConfig)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MALFORMED_DATA')
      expect(result.error?.message).toContain('not a FHIR Bundle')
    })

    it('should handle Bundle with invalid entries', async () => {
      const bundleWithInvalidEntry = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              // Missing resourceType
              id: 'invalid'
            }
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(bundleWithInvalidEntry)
      })

      const result = await fetchPatientEverything(validConfig)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MALFORMED_DATA')
      expect(result.error?.message).toContain('invalid entries')
    })

    it('should handle patient not found (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      const result = await fetchPatientEverything(validConfig)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVALID_PATIENT')
      expect(result.error?.message).toContain('Patient with ID')
      expect(result.error?.message).toContain('not found')
    })

    it('should sanitize PHI in demo mode', async () => {
      const bundleWithPHI = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              id: 'test-patient-123',
              name: [{ given: ['John', 'Robert'], family: 'Smith' }],
              birthDate: '1980-06-15',
              address: [{
                line: ['123 Main St', 'Apt 4B'],
                city: 'Boston',
                state: 'MA',
                postalCode: '02134'
              }],
              telecom: [
                { system: 'phone', value: '617-555-1234' },
                { system: 'email', value: 'john.smith@email.com' }
              ]
            }
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(bundleWithPHI)
      })

      const demoConfig = { ...validConfig, isDemoMode: true }
      const result = await fetchPatientEverything(demoConfig)

      expect(result.success).toBe(true)

      const patient = result.data?.entry?.[0]?.resource as any
      expect(patient.name[0].given).toEqual(['DEMO'])
      expect(patient.name[0].family).toBe('PATIENT')
      expect(patient.birthDate).toBe('1980-01-01') // Only month/day changed
      expect(patient.address[0].line).toEqual(['123 Demo Street'])
      expect(patient.address[0].city).toBe('Demo City')
      expect(patient.telecom[0].value).toBe('555-0100')
      expect(patient.telecom[1].value).toBe('demo@example.com')

      // Check for demo mode tag
      expect(result.data?.meta?.tag).toContainEqual(
        expect.objectContaining({
          code: 'DEMO_MODE_DATA_SANITIZED'
        })
      )
    })

    it('should include auth token when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(validBundle)
      })

      const configWithAuth = {
        ...validConfig,
        authToken: 'test-token-123'
      }

      await fetchPatientEverything(configWithAuth)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123'
          })
        })
      )
    })

    it('should handle server errors with FHIR OperationOutcome', async () => {
      const operationOutcome = {
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'processing',
          diagnostics: 'Server is temporarily unavailable'
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => operationOutcome
      })

      const result = await fetchPatientEverything(validConfig)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('SERVER_ERROR')
      expect(result.error?.message).toContain('Server is temporarily unavailable')
    })

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => ''
      })

      const result = await fetchPatientEverything(validConfig)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MALFORMED_DATA')
      expect(result.error?.message).toContain('empty response')
    })

    it('should handle invalid server URL', async () => {
      const invalidConfig = {
        ...validConfig,
        serverUrl: 'not-a-valid-url'
      }

      const result = await fetchPatientEverything(invalidConfig)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('NETWORK_ERROR')
      expect(result.error?.message).toContain('Invalid server URL')
    })
  })

  describe('testConnection', () => {
    it('should successfully test connection', async () => {
      const capabilityStatement = {
        resourceType: 'CapabilityStatement',
        fhirVersion: '4.0.1',
        format: ['json', 'xml']
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => capabilityStatement
      })

      const result = await testConnection('http://localhost:8080/fhir')

      expect(result.success).toBe(true)
      expect(result.version).toBe('4.0.1')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/fhir/metadata',
        expect.any(Object)
      )
    })

    it('should handle connection failure', async () => {
      mockFetch.mockRejectedValueOnce(
        new Error('Network error')
      )

      const result = await testConnection('http://localhost:8080/fhir')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('NETWORK_ERROR')
    })

    it('should handle TLS errors in connection test', async () => {
      mockFetch.mockRejectedValueOnce(
        new Error('SSL certificate problem')
      )

      const result = await testConnection('https://localhost:8443/fhir')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('TLS_ERROR')
    })

    it('should handle non-CapabilityStatement response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          resourceType: 'Bundle',
          type: 'searchset'
        })
      })

      const result = await testConnection('http://localhost:8080/fhir')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MALFORMED_DATA')
      expect(result.error?.message).toContain('CapabilityStatement')
    })
  })

  describe('cache management', () => {
    it('should clear cache', async () => {
      const config: FHIRServerConfig = {
        serverUrl: 'http://localhost:8080/fhir',
        patientId: 'test-patient',
        isDemoMode: false
      }

      const bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: []
      }

      // First fetch - from server
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(bundle)
      })

      await fetchPatientEverything(config)

      // Clear cache
      clearCache()

      // Second fetch - should hit server again, not cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(bundle)
      })

      const result = await fetchPatientEverything(config)

      expect(result.fromCache).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
