import {
  FieldType,
  type Field,
  type DataPointDefinition,
} from '@awell-health/extensions-core'
import { z } from 'zod'

export const fields = {
  textMessage: {
    id: 'textMessage',
    label: 'Text Message',
    description: 'The text message content to send',
    type: FieldType.HTML,
    required: true,
  },
  textNumberID: {
    id: 'textNumberID',
    label: 'Text Number ID',
    description: 'The Text-em-all number ID to send from',
    type: FieldType.STRING,
    required: true,
  },
  patientTextNumber: {
    id: 'patientTextNumber',
    label: 'Patient Text Number',
    description: "The patient's phone number to send the text to",
    type: FieldType.STRING,
    required: true,
  },
} satisfies Record<string, Field>

export const FieldsSchema = z.object({
  textMessage: z.string().describe('The text message content to send'),
  textNumberID: z.string().describe('The Text-em-all number ID to send from'),
  patientTextNumber: z.string().describe("The patient's phone number"),
})

export const dataPoints = {
  broadcast_id: {
    key: 'broadcast_id',
    valueType: 'string',
  },
  start_date: {
    key: 'start_date',
    valueType: 'date',
  },
  start_date_formatted: {
    key: 'start_date_formatted',
    valueType: 'string',
  },
} satisfies Record<string, DataPointDefinition>

