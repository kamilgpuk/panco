'use client'

import { useState } from 'react'
import { ScheduledTask } from '@/lib/scheduler'
import { formatMinutes } from '@/lib/scheduler'

type Props = {
  task: ScheduledTask
  isActive: boolean
  onFinishEarly: (id: string, actualMin: number) => void
  onProlong: (id: string, newMin: number) => void
  onSplit: (id: string, firstMin: number) => void
  onRemove: (id: string) => void
}

export function TaskCard({ task, isActive, onFinishEarly, onProlong, onSplit, onRemove }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [modal, setModal] = useState<'finish' | 'prolong' | 'split' | null>(null)
  const [inputVal, setInputVal] = useState('')

  const durationH = Math.floor(task.duration_min / 60)
  const durationM = task.duration_min % 60

  const firstSlot = task.slots[0]
  const lastSlot = task.slots[task.slots.length - 1]

  function handleAction() {
    const val = parseInt(inputVal)
    if (isNaN(val) || val <= 0) return
    if (modal === 'finish') onFinishEarly(task.id, val)
    if (modal === 'prolong') onProlong(task.id, val)
    if (modal === 'split') onSplit(task.id, val)
    setModal(null)
    setInputVal('')
  }

  return (
    <div className={`relative rounded-lg border p-3 mb-2 ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{task.title}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {durationH > 0 && `${durationH}h `}{durationM > 0 && `${durationM}min`}
            {firstSlot && (
              <span className="ml-2 text-gray-400">
                {firstSlot.date} {formatMinutes(firstSlot.start_min)}&ndash;{lastSlot ? formatMinutes(lastSlot.end_min) : ''}
              </span>
            )}
          </div>
          {isActive && (
            <span className="inline-block mt-1 text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
              W toku
            </span>
          )}
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="ml-2 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          &#8942;
        </button>
      </div>

      {showMenu && (
        <div className="absolute right-0 top-8 z-10 w-44 bg-white rounded-lg border border-gray-200 shadow-lg py-1">
          {isActive ? (
            <>
              <button onClick={() => { setModal('finish'); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Zakończ wcześniej</button>
              <button onClick={() => { setModal('prolong'); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Przedłuż</button>
              <button onClick={() => { setModal('split'); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Podziel</button>
            </>
          ) : (
            <>
              <button onClick={() => { setModal('prolong'); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Zmień czas</button>
              <button onClick={() => { setModal('split'); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Podziel</button>
              <button onClick={() => { onRemove(task.id); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Usuń</button>
            </>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-semibold mb-4">
              {modal === 'finish' && 'Zakończ wcześniej'}
              {modal === 'prolong' && 'Zmień czas'}
              {modal === 'split' && 'Podziel zadanie'}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {modal === 'finish' && `Ile minut faktycznie zajęło? (zaplanowano ${task.duration_min} min)`}
              {modal === 'prolong' && `Nowy łączny czas (min)? (obecny: ${task.duration_min} min)`}
              {modal === 'split' && `Czas pierwszej części (min)? Łącznie: ${task.duration_min} min`}
            </p>
            <input
              type="number"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
              placeholder="Minuty..."
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleAction} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
                Potwierdź
              </button>
              <button onClick={() => { setModal(null); setInputVal('') }} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
