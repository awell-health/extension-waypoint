import { type Setting } from '@awell-health/extensions-core'
import { z } from 'zod'
export const settings = {
  gcp_sa_b64: {
    key: 'gcp_sa_b64',
    label: 'GCP Service Account Base64',
    description: 'The base64 encoded GCP Service Account key',
    required: true,
    obfuscated: true,
  },
  textemall_consumer_key: {
    key: 'textemall_consumer_key',
    label: 'Text-em-all OAuth Consumer Key',
    description: 'The OAuth 1.0 consumer key for Text-em-all',
    required: false,
    obfuscated: false,
  },
  textemall_consumer_secret: {
    key: 'textemall_consumer_secret',
    label: 'Text-em-all OAuth Consumer Secret',
    description: 'The OAuth 1.0 consumer secret for Text-em-all',
    required: false,
    obfuscated: true,
  },
  textemall_oauth_token: {
    key: 'textemall_oauth_token',
    label: 'Text-em-all OAuth Token',
    description: 'The OAuth 1.0 token for Text-em-all',
    required: false,
    obfuscated: false,
  },
  textemall_token_secret: {
    key: 'textemall_token_secret',
    label: 'Text-em-all Token Secret',
    description: 'The OAuth 1.0 token secret for Text-em-all',
    required: false,
    obfuscated: true,
  },
  textemall_base_url: {
    key: 'textemall_base_url',
    label: 'Text-em-all Base URL',
    description: 'The base URL for Text-em-all API',
    required: false,
    obfuscated: false,
  },
} satisfies Record<string, Setting>

export const SettingsSchema = z.object({
  gcp_sa_b64: z.string().describe('The base64 encoded GCP Service Account key'),
  textemall_consumer_key: z
    .string()
    .optional()
    .describe('The OAuth 1.0 consumer key for Text-em-all'),
  textemall_consumer_secret: z
    .string()
    .optional()
    .describe('The OAuth 1.0 consumer secret for Text-em-all'),
  textemall_oauth_token: z
    .string()
    .optional()
    .describe('The OAuth 1.0 token for Text-em-all'),
  textemall_token_secret: z
    .string()
    .optional()
    .describe('The OAuth 1.0 token secret for Text-em-all'),
  textemall_base_url: z
    .string()
    .optional()
    .describe('The base URL for Text-em-all API'),
})
