import type { DataPointDefinition, Field } from '@awell-health/extensions-core'
import { FieldType } from '@awell-health/extensions-core'
import { z } from 'zod'

export const fields = {
  bigquery_dataset: {
    id: 'bigquery_dataset',
    label: 'BigQuery Dataset',
    description: 'The BigQuery dataset to write to',
    type: FieldType.STRING,
    required: true,
  },
  bigquery_table: {
    id: 'bigquery_table',
    label: 'BigQuery Table',
    description: 'The BigQuery table to write to',
    type: FieldType.STRING,
    required: true,
  },
  query: {
    id: 'query',
    label: 'Query',
    description: 'The query to execute. Optional',
    type: FieldType.STRING,
    required: false,
  },
} satisfies Record<string, Field>

export const FieldsSchema = z.object({
  bigquery_dataset: z.string().describe('The BigQuery dataset to write to'),
  bigquery_table: z.string().describe('The BigQuery table to write to'),
  query: z.string().describe('The query to execute. Optional').optional(),
})

export const dataPoints = {
  bigquery_result: {
    key: 'bigquery_result',
    valueType: 'json',
  },
} satisfies Record<string, DataPointDefinition>
