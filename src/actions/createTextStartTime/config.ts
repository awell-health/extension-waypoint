import type { DataPointDefinition } from '@awell-health/extensions-core'
import { z } from 'zod'

// No fields needed - this action uses current time only
export const fields = {}

export const FieldsSchema = z.object({})

export const dataPoints = {
  next_workdate: {
    key: 'next_workdate',
    valueType: 'date',
  },
  next_workdate_formatted: {
    key: 'next_workdate_formatted',
    valueType: 'string',
  },
} as const satisfies Record<string, DataPointDefinition>

