/** Calendar-date helpers shared by the Garden core and the UI. Dates are `YYYY-MM-DD`, read as UTC so the device's time zone never shifts them. */

/** A device-local calendar date, formatted `YYYY-MM-DD`. */
export type LocalDate = string

/** The UTC midnight of `date`. Only meaningful for a real calendar date (see `isCalendarDate`). */
export function utcDate(date: LocalDate): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1))
}

/** Whether `date` is a real `YYYY-MM-DD` calendar date. */
export function isCalendarDate(date: LocalDate): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && utcDate(date).toISOString().slice(0, 10) === date
}

/** School Days are Monday to Friday by the device-local calendar date. */
export function isSchoolDay(date: LocalDate): boolean {
  const weekday = utcDate(date).getUTCDay()
  return weekday >= 1 && weekday <= 5
}

/** The calendar day before `date`. */
export function dayBefore(date: LocalDate): LocalDate {
  const day = utcDate(date)
  day.setUTCDate(day.getUTCDate() - 1)
  return day.toISOString().slice(0, 10)
}
