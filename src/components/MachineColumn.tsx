'use client'

import { useRef, useState, useCallback } from 'react'
import { ScheduledTask } from '@/lib/scheduler'
import { TaskBlock, PIXELS_PER_HOUR } from './TaskBlock'

type DragData = {
  taskId: string
  machineId: string
  originalPosition: number
}

type ResizeState = {
  taskId: string
  startY: number
  originalDuration: number
  currentDuration: number
}

type WorkingHours = {
  start_min: number
  end_min: number
  is_working: boolean
}

type Props = {
  machineId: string
  machineName: string
  tasks: ScheduledTask[]
  currentDate: string
  dayStartHour: number
  dayEndHour: number
  showHeader?: boolean
  colorScheme: 'blue' | 'green'
  workingHours: WorkingHours
  onTaskClick: (task: ScheduledTask, e: React.MouseEvent) => void
  onTaskContextMenu: (task: ScheduledTask, e: React.MouseEvent) => void
  onAddTask: () => void
  onDrop: (dragData: DragData, targetMachineId: string, targetPosition: number) => void
  onResize: (taskId: string, newDurationMin: number) => void
  onError: (msg: string) => void
}

export function MachineColumn({
  machineId,
  machineName,
  tasks,
  currentDate,
  dayStartHour,
  dayEndHour,
  showHeader = true,
  colorScheme,
  workingHours,
  onTaskClick,
  onTaskContextMenu,
  onAddTask,
  onDrop,
  onResize,
  onError,
}: Props) {
  const columnRef = useRef<HTMLDivElement>(null)
  const isResizingRef = useRef(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dropIndicatorY, setDropIndicatorY] = useState<number | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const [resizePreview, setResizePreview] = useState<number | null>(null)

  const dayStartMin = dayStartHour * 60
  const dayEndMin = dayEndHour * 60
  const totalHours = dayEndHour - dayStartHour

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position)

  // "In progress" = position 0 AND current time is within one of the task's slots
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const nowMin = now.getHours() * 60 + now.getMinutes()
  function isTaskInProgress(task: ScheduledTask): boolean {
    if (task.position !== 0) return false
    return task.slots.some(s => s.date === todayStr && s.start_min <= nowMin && nowMin < s.end_min)
  }

  // Build queue index map (position > 0 only, 0-based) for alternating colors
  const queueIndexMap = new Map<string, number>()
  sortedTasks.filter(t => t.position > 0).forEach((t, idx) => queueIndexMap.set(t.id, idx))
  // Tasks visible on this date column
  const visibleTasks = tasks.filter(t => t.slots.some(s => s.date === currentDate))

  // Compute top pixel for a task on this date (returns null if not visible here)
  function getTaskTopPx(task: ScheduledTask): number | null {
    const slot = task.slots.find(s => s.date === currentDate)
    if (!slot) return null
    return Math.max(0, ((slot.start_min - dayStartMin) / 60) * PIXELS_PER_HOUR)
  }

  function getTaskHeightPx(task: ScheduledTask): number {
    const slot = task.slots.find(s => s.date === currentDate)
    if (!slot) return 0
    return Math.max(20, ((slot.end_min - slot.start_min) / 60) * PIXELS_PER_HOUR)
  }

  // Given a drop Y, return the target position (index in sortedTasks after which to insert)
  // Returns position value for the reorder call
  function getDropTarget(dropY: number): { position: number; indicatorY: number } {
    // Build list of queued tasks (position > 0) that are visible, with their midpoint Y
    const queued = sortedTasks.filter(t => t.position > 0)

    if (queued.length === 0) {
      return { position: 1, indicatorY: dropY }
    }

    // For each queued task visible on this date, get its top + height
    const rendered = queued.map(t => {
      const topPx = getTaskTopPx(t)
      const heightPx = getTaskHeightPx(t)
      return { task: t, topPx, midPx: topPx !== null ? topPx + heightPx / 2 : null }
    })

    // Find insertion point: insert before the first task whose midpoint is below the cursor
    for (const { task, topPx, midPx } of rendered) {
      if (midPx !== null && dropY < midPx) {
        // Insert before this task
        const indicatorY = topPx ?? dropY
        return { position: task.position, indicatorY }
      }
    }

    // Drop below all visible tasks → append at end of queue
    const last = rendered.filter(r => r.topPx !== null).at(-1)
    const indicatorY = last ? (last.topPx ?? 0) + getTaskHeightPx(last.task) + 2 : dropY
    return { position: sortedTasks.length, indicatorY }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
    const rect = columnRef.current?.getBoundingClientRect()
    if (rect) {
      const dropY = e.clientY - rect.top
      const { indicatorY } = getDropTarget(dropY)
      setDropIndicatorY(indicatorY)
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the column entirely (not entering a child)
    if (!columnRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
      setDropIndicatorY(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    setDropIndicatorY(null)
    try {
      const raw = e.dataTransfer.getData('application/json')
      if (!raw) return
      const dragData: DragData = JSON.parse(raw)
      const rect = columnRef.current?.getBoundingClientRect()
      if (!rect) return
      const dropY = e.clientY - rect.top
      const { position } = getDropTarget(dropY)
      onDrop(dragData, machineId, position)
    } catch {
      onError('Błąd przeciągania zadania')
    }
  }

  // Resize handlers
  const handleResizeMouseDown = useCallback((task: ScheduledTask, e: React.MouseEvent) => {
    // Block resize only while the task is actively running
    const _now = new Date()
    const _today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`
    const _nowMin = _now.getHours() * 60 + _now.getMinutes()
    const inProgress = task.position === 0 && task.slots.some(s => s.date === _today && s.start_min <= _nowMin && _nowMin < s.end_min)
    if (inProgress) return
    e.preventDefault()
    e.stopPropagation()
    isResizingRef.current = true

    setResizeState({
      taskId: task.id,
      startY: e.clientY,
      originalDuration: task.duration_min,
      currentDuration: task.duration_min,
    })

    function onMouseMove(me: MouseEvent) {
      setResizeState(prev => {
        if (!prev) return null
        const deltaY = me.clientY - prev.startY
        const deltaMin = Math.round((deltaY / PIXELS_PER_HOUR) * 60)
        const newDuration = Math.max(5, prev.originalDuration + deltaMin)
        setResizePreview(newDuration)
        return { ...prev, currentDuration: newDuration }
      })
    }

    function onMouseUp() {
      isResizingRef.current = false
      setResizeState(prev => {
        if (!prev) return null
        const finalDuration = prev.currentDuration
        if (Math.abs(finalDuration - prev.originalDuration) > 1) {
          onResize(prev.taskId, finalDuration)
        }
        return null
      })
      setResizePreview(null)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [onResize])

  const hours = Array.from({ length: totalHours + 1 }, (_, i) => dayStartHour + i)

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50 flex-shrink-0">
          <span className="font-semibold text-sm text-gray-800">{machineName}</span>
          <button
            onClick={onAddTask}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            + Dodaj
          </button>
        </div>
      )}

      <div
        ref={columnRef}
        className={`relative flex-1 overflow-hidden transition-colors ${isDragOver ? 'bg-blue-50/40' : 'bg-white'}`}
        style={{ height: totalHours * PIXELS_PER_HOUR }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hour grid lines */}
        {hours.map(h => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-gray-100"
            style={{ top: (h - dayStartHour) * PIXELS_PER_HOUR }}
          />
        ))}

        {/* Half-hour grid lines */}
        {hours.slice(0, -1).map(h => (
          <div
            key={`half-${h}`}
            className="absolute left-0 right-0 border-t border-dashed border-gray-50"
            style={{ top: (h - dayStartHour) * PIXELS_PER_HOUR + PIXELS_PER_HOUR / 2 }}
          />
        ))}

        {/* Working hours shading — gray overlay outside working hours */}
        {workingHours.is_working ? (
          <>
            {workingHours.start_min > dayStartMin && (
              <div
                className="absolute left-0 right-0 bg-gray-100/70 pointer-events-none"
                style={{
                  top: 0,
                  height: ((workingHours.start_min - dayStartMin) / 60) * PIXELS_PER_HOUR,
                  zIndex: 2,
                }}
              />
            )}
            {workingHours.end_min < dayEndMin && (
              <div
                className="absolute left-0 right-0 bg-gray-100/70 pointer-events-none"
                style={{
                  top: ((workingHours.end_min - dayStartMin) / 60) * PIXELS_PER_HOUR,
                  height: ((dayEndMin - workingHours.end_min) / 60) * PIXELS_PER_HOUR,
                  zIndex: 2,
                }}
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gray-100/70 pointer-events-none" style={{ zIndex: 2 }} />
        )}

        {/* Task blocks */}
        {visibleTasks.map(task => {
          const isFirst = task.position === 0      // controls drag/resize behaviour
          const isInProgress = isTaskInProgress(task)  // controls "W toku" visual
          const slot = task.slots.find(s => s.date === currentDate)
          if (!slot) return null

          const topPx = Math.max(0, ((slot.start_min - dayStartMin) / 60) * PIXELS_PER_HOUR)
          const slotDuration = slot.end_min - slot.start_min
          const displayDuration = resizeState?.taskId === task.id && resizePreview
            ? resizePreview
            : slotDuration
          const heightPx = Math.max(20, (displayDuration / 60) * PIXELS_PER_HOUR)

          return (
            <div
              key={task.id}
              className={`absolute left-1 right-1 ${!isInProgress ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
              style={{ top: topPx, height: heightPx, zIndex: resizeState?.taskId === task.id ? 20 : 10 }}
              draggable={!isInProgress}
              onDragStart={e => {
                if (isInProgress || isResizingRef.current) {
                  e.preventDefault()
                  return
                }
                const data: DragData = {
                  taskId: task.id,
                  machineId,
                  originalPosition: task.position,
                }
                e.dataTransfer.setData('application/json', JSON.stringify(data))
                e.dataTransfer.effectAllowed = 'move'
              }}
            >
              <TaskBlock
                task={task}
                isActive={isInProgress}
                dayStart={dayStartMin}
                currentDate={currentDate}
                colorScheme={colorScheme}
                colorIndex={isFirst ? 0 : (queueIndexMap.get(task.id) ?? 0)}
                onClick={onTaskClick}
                onContextMenu={onTaskContextMenu}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%' }}
              />
              {/* Resize handle — locked only while task is actively running */}
              {!isInProgress && (
                <div
                  draggable={false}
                  className="absolute bottom-0 left-2 right-2 h-2 cursor-ns-resize z-20 group/resize"
                  onMouseDown={e => handleResizeMouseDown(task, e)}
                >
                  {/* Visual indicator on hover */}
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-gray-400/0 group-hover/resize:bg-gray-400/60 transition-colors" />
                </div>
              )}
            </div>
          )
        })}

        {/* Drop indicator line */}
        {isDragOver && dropIndicatorY !== null && (
          <div
            className="absolute left-1 right-1 h-0.5 bg-blue-500 rounded pointer-events-none z-30"
            style={{ top: dropIndicatorY }}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500" />
          </div>
        )}

        {/* Empty state */}
        {visibleTasks.length === 0 && !isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-300 text-sm">Brak zadań</span>
          </div>
        )}
      </div>
    </div>
  )
}
