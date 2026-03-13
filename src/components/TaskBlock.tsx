'use client'

import { ScheduledTask, formatMinutes } from '@/lib/scheduler'

export const PIXELS_PER_HOUR = 60

function formatTimeRange(startMin: number, endMin: number): string {
  return `${formatMinutes(startMin)}–${formatMinutes(endMin)}`
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h}h`
  return `${m}min`
}

type Props = {
  task: ScheduledTask
  isActive: boolean
  dayStart: number        // minutes from midnight for top of visible grid
  currentDate: string     // YYYY-MM-DD of the column being rendered
  colorScheme: 'blue' | 'green'
  colorIndex: number      // 0-based index in the queue (for alternating colors)
  onClick: (task: ScheduledTask, e: React.MouseEvent) => void
  onContextMenu: (task: ScheduledTask, e: React.MouseEvent) => void
  style?: React.CSSProperties
}

export function TaskBlock({
  task,
  isActive,
  dayStart,
  currentDate,
  colorScheme,
  colorIndex,
  onClick,
  onContextMenu,
  style,
}: Props) {
  const slot = task.slots.find(s => s.date === currentDate)
  if (!slot) return null

  const topPx = Math.max(0, ((slot.start_min - dayStart) / 60) * PIXELS_PER_HOUR)
  const durationMin = slot.end_min - slot.start_min
  const heightPx = Math.max(20, (durationMin / 60) * PIXELS_PER_HOUR)

  const isMultiDay = task.slots.length > 1
  const isLastSlot = task.slots[task.slots.length - 1].date === currentDate
  const isFirstSlot = task.slots[0].date === currentDate

  // Active task: solid brand color
  // Queued tasks: alternating light/dark ribbon by colorIndex parity
  const isEven = colorIndex % 2 === 0
  const blockClass = isActive
    ? colorScheme === 'blue'
      ? 'bg-blue-600 text-white shadow-md'
      : 'bg-green-600 text-white shadow-md'
    : colorScheme === 'blue'
      ? isEven
        ? 'bg-blue-50 text-slate-800 border-l-4 border-blue-300 hover:shadow-md'
        : 'bg-blue-100 text-slate-800 border-l-4 border-blue-500 hover:shadow-md'
      : isEven
        ? 'bg-green-50 text-slate-800 border-l-4 border-green-300 hover:shadow-md'
        : 'bg-green-100 text-slate-800 border-l-4 border-green-500 hover:shadow-md'

  const secondaryTextClass = isActive
    ? colorScheme === 'blue' ? 'text-blue-100' : 'text-green-100'
    : 'text-slate-500'

  const tertiaryTextClass = isActive
    ? colorScheme === 'blue' ? 'text-blue-200' : 'text-green-200'
    : 'text-slate-400'

  const badgeClass = isActive
    ? colorScheme === 'blue' ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
    : 'bg-slate-200 text-slate-600'

  return (
    <div
      className={`absolute left-1 right-1 rounded overflow-hidden cursor-pointer group ${blockClass} transition-shadow`}
      style={{ top: topPx, height: heightPx, ...style }}
      onClick={e => onClick(task, e)}
      onContextMenu={e => { e.preventDefault(); onContextMenu(task, e) }}
    >
      <div className="px-2 py-1 h-full flex flex-col justify-between overflow-hidden">
        <div>
          <div className={`font-medium text-xs truncate leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
            {task.title}
          </div>
          {heightPx >= 32 && (
            <div className={`text-xs leading-tight mt-0.5 ${secondaryTextClass}`}>
              {formatTimeRange(slot.start_min, slot.end_min)}
            </div>
          )}
        </div>

        {heightPx >= 44 && (
          <div className="flex items-end justify-between">
            <span className={`text-xs ${tertiaryTextClass}`}>
              {formatDuration(durationMin)}
            </span>
            {isActive && (
              <span className={`text-xs px-1 rounded font-medium ${badgeClass}`}>
                W toku
              </span>
            )}
          </div>
        )}
      </div>

      {/* Multi-day badges */}
      {isMultiDay && !isLastSlot && (
        <div className={`absolute bottom-0 right-1 text-xs ${tertiaryTextClass}`}>
          → jutro
        </div>
      )}
      {isMultiDay && !isFirstSlot && (
        <div className={`absolute top-0 right-1 text-xs ${tertiaryTextClass}`}>
          ← wczoraj
        </div>
      )}

      {/* Menu icon on hover */}
      <button
        className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xs rounded p-0.5
          ${isActive ? 'hover:bg-white/20' : 'hover:bg-slate-300'}
          transition-opacity`}
        onClick={e => { e.stopPropagation(); onContextMenu(task, e) }}
      >
        ⋮
      </button>
    </div>
  )
}
