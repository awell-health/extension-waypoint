import { Category, type Action } from '@awell-health/extensions-core'
import { BigQuery } from '@google-cloud/bigquery'
import { dataPoints, FieldsSchema, fields } from './config'
import { type settings, SettingsSchema } from '../settings'
import { z } from 'zod'
import { isEmpty, isNil } from 'lodash'

const PayloadSchema = z.object({
  fields: FieldsSchema,
  settings: SettingsSchema,
})

export const bigQuery: Action<
  typeof fields,
  typeof settings,
  keyof typeof dataPoints
> = {
  key: 'bigquery',
  category: Category.DATA,
  title: 'BigQuery',
  description: 'This action allows you to query data from BigQuery.',
  fields,
  previewable: true,
  dataPoints,
  onEvent: async ({ payload, onComplete }) => {
    const { fields, settings } = PayloadSchema.parse(payload)

    const query =
      isNil(fields.query) || isEmpty(fields.query)
        ? `SELECT * FROM \`${fields.bigquery_dataset}.${fields.bigquery_table}\` LIMIT 10`
        : fields.query
    const bigquery = new BigQuery({
      credentials: JSON.parse(
        Buffer.from(settings.gcp_sa_b64, 'base64').toString()
      ),
    })
    const [rows] = await bigquery.query(query)
    await onComplete({
      data_points: {
        bigquery_result: JSON.stringify(rows),
      },
    })
  },
}
