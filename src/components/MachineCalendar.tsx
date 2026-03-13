'use client'

import { ScheduledTask, formatMinutes } from '@/lib/scheduler'

type Props = {
  scheduled: ScheduledTask[]
}

function groupByDate(scheduled: ScheduledTask[]) {
  const map = new Map<string, { task: ScheduledTask; slotIdx: number }[]>()
  for (const task of scheduled) {
    for (let i = 0; i < task.slots.length; i++) {
      const { date } = task.slots[i]
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push({ task, slotIdx: i })
    }
  }
  return map
}

const DAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const dow = (d.getDay() + 6) % 7
  return `${DAY_LABELS[dow]} ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-teal-100 border-teal-300 text-teal-800',
]

export function MachineCalendar({ scheduled }: Props) {
  const grouped = groupByDate(scheduled)
  const dates = Array.from(grouped.keys()).sort()

  if (dates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Brak zaplanowanych zadań
      </div>
    )
  }

  // Color index per task id
  const taskColorMap = new Map<string, string>()
  scheduled.forEach((t, i) => {
    taskColorMap.set(t.id, COLORS[i % COLORS.length])
  })

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 min-w-0 pb-2">
        {dates.map(date => {
          const slots = grouped.get(date)!
          return (
            <div key={date} className="flex-shrink-0 w-36">
              <div className="text-xs font-medium text-gray-500 mb-1 text-center">
                {formatDate(date)}
              </div>
              <div className="space-y-1">
                {slots.map(({ task, slotIdx }) => {
                  const slot = task.slots[slotIdx]
                  const isActive = task.position === 0
                  const durationMin = slot.end_min - slot.start_min
                  const color = isActive
                    ? 'bg-blue-500 border-blue-600 text-white'
                    : taskColorMap.get(task.id) ?? COLORS[0]
                  return (
                    <div
                      key={`${task.id}-${slotIdx}`}
                      className={`rounded border px-2 py-1 text-xs ${color}`}
                      title={task.title}
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="opacity-75">
                        {formatMinutes(slot.start_min)}&ndash;{formatMinutes(slot.end_min)}
                        {' '}({durationMin}min)
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
