import { database } from '@/lib/database'
import { subYears, addYears, formatISO } from 'date-fns'
import {
  Calendar,
  CalendarRepository,
  getCalendarsBetween,
} from '@phoobynet/alpaca-services'

let isReady = false

const isEmpty = async () => {
  if (!isReady) {
    const c = await database.calendars.count()
    if (c === 0) {
      const start = subYears(new Date(), 1)
      const end = addYears(new Date(), 1)
      const calendars = await getCalendarsBetween(start, end, true)
      await database.calendars.bulkPut(
        calendars.map(c => {
          return {
            id: formatISO(c.date, { representation: 'date' }),
            ...c,
          }
        }),
      )
    }
    isReady = true
  }
}

export const calendarRepository: CalendarRepository = {
  async find(date: Date): Promise<Calendar | undefined> {
    await isEmpty()
    return database.calendars
      .where('id')
      .equals(formatISO(date, { representation: 'date' }))
      .first()
  },
  async findAll(): Promise<Calendar[]> {
    await isEmpty()
    return database.calendars.toArray()
  },
  async findBetween(startDate: Date, endDate: Date): Promise<Calendar[]> {
    await isEmpty()

    return database.calendars
      .where('id')
      .between(
        formatISO(startDate, { representation: 'date' }),
        formatISO(endDate, { representation: 'date' }),
        true,
        true,
      )
      .toArray()
  },
}
