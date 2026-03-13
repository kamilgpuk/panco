'use client'

import { useMachineData } from '@/hooks/useMachineData'
import { TaskCard } from './TaskCard'
import { AddTaskForm } from './AddTaskForm'
import { MachineCalendar } from './MachineCalendar'
import type { ScheduledTask } from '@/lib/scheduler'

type Props = {
  machineId: string
  machineName: string
}

export function MachinePanel({ machineId, machineName }: Props) {
  const { tasks, scheduled, loading, refresh } = useMachineData(machineId)

  async function handleAdd(title: string, durationMin: number) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machine_id: machineId, title, duration_min: durationMin }),
    })
    refresh()
  }

  async function handleRemove(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    refresh()
  }

  async function handleFinishEarly(id: string, actualMin: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_min: actualMin }),
    })
    // Mark done = delete from queue
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    refresh()
  }

  async function handleProlong(id: string, newMin: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_min: newMin }),
    })
    refresh()
  }

  async function handleSplit(id: string, firstMin: number) {
    await fetch('/api/tasks/split', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: id, first_duration_min: firstMin }),
    })
    refresh()
  }

  async function handleReorder(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return
    const sorted = [...tasks].sort((a, b) => a.position - b.position)
    const updated = [...sorted]
    const [moved] = updated.splice(fromIdx, 1)
    updated.splice(toIdx, 0, moved)

    // Active task (position 0) cannot be moved
    if (moved.position === 0) return

    await fetch('/api/tasks/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_ids: updated.map(t => t.id) }),
    })
    refresh()
  }

  const sortedTasks: ScheduledTask[] = scheduled.length
    ? [...scheduled].sort((a, b) => a.position - b.position)
    : [...tasks].sort((a, b) => a.position - b.position).map(t => ({
        ...t,
        slots: [],
        computed_start: '',
        computed_end: '',
      }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Ładowanie...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">{machineName}</h2>

      {/* Calendar view */}
      <div className="mb-4 bg-white rounded-xl border p-3">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Harmonogram</div>
        <MachineCalendar scheduled={scheduled} />
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl border p-3 flex-1 overflow-y-auto">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Kolejka ({sortedTasks.length})
        </div>
        {sortedTasks.map((task, idx) => (
          <div
            key={task.id}
            draggable={task.position !== 0}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleReorder(idx, sortedTasks.findIndex(t => t.id === task.id))}
          >
            <TaskCard
              task={task}
              isActive={task.position === 0}
              onFinishEarly={handleFinishEarly}
              onProlong={handleProlong}
              onSplit={handleSplit}
              onRemove={handleRemove}
            />
          </div>
        ))}
        <AddTaskForm onAdd={handleAdd} />
      </div>
    </div>
  )
}
