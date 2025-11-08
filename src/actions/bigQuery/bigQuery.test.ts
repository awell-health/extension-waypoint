import { describe, test, expect, beforeEach, vi } from 'vitest'
import { TestHelpers } from '@awell-health/extensions-core'
import { bigQuery as actionInterface } from './bigQuery'
import { generateTestPayload } from '../../test-helpers'
import { BigQuery } from '@google-cloud/bigquery'

// Mock BigQuery
vi.mock('@google-cloud/bigquery')

describe('BigQuery Action', () => {
  const {
    extensionAction: bigQueryAction,
    onComplete,
    onError,
    helpers,
    clearMocks,
  } = TestHelpers.fromAction(actionInterface)

  const mockQueryResult = [
    [{ id: 1, name: 'Test Data' }],
    { jobReference: 'test-job' },
  ]

  // Mock GCP service account credentials
  const mockGcpCredentials = {
    type: 'service_account',
    project_id: 'test-project',
    private_key_id: 'test-key-id',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nTHIS IS A FAKE PRIVATE KEY\n-----END PRIVATE KEY-----\n',
    client_email: 'test-service-account@test-project.iam.gserviceaccount.com',
    client_id: '123456789',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/test-service-account%40test-project.iam.gserviceaccount.com',
  }

  const mockGcpCredentialsBase64 = Buffer.from(
    JSON.stringify(mockGcpCredentials)
  ).toString('base64')

  let mockQuery: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearMocks()
    vi.clearAllMocks()
    mockQuery = vi.fn().mockResolvedValue(mockQueryResult)
    const mockBigQueryInstance = {
      query: mockQuery,
    }
    vi.mocked(BigQuery).mockImplementation(
      () => mockBigQueryInstance as unknown as BigQuery
    )
  })

  describe('Successful queries', () => {
    test('Should execute default query when no custom query is provided', async () => {
      const dataset = 'test_dataset'
      const table = 'test_table'

      await bigQueryAction.onEvent({
        payload: generateTestPayload({
          fields: {
            bigquery_dataset: dataset,
            bigquery_table: table,
            query: undefined,
          },
          settings: {
            gcp_sa_b64: mockGcpCredentialsBase64,
          },
        }),
        onComplete,
        onError,
        helpers,
        attempt: 1,
      })

      expect(mockQuery).toHaveBeenCalledWith(
        `SELECT * FROM \`${dataset}.${table}\` LIMIT 10`
      )
      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          bigquery_result: JSON.stringify(mockQueryResult[0]),
        },
      })
    })

    test('Should execute custom query when provided', async () => {
      const customQuery =
        'SELECT id, name FROM `test_dataset.test_table` WHERE id = 1'

      await bigQueryAction.onEvent({
        payload: generateTestPayload({
          fields: {
            bigquery_dataset: 'test_dataset',
            bigquery_table: 'test_table',
            query: customQuery,
          },
          settings: {
            gcp_sa_b64: mockGcpCredentialsBase64,
          },
        }),
        onComplete,
        onError,
        helpers,
        attempt: 1,
      })

      expect(mockQuery).toHaveBeenCalledWith(customQuery)
      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          bigquery_result: JSON.stringify(mockQueryResult[0]),
        },
      })
    })

    test('Should execute default query when query is empty string', async () => {
      const dataset = 'test_dataset'
      const table = 'test_table'

      await bigQueryAction.onEvent({
        payload: generateTestPayload({
          fields: {
            bigquery_dataset: dataset,
            bigquery_table: table,
            query: '',
          },
          settings: {
            gcp_sa_b64: mockGcpCredentialsBase64,
          },
        }),
        onComplete,
        onError,
        helpers,
        attempt: 1,
      })

      expect(mockQuery).toHaveBeenCalledWith(
        `SELECT * FROM \`${dataset}.${table}\` LIMIT 10`
      )
      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          bigquery_result: JSON.stringify(mockQueryResult[0]),
        },
      })
    })
  })

  describe('Error handling', () => {
    test('Should throw error when GCP credentials are invalid', async () => {
      const invalidBase64 = 'invalid-base64'

      await expect(
        bigQueryAction.onEvent({
          payload: generateTestPayload({
            fields: {
              bigquery_dataset: 'test_dataset',
              bigquery_table: 'test_table',
            },
            settings: {
              gcp_sa_b64: invalidBase64,
            },
          }),
          onComplete,
          onError,
          helpers,
          attempt: 1,
        })
      ).rejects.toThrow()
    })

    test('Should handle BigQuery query errors', async () => {
      const queryError = new Error('Query failed')
      mockQuery.mockRejectedValueOnce(queryError)

      await expect(
        bigQueryAction.onEvent({
          payload: generateTestPayload({
            fields: {
              bigquery_dataset: 'test_dataset',
              bigquery_table: 'test_table',
            },
            settings: {
              gcp_sa_b64: mockGcpCredentialsBase64,
            },
          }),
          onComplete,
          onError,
          helpers,
          attempt: 1,
        })
      ).rejects.toThrow('Query failed')
    })
  })
})
