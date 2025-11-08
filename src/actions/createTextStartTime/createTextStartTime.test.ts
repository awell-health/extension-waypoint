import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { TestHelpers } from '@awell-health/extensions-core'
import { createTextStartTime as actionInterface } from './createTextStartTime'
import { generateTestPayload } from '../../test-helpers'

describe('Create Next Workdate Action', () => {
  const {
    extensionAction: createNextWorkdateAction,
    onComplete,
    onError,
    helpers,
    clearMocks,
  } = TestHelpers.fromAction(actionInterface)

  beforeEach(() => {
    clearMocks()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Before 10am Central on a weekday', () => {
    test('Should return today at 11AM when it is 9am Central on Monday', async () => {
      // Monday, November 10, 2025, 9:00 AM Central (15:00 UTC)
      const testDate = new Date('2025-11-10T15:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/), // ISO datetime
          next_workdate_formatted: '11/10/2025 11AM',
        },
      })
    })

    test('Should return today at 11AM when it is 9:59am Central on Tuesday', async () => {
      // Tuesday, November 11, 2025, 9:59 AM Central (15:59 UTC)
      const testDate = new Date('2025-11-11T15:59:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '11/11/2025 11AM',
        },
      })
    })

    test('Should return today at 11AM when it is 8am Central on Friday', async () => {
      // Friday, November 14, 2025, 8:00 AM Central (14:00 UTC)
      const testDate = new Date('2025-11-14T14:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '11/14/2025 11AM',
        },
      })
    })
  })

  describe('After 10am Central on a weekday', () => {
    test('Should return next day at 11AM when it is 10am Central on Monday', async () => {
      // Monday, November 10, 2025, 10:00 AM Central (16:00 UTC)
      const testDate = new Date('2025-11-10T16:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '11/11/2025 11AM', // Tuesday
        },
      })
    })

    test('Should return next day at 11AM when it is 3pm Central on Wednesday', async () => {
      // Wednesday, November 12, 2025, 3:00 PM Central (21:00 UTC)
      const testDate = new Date('2025-11-12T21:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '11/13/2025 11AM', // Thursday
        },
      })
    })

    test('Should return next Monday at 11AM when it is 10am Central on Friday', async () => {
      // Friday, November 14, 2025, 10:00 AM Central (16:00 UTC)
      const testDate = new Date('2025-11-14T16:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '11/17/2025 11AM', // Monday
        },
      })
    })
  })

  describe('Weekend scenarios', () => {
    test('Should return next Monday at 11AM when it is 9am Central on Saturday', async () => {
      // Saturday, November 15, 2025, 9:00 AM Central (15:00 UTC)
      const testDate = new Date('2025-11-15T15:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '11/17/2025 11AM', // Monday
        },
      })
    })

    test('Should return next Monday at 11AM when it is 9am Central on Sunday', async () => {
      // Sunday, November 16, 2025, 9:00 AM Central (15:00 UTC)
      const testDate = new Date('2025-11-16T15:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '11/17/2025 11AM', // Monday
        },
      })
    })

    test('Should return next Monday at 11AM when it is 11am Central on Sunday', async () => {
      // Sunday, November 16, 2025, 11:00 AM Central (17:00 UTC)
      const testDate = new Date('2025-11-16T17:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '11/17/2025 11AM', // Monday
        },
      })
    })
  })

  describe('Edge cases and date formatting', () => {
    test('Should format single-digit months and days correctly', async () => {
      // Monday, January 6, 2025, 9:00 AM Central (15:00 UTC)
      const testDate = new Date('2025-01-06T15:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '01/06/2025 11AM',
        },
      })
    })

    test('Should handle year-end transitions correctly', async () => {
      // Friday, December 31, 2025, 10:00 AM Central (16:00 UTC)
      const testDate = new Date('2025-12-31T16:00:00.000Z')
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      // Should be Monday, January 5, 2026 (skipping weekend)
      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '01/01/2026 11AM',
        },
      })
    })

    test('Should handle DST transitions correctly', async () => {
      // Sunday, March 9, 2025, 3:00 AM Central (has just sprung forward) = 9:00 UTC
      const testDate = new Date('2025-03-09T15:00:00.000Z') // 9am Central during DST
      vi.useFakeTimers()
      vi.setSystemTime(testDate)

      await createNextWorkdateAction.onEvent({
        payload: generateTestPayload({
          fields: {},
          settings: {},
        }),
        onComplete,
        onError,
        helpers,
      })

      // Sunday is a weekend, so should return Monday
      expect(onComplete).toHaveBeenCalledWith({
        data_points: {
          next_workdate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          next_workdate_formatted: '03/10/2025 11AM', // Monday
        },
      })
    })
  })
})
