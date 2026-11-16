import type { LocalDate } from '../garden/index.ts'

/** The device-local calendar date, as the Garden core expects it. */
export function todayLocal(now: Date = new Date()): LocalDate {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
