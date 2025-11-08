import { Category, type Action } from '@awell-health/extensions-core'
import { type settings, SettingsSchema } from '../../settings'
import { z } from 'zod'
import { generateOAuthHeader } from '../../lib/oauth'
import {
  getNextWorkdate,
  formatDateForTextEmAll,
} from '../createTextStartTime'
import { fields, FieldsSchema, dataPoints } from './config'

// Extend settings schema to require Text-em-all fields for this action
const SendTextEmAllSettingsSchema = SettingsSchema.extend({
  textemall_consumer_key: z
    .string()
    .describe('The OAuth 1.0 consumer key for Text-em-all'),
  textemall_consumer_secret: z
    .string()
    .describe('The OAuth 1.0 consumer secret for Text-em-all'),
  textemall_oauth_token: z
    .string()
    .describe('The OAuth 1.0 token for Text-em-all'),
  textemall_token_secret: z
    .string()
    .describe('The OAuth 1.0 token secret for Text-em-all'),
  textemall_base_url: z.string().describe('The base URL for Text-em-all API'),
})

const PayloadSchema = z.object({
  fields: FieldsSchema,
  settings: SendTextEmAllSettingsSchema,
  patient: z.object({
    id: z.string(),
    profile: z
      .object({
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        identifier: z
          .array(
            z.object({
              system: z.string().optional(),
              value: z.string().optional(),
            })
          )
          .optional(),
      })
      .optional(),
  }),
})

interface TextEmAllResponse {
  BroadcastID?: string
  [key: string]: any
}

export const sendTextEmAllText: Action<
  typeof fields,
  typeof settings,
  keyof typeof dataPoints
> = {
  key: 'sendTextEmAllText',
  category: Category.COMMUNICATION,
  title: 'Send Text-em-all Text',
  description:
    'Sends an SMS via Text-em-all. Automatically schedules for 11AM on the next workday based on Central time.',
  fields,
  previewable: false,
  dataPoints,
  onEvent: async ({ payload, onComplete, onError, helpers: { log } }) => {
    try {
      const { fields, settings } = PayloadSchema.parse(payload)
      const { patient } = payload

      // Get the next workdate as a Date object
      const startDateTime = getNextWorkdate()
      const startDateFormatted = formatDateForTextEmAll(startDateTime)

      const accountIdIdentifier = patient.profile?.identifier?.find(
        (i) => i.system === 'https://www.resource-corp.com/'
      )
      const accountIdIdentifierValue = accountIdIdentifier?.value ?? patient.id

      // Prepare the broadcast name
      const broadcastName = `Awell Eligibility Form SMS ${accountIdIdentifierValue}`

      // Prepare the request body
      const requestBody = {
        BroadcastName: broadcastName,
        BroadcastType: 'SMS',
        CheckCallingWindow: 'false',
        StartDate: startDateFormatted, // Use formatted string for Text-em-all API
        TextMessage: fields.textMessage,
        TextNumberID: fields.textNumberID,
        Contacts: [
          {
            FirstName: patient.profile?.first_name ?? '',
            LastName: patient.profile?.last_name ?? '',
            PrimaryPhone: fields.patientTextNumber,
            Notes: 'Eligibility form from Awell',
            IntegrationData: 'Extra field for information',
          },
        ],
      }

      // Generate OAuth 1.0 Authorization header
      const oauthHeader = generateOAuthHeader(
        'POST',
        settings.textemall_base_url,
        settings.textemall_consumer_key,
        settings.textemall_consumer_secret,
        settings.textemall_oauth_token,
        settings.textemall_token_secret
      )
      log(
        {
          requestBody,
          authorizationHeader: oauthHeader.substring(0, 50) + '...',
          startDateFormatted,
        },
        'Sending Text-em-all API Request'
      )

      // Make the API call
      const response = await fetch(settings.textemall_base_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: oauthHeader,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        const statusText = response.statusText ?? 'Unknown Error'
        log(
          { status: response.status, statusText, errorText },
          'Text-em-all API Error'
        )
        throw new Error(
          `Text-em-all API error: ${response.status} ${statusText} - ${errorText}`
        )
      }

      const responseData: TextEmAllResponse = await response.json()
      log({ responseData, status: response.status }, 'Text-em-all API Response')

      await onComplete({
        data_points: {
          broadcast_id: responseData.BroadcastID ?? 'unknown',
          start_date: startDateTime.toISOString(),
          start_date_formatted: startDateFormatted,
        },
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred'
      await onError({
        events: [
          {
            date: new Date().toISOString(),
            text: { en: errorMessage },
            error: {
              category: 'SERVER_ERROR',
              message: errorMessage,
            },
          },
        ],
      })
    }
  },
}

