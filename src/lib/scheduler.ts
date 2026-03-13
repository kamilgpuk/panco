import type { ScheduleDefault, ScheduleOverride, Task } from './supabase'

export type TimeSlot = {
  date: string       // YYYY-MM-DD
  start_min: number  // minutes from midnight
  end_min: number    // minutes from midnight
}

export type ScheduledTask = Task & {
  slots: TimeSlot[]
  computed_start: string  // ISO string of first slot start
  computed_end: string    // ISO string of last slot end
}

type DayHours = {
  start_min: number
  end_min: number
  is_working: boolean
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function dateToKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

function buildCalendar(
  defaults: ScheduleDefault[],
  overrides: ScheduleOverride[],
  fromDate: Date,
  days: number
): Map<string, DayHours> {
  const calendar = new Map<string, DayHours>()
  const overrideMap = new Map(overrides.map(o => [o.date, o]))

  for (let i = 0; i < days; i++) {
    const d = new Date(fromDate)
    d.setDate(d.getDate() + i)
    const key = dateToKey(d)
    const dow = (d.getDay() + 6) % 7 // convert Sun=0 to Mon=0

    const override = overrideMap.get(key)
    if (override) {
      calendar.set(key, {
        start_min: override.start_time ? timeToMin(override.start_time) : 0,
        end_min: override.end_time ? timeToMin(override.end_time) : 0,
        is_working: override.is_working,
      })
    } else {
      const def = defaults.find(d => d.day_of_week === dow)
      calendar.set(key, {
        start_min: def && def.is_working ? timeToMin(def.start_time) : 0,
        end_min: def && def.is_working ? timeToMin(def.end_time) : 0,
        is_working: def?.is_working ?? false,
      })
    }
  }

  return calendar
}

function slotToISO(date: string, min: number): string {
  const [y, mo, d] = date.split('-').map(Number)
  const h = Math.floor(min / 60)
  const m = min % 60
  return new Date(y, mo - 1, d, h, m).toISOString()
}

export function computeSchedule(
  tasks: Task[],
  defaults: ScheduleDefault[],
  overrides: ScheduleOverride[]
): ScheduledTask[] {
  if (tasks.length === 0) return []

  const sorted = [...tasks].sort((a, b) => a.position - b.position)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build calendar for enough days (tasks * 3 to handle non-working days)
  const calendar = buildCalendar(defaults, overrides, today, tasks.length * 5 + 30)

  const days = Array.from(calendar.entries()).sort(([a], [b]) => a.localeCompare(b))

  // Cursor: [dayIndex, minuteWithinDay]
  let dayIdx = 0
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()

  // Advance to first working day
  while (dayIdx < days.length && !days[dayIdx][1].is_working) dayIdx++
  if (dayIdx >= days.length) return sorted.map(t => ({ ...t, slots: [], computed_start: '', computed_end: '' }))

  // Start cursor at max(now, start of working hours) on first working day
  let cursorMin = Math.max(days[dayIdx][1].start_min, nowMin)
  if (cursorMin >= days[dayIdx][1].end_min) {
    dayIdx++
    while (dayIdx < days.length && !days[dayIdx][1].is_working) dayIdx++
    cursorMin = days[dayIdx]?.[1].start_min ?? 0
  }

  const result: ScheduledTask[] = []

  for (const task of sorted) {
    let remaining = task.duration_min
    const slots: TimeSlot[] = []

    while (remaining > 0 && dayIdx < days.length) {
      const [date, hours] = days[dayIdx]
      if (!hours.is_working) { dayIdx++; cursorMin = days[dayIdx]?.[1].start_min ?? 0; continue }

      const available = hours.end_min - cursorMin
      if (available <= 0) {
        dayIdx++
        while (dayIdx < days.length && !days[dayIdx][1].is_working) dayIdx++
        cursorMin = days[dayIdx]?.[1].start_min ?? 0
        continue
      }

      const take = Math.min(remaining, available)
      slots.push({ date, start_min: cursorMin, end_min: cursorMin + take })
      cursorMin += take
      remaining -= take

      if (cursorMin >= hours.end_min) {
        dayIdx++
        while (dayIdx < days.length && !days[dayIdx][1].is_working) dayIdx++
        cursorMin = days[dayIdx]?.[1].start_min ?? 0
      }
    }

    result.push({
      ...task,
      slots,
      computed_start: slots[0] ? slotToISO(slots[0].date, slots[0].start_min) : '',
      computed_end: slots[slots.length - 1] ? slotToISO(slots[slots.length - 1].date, slots[slots.length - 1].end_min) : '',
    })
  }

  return result
}

export function getWorkingHours(
  defaults: ScheduleDefault[],
  overrides: ScheduleOverride[],
  date: string
): { start_min: number; end_min: number; is_working: boolean } {
  const override = overrides.find(o => o.date === date)
  if (override) {
    return {
      start_min: override.start_time ? timeToMin(override.start_time) : 0,
      end_min: override.end_time ? timeToMin(override.end_time) : 0,
      is_working: override.is_working,
    }
  }
  const d = new Date(date + 'T00:00:00')
  const dow = (d.getDay() + 6) % 7
  const def = defaults.find(d => d.day_of_week === dow)
  return {
    start_min: def && def.is_working ? timeToMin(def.start_time) : 0,
    end_min: def && def.is_working ? timeToMin(def.end_time) : 0,
    is_working: def?.is_working ?? false,
  }
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
