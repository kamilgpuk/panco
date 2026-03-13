'use client'

import { useState, useCallback, useEffect } from 'react'
import { CalendarHeader, ViewDays } from '@/components/CalendarHeader'
import { CalendarGrid } from '@/components/CalendarGrid'
import { TaskContextMenu } from '@/components/TaskContextMenu'
import { TaskDetailPanel } from '@/components/TaskDetailPanel'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { AddTaskModal } from '@/components/AddTaskModal'
import { Toast, ToastItem } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useMachineData } from '@/hooks/useMachineData'
import { ScheduledTask } from '@/lib/scheduler'

const MACHINES = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Router 1' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Router 2' },
]

function dateToStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

type ContextMenuState = {
  task: ScheduledTask
  machineId: string
  position: { x: number; y: number }
}

type DragData = {
  taskId: string
  machineId: string
  originalPosition: number
}

let toastCounter = 0

function InnerApp() {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [viewDays, setViewDays] = useState<ViewDays>(3)

  const dates = Array.from({ length: viewDays }, (_, i) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + i)
    return dateToStr(d)
  })

  const machine1 = useMachineData(MACHINES[0].id)
  const machine2 = useMachineData(MACHINES[1].id)

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [detailTask, setDetailTask] = useState<{ task: ScheduledTask; machineId: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ taskId: string; machineId: string } | null>(null)
  const [addTaskMachineId, setAddTaskMachineId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOverTrash, setIsDragOverTrash] = useState(false)

  useEffect(() => {
    const onDragStart = () => setIsDragging(true)
    const onDragEnd = () => { setIsDragging(false); setIsDragOverTrash(false) }
    window.addEventListener('dragstart', onDragStart)
    window.addEventListener('dragend', onDragEnd)
    return () => {
      window.removeEventListener('dragstart', onDragStart)
      window.removeEventListener('dragend', onDragEnd)
    }
  }, [])

  async function handleTrashDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOverTrash(false)
    setIsDragging(false)
    try {
      const raw = e.dataTransfer.getData('application/json')
      if (!raw) return
      const { taskId, machineId } = JSON.parse(raw) as DragData
      await handleDelete(taskId, machineId)
    } catch {
      showToast('Błąd usuwania zadania', 'error')
    }
  }

  function showToast(message: string, type: ToastItem['type'] = 'info') {
    const id = ++toastCounter
    setToasts(prev => [...prev, { id, message, type }])
  }

  function dismissToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  function getMachineHook(machineId: string) {
    return machineId === MACHINES[0].id ? machine1 : machine2
  }

  function getScheduled(machineId: string) {
    return getMachineHook(machineId).scheduled
  }

  const scheduledByMachine = new Map<string, ScheduledTask[]>([
    [MACHINES[0].id, machine1.scheduled],
    [MACHINES[1].id, machine2.scheduled],
  ])

  const machineDefaults = new Map([
    [MACHINES[0].id, machine1.defaults],
    [MACHINES[1].id, machine2.defaults],
  ])

  const machineOverrides = new Map([
    [MACHINES[0].id, machine1.overrides],
    [MACHINES[1].id, machine2.overrides],
  ])

  // --- Task actions ---

  async function handleFinishEarly(taskId: string, machineId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Nie udało się zakończyć zadania')
      getMachineHook(machineId).refresh()
      showToast('Zadanie zakończone', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Błąd operacji', 'error')
    }
  }

  async function handleProlong(taskId: string, machineId: string, newMin: number) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_min: newMin }),
      })
      if (!res.ok) throw new Error('Nie udało się zmienić czasu')
      getMachineHook(machineId).refresh()
      showToast('Czas zaktualizowany', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Błąd operacji', 'error')
    }
  }

  async function handleSplit(taskId: string, machineId: string, firstMin: number) {
    try {
      const res = await fetch('/api/tasks/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, first_duration_min: firstMin }),
      })
      if (!res.ok) throw new Error('Nie udało się podzielić zadania')
      getMachineHook(machineId).refresh()
      showToast('Zadanie podzielone', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Błąd operacji', 'error')
    }
  }

  async function handleDelete(taskId: string, machineId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Nie udało się usunąć zadania')
      getMachineHook(machineId).refresh()
      showToast('Zadanie usunięte', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Błąd operacji', 'error')
    }
  }

  async function handleMoveUp(task: ScheduledTask, machineId: string) {
    const scheduled = getScheduled(machineId)
    const sorted = [...scheduled].sort((a, b) => a.position - b.position)
    const idx = sorted.findIndex(t => t.id === task.id)
    if (idx <= 1) return // can't move above active (position 0) or already at top of queue
    const newOrder = [...sorted]
    const [moved] = newOrder.splice(idx, 1)
    newOrder.splice(idx - 1, 0, moved)
    try {
      const res = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_ids: newOrder.map(t => t.id) }),
      })
      if (!res.ok) throw new Error()
      getMachineHook(machineId).refresh()
    } catch {
      showToast('Nie udało się przestawić kolejności', 'error')
    }
  }

  async function handleMoveDown(task: ScheduledTask, machineId: string) {
    const scheduled = getScheduled(machineId)
    const sorted = [...scheduled].sort((a, b) => a.position - b.position)
    const idx = sorted.findIndex(t => t.id === task.id)
    if (idx >= sorted.length - 1) return
    const newOrder = [...sorted]
    const [moved] = newOrder.splice(idx, 1)
    newOrder.splice(idx + 1, 0, moved)
    try {
      const res = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_ids: newOrder.map(t => t.id) }),
      })
      if (!res.ok) throw new Error()
      getMachineHook(machineId).refresh()
    } catch {
      showToast('Nie udało się przestawić kolejności', 'error')
    }
  }

  async function handleDrop(dragData: DragData, targetMachineId: string, targetPosition: number) {
    const { taskId, machineId: sourceMachineId } = dragData

    try {
      if (sourceMachineId === targetMachineId) {
        // Reorder within the same machine
        const scheduled = getScheduled(sourceMachineId)
        const sorted = [...scheduled].sort((a, b) => a.position - b.position)
        const taskIdx = sorted.findIndex(t => t.id === taskId)
        if (taskIdx === -1) return

        const newOrder = [...sorted]
        const [moved] = newOrder.splice(taskIdx, 1)
        const insertAt = Math.min(targetPosition, newOrder.length)
        newOrder.splice(insertAt, 0, moved)

        const res = await fetch('/api/tasks/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_ids: newOrder.map(t => t.id) }),
        })
        if (!res.ok) throw new Error('Nie udało się przestawić')
        getMachineHook(sourceMachineId).refresh()
      } else {
        // Move to different machine
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ machine_id: targetMachineId }),
        })
        if (!res.ok) throw new Error('Nie udało się przenieść zadania')
        getMachineHook(sourceMachineId).refresh()
        getMachineHook(targetMachineId).refresh()
        showToast('Zadanie przeniesione', 'success')
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Błąd operacji', 'error')
    }
  }

  async function handleResize(machineId: string, taskId: string, newDurationMin: number) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_min: newDurationMin }),
      })
      if (!res.ok) throw new Error('Nie udało się zmienić czasu')
      getMachineHook(machineId).refresh()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Błąd operacji', 'error')
    }
  }

  function handleTaskClick(task: ScheduledTask, machineId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setContextMenu(null)
    setDetailTask({ task, machineId })
  }

  function handleTaskContextMenu(task: ScheduledTask, machineId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDetailTask(null)
    setContextMenu({ task, machineId, position: { x: e.clientX, y: e.clientY } })
  }

  // Get task position info
  function getTaskPositionInfo(task: ScheduledTask, machineId: string) {
    const scheduled = getScheduled(machineId)
    const sorted = [...scheduled].sort((a, b) => a.position - b.position)
    const idx = sorted.findIndex(t => t.id === task.id)
    const canMoveUp = idx > 1 // can't move above active task
    const canMoveDown = idx < sorted.length - 1 && idx > 0
    return { canMoveUp, canMoveDown, total: sorted.length }
  }

  // Keyboard handler for Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContextMenu(null)
      setDetailTask(null)
      setConfirmDelete(null)
      setAddTaskMachineId(null)
    }
  }, [])

  const loading = machine1.loading || machine2.loading

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Ładowanie...</div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-screen bg-gray-50 overflow-hidden"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <CalendarHeader
        currentDate={currentDate}
        viewDays={viewDays}
        onPrev={() => setCurrentDate(d => addDays(d, -viewDays))}
        onNext={() => setCurrentDate(d => addDays(d, viewDays))}
        onToday={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setCurrentDate(d) }}
        onViewChange={setViewDays}
      />

      <div className="flex-1 overflow-auto">
        <CalendarGrid
          machines={MACHINES}
          scheduledByMachine={scheduledByMachine}
          machineDefaults={machineDefaults}
          machineOverrides={machineOverrides}
          dates={dates}
          onTaskClick={(task, e) => {
            // Find which machine this task belongs to
            const machineId = MACHINES.find(m =>
              (scheduledByMachine.get(m.id) ?? []).some(t => t.id === task.id)
            )?.id ?? MACHINES[0].id
            handleTaskClick(task, machineId, e)
          }}
          onTaskContextMenu={(task, e) => {
            const machineId = MACHINES.find(m =>
              (scheduledByMachine.get(m.id) ?? []).some(t => t.id === task.id)
            )?.id ?? MACHINES[0].id
            handleTaskContextMenu(task, machineId, e)
          }}
          onAddTask={(machineId) => setAddTaskMachineId(machineId)}
          onDrop={handleDrop}
          onResize={handleResize}
          onError={(msg) => showToast(msg, 'error')}
          onRefreshMachine={(machineId) => getMachineHook(machineId).refresh()}
        />
      </div>

      {/* Context menu */}
      {contextMenu && (() => {
        const { task, machineId, position } = contextMenu
        const isActive = task.position === 0
        const posInfo = getTaskPositionInfo(task, machineId)
        return (
          <TaskContextMenu
            task={task}
            isActive={isActive}
            position={position}
            onClose={() => setContextMenu(null)}
            onDetails={() => setDetailTask({ task, machineId })}
            onFinishEarly={() => setConfirmDelete({ taskId: task.id, machineId })}
            onProlong={() => setDetailTask({ task, machineId })}
            onSplit={() => setDetailTask({ task, machineId })}
            onDelete={() => setConfirmDelete({ taskId: task.id, machineId })}
            onMoveUp={() => handleMoveUp(task, machineId)}
            onMoveDown={() => handleMoveDown(task, machineId)}
            canMoveUp={posInfo.canMoveUp}
            canMoveDown={posInfo.canMoveDown}
          />
        )
      })()}

      {/* Detail panel */}
      {detailTask && (() => {
        const { task, machineId } = detailTask
        const scheduled = getScheduled(machineId)
        const isActive = task.position === 0
        return (
          <TaskDetailPanel
            task={task}
            isActive={isActive}
            totalTasksOnMachine={scheduled.length}
            onClose={() => setDetailTask(null)}
            onFinishEarly={(id) => { handleFinishEarly(id, machineId); setDetailTask(null) }}
            onProlong={(id, newMin) => { handleProlong(id, machineId, newMin); setDetailTask(null) }}
            onSplit={(id, firstMin) => { handleSplit(id, machineId, firstMin); setDetailTask(null) }}
            onDelete={(id) => setConfirmDelete({ taskId: id, machineId })}
            onError={(msg) => showToast(msg, 'error')}
          />
        )
      })()}

      {/* Confirm delete/finish */}
      {confirmDelete && (
        <ConfirmDialog
          title="Potwierdzenie"
          message="Czy na pewno chcesz usunąć to zadanie?"
          confirmLabel="Usuń"
          onConfirm={() => {
            handleDelete(confirmDelete.taskId, confirmDelete.machineId)
            setConfirmDelete(null)
            setDetailTask(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Add task modal */}
      {addTaskMachineId && (
        <AddTaskModal
          machineId={addTaskMachineId}
          machineName={MACHINES.find(m => m.id === addTaskMachineId)?.name ?? ''}
          onClose={() => setAddTaskMachineId(null)}
          onAdded={() => getMachineHook(addTaskMachineId).refresh()}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* Trash drop zone — appears during drag */}
      <div
        className={`fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 pointer-events-auto
          ${isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
          ${isDragOverTrash
            ? 'bg-red-500 text-white scale-125 shadow-red-300 shadow-xl'
            : 'bg-white border-2 border-gray-300 text-gray-400'
          }`}
        onDragOver={e => { e.preventDefault(); setIsDragOverTrash(true) }}
        onDragLeave={() => setIsDragOverTrash(false)}
        onDrop={handleTrashDrop}
        title="Upuść tutaj, aby usunąć"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <InnerApp />
    </ErrorBoundary>
  )
}
