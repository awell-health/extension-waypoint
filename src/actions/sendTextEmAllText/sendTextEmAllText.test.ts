import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { TestHelpers } from '@awell-health/extensions-core'
import { sendTextEmAllText as actionInterface } from './sendTextEmAllText'
import { generateTestPayload } from '../../test-helpers'

// Mock the OAuth module to avoid real signature generation
vi.mock('../../lib/oauth', () => ({
  generateOAuthHeader: vi.fn(() => 'OAuth mocked-oauth-header'),
}))

// Mock fetch globally
global.fetch = vi.fn()

describe('Send Text-em-all Text Action', () => {
  const {
    extensionAction: sendTextAction,
    onComplete,
    onError,
    helpers,
    clearMocks,
  } = TestHelpers.fromAction(actionInterface)

  const mockSettings = {
    gcp_sa_b64: 'mock-gcp-key',
    textemall_consumer_key: 'mock-consumer-key',
    textemall_consumer_secret: 'mock-consumer-secret',
    textemall_oauth_token: 'mock-oauth-token',
    textemall_token_secret: 'mock-token-secret',
    textemall_base_url: 'https://api.text-em-all.com/v2/broadcast',
  }

  beforeEach(() => {
    clearMocks()
    vi.clearAllMocks()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Successful SMS send', () => {
    test('Should send SMS with all required fields and patient info', async () => {
      // Mock successful API response
      const mockResponse = {
        BroadcastID: '12345',
        Status: 'Scheduled',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      // Set test date to Monday 9am Central
      const testDate = new Date('2025-11-10T15:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await sendTextAction.onEvent({
        payload: generateTestPayload({
          fields: {
            textMessage: '<p>Hello, please complete your eligibility form.</p>',
            textNumberID: '555-1234',
            patientTextNumber: '+1-555-987-6543',
          },
          settings: mockSettings,
          patient: {
            id: 'patient-123',
            profile: {
              first_name: 'John',
              last_name: 'Doe',
            },
          },
        }),
        onComplete,
        onError,
        helpers,
        attempt: 1,
      })

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        mockSettings.textemall_base_url,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: expect.stringContaining('OAuth'),
          }),
          body: expect.any(String),
        })
      )

      // Verify OAuth 1.0 header is present (mocked in tests)
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      const authHeader = fetchCall[1].headers.Authorization
      expect(authHeader).toMatch(/^OAuth /)
      // Note: OAuth header is mocked in tests, so we just verify it starts with "OAuth "

      // Verify request body structure
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody).toEqual({
        BroadcastName: expect.stringContaining('Awell Eligibility Form SMS'),
        BroadcastType: 'SMS',
        CheckCallingWindow: 'false',
        StartDate: '11/10/2025 11AM', // Before 10am on Monday, should use today
        TextMessage: '<p>Hello, please complete your eligibility form.</p>',
        TextNumberID: '555-1234',
        Contacts: [
          {
            FirstName: 'John',
            LastName: 'Doe',
            PrimaryPhone: '+1-555-987-6543',
            Notes: 'Eligibility form from Awell',
            IntegrationData: 'Extra field for information',
          },
        ],
      })

      // Verify onComplete was called with correct data points
      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          broadcast_id: '12345',
          start_date: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
          ),
          start_date_formatted: '11/10/2025 11AM',
        },
      })
    })

    test('Should handle missing patient names gracefully', async () => {
      const mockResponse = {
        BroadcastID: '67890',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const testDate = new Date('2025-11-10T15:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await sendTextAction.onEvent({
        payload: generateTestPayload({
          fields: {
            textMessage: 'Test message',
            textNumberID: '555-1234',
            patientTextNumber: '+1-555-000-0000',
          },
          settings: mockSettings,
          patient: {
            id: 'patient-456',
            // No first_name or last_name
          },
        }),
        onComplete,
        onError,
        helpers,
        attempt: 1,
      })

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.Contacts[0].FirstName).toBe('')
      expect(requestBody.Contacts[0].LastName).toBe('')

      expect(onComplete).toHaveBeenCalled()
    })

    test('Should schedule for next workday when after 10am Central', async () => {
      const mockResponse = {
        BroadcastID: '11111',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      // Monday 10am Central (should use next day)
      const testDate = new Date('2025-11-10T16:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await sendTextAction.onEvent({
        payload: generateTestPayload({
          fields: {
            textMessage: 'Test',
            textNumberID: '555-1234',
            patientTextNumber: '+1-555-111-2222',
          },
          settings: mockSettings,
          patient: {
            id: 'patient-789',
            profile: {
              first_name: 'Jane',
              last_name: 'Smith',
            },
          },
        }),
        onComplete,
        onError,
        helpers,
        attempt: 1,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          broadcast_id: '11111',
          start_date: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
          ),
          start_date_formatted: '11/11/2025 11AM', // Tuesday (next day)
        },
      })
    })

    test('Should schedule for Monday when sent on Friday after 10am', async () => {
      const mockResponse = {
        BroadcastID: '22222',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      // Friday 10am Central (should use next Monday)
      const testDate = new Date('2025-11-14T16:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await sendTextAction.onEvent({
        payload: generateTestPayload({
          fields: {
            textMessage: 'Weekend test',
            textNumberID: '555-1234',
            patientTextNumber: '+1-555-333-4444',
          },
          settings: mockSettings,
          patient: {
            id: 'patient-999',
            profile: {
              first_name: 'Bob',
              last_name: 'Johnson',
            },
          },
        }),
        onComplete,
        onError,
        helpers,
        attempt: 1,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          broadcast_id: '22222',
          start_date: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
          ),
          start_date_formatted: '11/17/2025 11AM', // Monday
        },
      })
    })
  })

  describe('Error handling', () => {
    test('Should handle API errors correctly', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      })

      const testDate = new Date('2025-11-10T15:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await sendTextAction.onEvent({
        payload: generateTestPayload({
          fields: {
            textMessage: 'Test',
            textNumberID: '555-1234',
            patientTextNumber: '+1-555-555-5555',
          },
          settings: mockSettings,
          patient: {
            id: 'patient-error',
            profile: {
              first_name: 'Error',
              last_name: 'Test',
            },
          },
        }),
        onComplete,
        onError,
        helpers,
        attempt: 1,
      })

      expect(onError).toHaveBeenCalledWith({
        events: [
          {
            date: expect.any(String),
            text: {
              en: 'Text-em-all API error: 401 Unauthorized - Invalid API key',
            },
            error: {
              category: 'SERVER_ERROR',
              message:
                'Text-em-all API error: 401 Unauthorized - Invalid API key',
            },
          },
        ],
      })

      expect(onComplete).not.toHaveBeenCalled()
    })

    test('Should handle network errors', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error: Failed to connect')
      )

      const testDate = new Date('2025-11-10T15:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await sendTextAction.onEvent({
        payload: generateTestPayload({
          fields: {
            textMessage: 'Test',
            textNumberID: '555-1234',
            patientTextNumber: '+1-555-666-7777',
          },
          settings: mockSettings,
          patient: {
            id: 'patient-network-error',
            profile: {
              first_name: 'Network',
              last_name: 'Error',
            },
          },
        }),
        onComplete,
        onError,
        helpers,
        attempt: 1,
      })

      expect(onError).toHaveBeenCalledWith({
        events: [
          {
            date: expect.any(String),
            text: {
              en: 'Network error: Failed to connect',
            },
            error: {
              category: 'SERVER_ERROR',
              message: 'Network error: Failed to connect',
            },
          },
        ],
      })

      expect(onComplete).not.toHaveBeenCalled()
    })
  })
})
