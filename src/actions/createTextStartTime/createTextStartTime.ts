import { Category, type Action } from '@awell-health/extensions-core'
import { type settings } from '../../settings'
import { z } from 'zod'
import { fields, FieldsSchema, dataPoints } from './config'

const PayloadSchema = z.object({
  fields: FieldsSchema,
})

/**
 * Checks if a date is a weekday (Monday-Friday)
 */
function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day >= 1 && day <= 5 // 1 = Monday, 5 = Friday
}

/**
 * Gets the next weekday from a given date
 */
function getNextWeekday(date: Date): Date {
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)

  while (!isWeekday(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1)
  }

  return nextDay
}

/**
 * Converts a Date to Central Time (America/Chicago)
 */
function getCentralTime(date: Date): Date {
  // Convert to Central Time using Intl API
  const centralTimeString = date.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
  })
  return new Date(centralTimeString)
}

/**
 * Formats a date as "mm/dd/yyyy 11AM" for Text-em-all API
 */
export function formatDateForTextEmAll(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()

  return `${month}/${day}/${year} 11AM`
}

/**
 * Determines the appropriate workdate based on current Central Time
 * Returns a Date object set to 11AM on the appropriate workday
 */
export function getNextWorkdate(): Date {
  const now = new Date()
  const centralNow = getCentralTime(now)
  const currentHour = centralNow.getHours()

  let targetDate: Date

  // Check if it's before 10am Central AND today is a workday
  if (currentHour < 10 && isWeekday(centralNow)) {
    // Use today's date
    targetDate = new Date(centralNow)
  } else {
    // Use the next workday
    targetDate = getNextWeekday(centralNow)
  }

  // Set time to 11AM
  targetDate.setHours(11, 0, 0, 0)

  return targetDate
}

export const createTextStartTime: Action<
  typeof fields,
  typeof settings,
  keyof typeof dataPoints
> = {
  key: 'createTextStartTime',
  category: Category.WORKFLOW,
  title: 'Text-em-all Start Time',
  description:
    'Generates a text start time. Returns today at 11AM if before 10am Central on a workday, otherwise returns the next workday at 11AM.',
  fields,
  previewable: true,
  dataPoints,
  onEvent: async ({ payload, onComplete }) => {
    PayloadSchema.parse(payload)

    const nextWorkdateDate = getNextWorkdate()

    await onComplete({
      data_points: {
        next_workdate: nextWorkdateDate.toISOString(),
        next_workdate_formatted: formatDateForTextEmAll(nextWorkdateDate),
      },
    })
  },
}

