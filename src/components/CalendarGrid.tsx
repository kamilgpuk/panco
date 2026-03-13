'use client'

import { useState } from 'react'
import { ScheduledTask, getWorkingHours } from '@/lib/scheduler'
import { ScheduleDefault, ScheduleOverride } from '@/lib/supabase'
import { TimeAxis } from './TimeAxis'
import { MachineColumn } from './MachineColumn'
import { WorkingHoursEditor } from './WorkingHoursEditor'
import { PIXELS_PER_HOUR } from './TaskBlock'

type Machine = {
  id: string
  name: string
}

type DragData = {
  taskId: string
  machineId: string
  originalPosition: number
}

const DAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const COLOR_SCHEMES: ('blue' | 'green')[] = ['blue', 'green']

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const dow = (d.getDay() + 6) % 7
  return `${DAY_LABELS[dow]} ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

function minToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

type Props = {
  machines: Machine[]
  scheduledByMachine: Map<string, ScheduledTask[]>
  machineDefaults: Map<string, ScheduleDefault[]>
  machineOverrides: Map<string, ScheduleOverride[]>
  dates: string[]
  onTaskClick: (task: ScheduledTask, e: React.MouseEvent) => void
  onTaskContextMenu: (task: ScheduledTask, e: React.MouseEvent) => void
  onAddTask: (machineId: string) => void
  onDrop: (dragData: DragData, targetMachineId: string, targetPosition: number) => void
  onResize: (machineId: string, taskId: string, newDurationMin: number) => void
  onError: (msg: string) => void
  onRefreshMachine: (machineId: string) => void
}

function computeVisibleRange(
  scheduledByMachine: Map<string, ScheduledTask[]>,
  machineDefaults: Map<string, ScheduleDefault[]>,
  machineOverrides: Map<string, ScheduleOverride[]>,
  dates: string[]
): { startHour: number; endHour: number } {
  let minHour = 8
  let maxHour = 16

  machineDefaults.forEach((defaults, machineId) => {
    const overrides = machineOverrides.get(machineId) ?? []
    dates.forEach(date => {
      const wh = getWorkingHours(defaults, overrides, date)
      if (wh.is_working) {
        const startH = Math.floor(wh.start_min / 60)
        const endH = Math.ceil(wh.end_min / 60)
        if (startH < minHour) minHour = startH
        if (endH > maxHour) maxHour = endH
      }
    })
  })

  scheduledByMachine.forEach(tasks => {
    tasks.forEach(task => {
      task.slots.forEach(slot => {
        if (dates.includes(slot.date)) {
          const startH = Math.floor(slot.start_min / 60)
          const endH = Math.ceil(slot.end_min / 60)
          if (startH < minHour) minHour = startH
          if (endH > maxHour) maxHour = endH
        }
      })
    })
  })

  return {
    startHour: Math.max(0, minHour - 1),
    endHour: Math.min(24, maxHour + 1),
  }
}

export function CalendarGrid({
  machines,
  scheduledByMachine,
  machineDefaults,
  machineOverrides,
  dates,
  onTaskClick,
  onTaskContextMenu,
  onAddTask,
  onDrop,
  onResize,
  onError,
  onRefreshMachine,
}: Props) {
  const { startHour, endHour } = computeVisibleRange(scheduledByMachine, machineDefaults, machineOverrides, dates)
  const totalHours = endHour - startHour
  const multiDay = dates.length > 1

  const [editingHours, setEditingHours] = useState<{ machineId: string; date: string } | null>(null)

  const editingMachine = editingHours ? machines.find(m => m.id === editingHours.machineId) : null
  const editingDefaults = editingHours ? (machineDefaults.get(editingHours.machineId) ?? []) : []
  const editingOverrides = editingHours ? (machineOverrides.get(editingHours.machineId) ?? []) : []
  const editingWH = editingHours ? getWorkingHours(editingDefaults, editingOverrides, editingHours.date) : null
  const editingOverrideRecord = editingHours
    ? editingOverrides.find(o => o.date === editingHours.date) ?? null
    : null

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="flex flex-1" style={{ minHeight: totalHours * PIXELS_PER_HOUR + (multiDay ? 64 : 40) }}>

        {/* Time axis */}
        <div className="flex-shrink-0" style={{ paddingTop: multiDay ? 64 : 40 }}>
          <TimeAxis startHour={startHour} endHour={endHour} />
        </div>

        {/* Machine groups */}
        {machines.map((machine, mIdx) => {
          const tasks = scheduledByMachine.get(machine.id) ?? []
          const defaults = machineDefaults.get(machine.id) ?? []
          const overrides = machineOverrides.get(machine.id) ?? []
          const colorScheme = COLOR_SCHEMES[mIdx] ?? 'blue'

          return (
            <div key={machine.id} className={`flex flex-col flex-1 min-w-0 ${mIdx > 0 ? 'border-l-2 border-gray-300' : ''}`}>
              {/* Machine name header */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b font-semibold text-sm text-gray-700 flex-shrink-0">
                <span>{machine.name}</span>
                <div className="flex items-center gap-2">
                  {/* In single-day view, show working hours + edit button in the machine header */}
                  {!multiDay && (() => {
                    const wh = getWorkingHours(defaults, overrides, dates[0])
                    const hasOverride = overrides.some(o => o.date === dates[0])
                    return (
                      <button
                        onClick={() => setEditingHours({ machineId: machine.id, date: dates[0] })}
                        className="text-xs text-gray-500 hover:text-blue-600 font-normal flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                        title="Edytuj godziny pracy"
                      >
                        {wh.is_working
                          ? <>{minToTime(wh.start_min)}–{minToTime(wh.end_min)}</>
                          : 'wolny'
                        }
                        {hasOverride && <span className="text-orange-400">*</span>}
                        <span className="text-gray-400">✎</span>
                      </button>
                    )
                  })()}
                  <button
                    onClick={() => onAddTask(machine.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded hover:bg-blue-50"
                  >
                    + Dodaj
                  </button>
                </div>
              </div>

              {/* Date sub-columns */}
              <div className="flex flex-1">
                {dates.map((date, dIdx) => {
                  const wh = getWorkingHours(defaults, overrides, date)
                  const hasOverride = overrides.some(o => o.date === date)
                  return (
                    <div key={date} className={`flex flex-col flex-1 min-w-0 ${dIdx > 0 ? 'border-l' : ''}`}>
                      {/* Date label with edit button (multi-day view) */}
                      {multiDay && (
                        <div className="flex items-center justify-between px-2 text-xs text-gray-500 py-1.5 border-b bg-white flex-shrink-0 font-medium">
                          <span>{formatDayLabel(date)}</span>
                          <button
                            onClick={() => setEditingHours({ machineId: machine.id, date })}
                            className="flex items-center gap-0.5 text-gray-400 hover:text-blue-600 px-1 py-0.5 rounded hover:bg-blue-50 transition-colors"
                            title="Edytuj godziny pracy"
                          >
                            {wh.is_working
                              ? <span className="text-gray-400">{minToTime(wh.start_min)}–{minToTime(wh.end_min)}</span>
                              : <span className="text-gray-300">wolny</span>
                            }
                            {hasOverride && <span className="text-orange-400 ml-0.5">*</span>}
                            <span className="ml-1">✎</span>
                          </button>
                        </div>
                      )}
                      <MachineColumn
                        machineId={machine.id}
                        machineName={machine.name}
                        tasks={tasks}
                        currentDate={date}
                        dayStartHour={startHour}
                        dayEndHour={endHour}
                        showHeader={false}
                        colorScheme={colorScheme}
                        workingHours={wh}
                        onTaskClick={onTaskClick}
                        onTaskContextMenu={onTaskContextMenu}
                        onAddTask={() => onAddTask(machine.id)}
                        onDrop={onDrop}
                        onResize={(taskId, newDuration) => onResize(machine.id, taskId, newDuration)}
                        onError={onError}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Working hours editor modal */}
      {editingHours && editingMachine && editingWH && (
        <WorkingHoursEditor
          machineId={editingHours.machineId}
          machineName={editingMachine.name}
          date={editingHours.date}
          initialHours={editingWH}
          existingOverrideId={editingOverrideRecord?.id ?? null}
          onClose={() => setEditingHours(null)}
          onSaved={() => onRefreshMachine(editingHours.machineId)}
          onError={onError}
        />
      )}
    </div>
  )
}
