'use client'

import { useEffect, useRef } from 'react'
import { ScheduledTask } from '@/lib/scheduler'

type Props = {
  task: ScheduledTask
  isActive: boolean
  position: { x: number; y: number }
  onClose: () => void
  onDetails: () => void
  onFinishEarly: () => void
  onProlong: () => void
  onSplit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

export function TaskContextMenu({
  task,
  isActive,
  position,
  onClose,
  onDetails,
  onFinishEarly,
  onProlong,
  onSplit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Clamp to viewport
  const viewW = typeof window !== 'undefined' ? window.innerWidth : 800
  const viewH = typeof window !== 'undefined' ? window.innerHeight : 600
  const menuW = 192
  const menuH = isActive ? 160 : 220
  const left = Math.min(position.x, viewW - menuW - 8)
  const top = Math.min(position.y, viewH - menuH - 8)

  const itemClass = 'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors'
  const disabledClass = 'w-full text-left px-3 py-2 text-sm text-gray-300 cursor-not-allowed'
  const redClass = 'w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'

  return (
    <div
      ref={ref}
      className="fixed z-50 w-48 bg-white rounded-xl border border-gray-200 shadow-xl py-1"
      style={{ left, top }}
    >
      <div className="px-3 py-1.5 text-xs font-medium text-gray-400 border-b mb-1 truncate">
        {task.title}
      </div>

      <button onClick={() => { onDetails(); onClose() }} className={itemClass}>
        Szczegóły
      </button>

      {isActive ? (
        <>
          <button onClick={() => { onFinishEarly(); onClose() }} className={itemClass}>
            Zakończ teraz
          </button>
          <button onClick={() => { onProlong(); onClose() }} className={itemClass}>
            Przedłuż
          </button>
          <button onClick={() => { onSplit(); onClose() }} className={itemClass}>
            Podziel
          </button>
        </>
      ) : (
        <>
          <button onClick={() => { onProlong(); onClose() }} className={itemClass}>
            Zmień czas
          </button>
          <button onClick={() => { onSplit(); onClose() }} className={itemClass}>
            Podziel
          </button>
          <div className="border-t my-1" />
          <button
            onClick={canMoveUp ? () => { onMoveUp(); onClose() } : undefined}
            className={canMoveUp ? itemClass : disabledClass}
          >
            ↑ W górę
          </button>
          <button
            onClick={canMoveDown ? () => { onMoveDown(); onClose() } : undefined}
            className={canMoveDown ? itemClass : disabledClass}
          >
            ↓ W dół
          </button>
          <div className="border-t my-1" />
          <button onClick={() => { onDelete(); onClose() }} className={redClass}>
            Usuń
          </button>
        </>
      )}
    </div>
  )
}
