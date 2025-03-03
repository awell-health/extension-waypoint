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
} satisfies Record<string, Setting>

export const SettingsSchema = z.object({
  gcp_sa_b64: z.string().describe('The base64 encoded GCP Service Account key'),
})
