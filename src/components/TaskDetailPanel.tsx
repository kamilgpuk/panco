'use client'

import { useState, useEffect } from 'react'
import { ScheduledTask, formatMinutes } from '@/lib/scheduler'

type Modal = 'prolong' | 'split' | 'finish' | null

type Props = {
  task: ScheduledTask
  isActive: boolean
  totalTasksOnMachine: number
  onClose: () => void
  onFinishEarly: (id: string) => void
  onProlong: (id: string, newMin: number) => void
  onSplit: (id: string, firstMin: number) => void
  onDelete: (id: string) => void
  onError: (msg: string) => void
}

export function TaskDetailPanel({
  task,
  isActive,
  totalTasksOnMachine,
  onClose,
  onFinishEarly,
  onProlong,
  onSplit,
  onDelete,
  onError,
}: Props) {
  const [modal, setModal] = useState<Modal>(null)
  const [inputHours, setInputHours] = useState(0)
  const [inputMinutes, setInputMinutes] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (modal) setModal(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, onClose])

  const totalMin = inputHours * 60 + inputMinutes

  async function handleModalConfirm() {
    if (totalMin <= 0) return
    setLoading(true)
    try {
      if (modal === 'prolong') onProlong(task.id, totalMin)
      if (modal === 'split') onSplit(task.id, totalMin)
      if (modal === 'finish') onFinishEarly(task.id)
      setModal(null)
      onClose()
    } catch {
      onError('Operacja nie powiodła się')
    } finally {
      setLoading(false)
    }
  }

  function openModal(m: Modal) {
    setInputHours(Math.floor(task.duration_min / 60))
    setInputMinutes(task.duration_min % 60)
    setModal(m)
  }

  const durationH = Math.floor(task.duration_min / 60)
  const durationM = task.duration_min % 60

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl p-6 w-[440px] max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
            <div className="flex gap-2 mt-1">
              {isActive ? (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">W toku</span>
              ) : (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                  Poz. {task.position + 1} z {totalTasksOnMachine}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1">×</button>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Czas trwania:</span>
            <span className="font-medium">
              {durationH > 0 && `${durationH}h `}{durationM > 0 && `${durationM} min`}
              {durationH === 0 && durationM === 0 && '0 min'}
            </span>
          </div>
          {task.slots.length > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Początek:</span>
                <span className="font-medium">
                  {task.slots[0].date} {formatMinutes(task.slots[0].start_min)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Koniec:</span>
                <span className="font-medium">
                  {task.slots[task.slots.length - 1].date} {formatMinutes(task.slots[task.slots.length - 1].end_min)}
                </span>
              </div>
            </>
          )}
          {task.slots.length > 1 && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Odcinki</div>
              {task.slots.map((slot, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{slot.date}</span>
                  <span>{formatMinutes(slot.start_min)}–{formatMinutes(slot.end_min)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t pt-4 space-y-2">
          {isActive ? (
            <>
              <button
                onClick={() => openModal('finish')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 border"
              >
                Zakończ teraz
              </button>
              <button
                onClick={() => openModal('prolong')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 border"
              >
                Przedłuż
              </button>
              <button
                onClick={() => openModal('split')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 border"
              >
                Podziel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openModal('prolong')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 border"
              >
                Zmień czas
              </button>
              <button
                onClick={() => openModal('split')}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 border"
              >
                Podziel
              </button>
              <button
                onClick={() => { onDelete(task.id); onClose() }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 border border-transparent"
              >
                Usuń
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="w-full bg-gray-100 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 transition-colors mt-2"
          >
            Zamknij
          </button>
        </div>
      </div>

      {/* Inner modal */}
      {modal && modal !== 'finish' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/20" onClick={() => setModal(null)}>
          <div
            className="bg-white rounded-xl p-6 w-80 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="font-semibold mb-3">
              {modal === 'prolong' ? (isActive ? 'Przedłuż zadanie' : 'Zmień czas zadania') : 'Podziel zadanie'}
            </h4>
            {modal === 'split' && (
              <p className="text-sm text-gray-600 mb-3">
                Łączny czas: {durationH > 0 ? `${durationH}h ` : ''}{durationM > 0 ? `${durationM} min` : ''}
                <br />Czas drugiej części: {Math.max(0, task.duration_min - totalMin)} min
              </p>
            )}
            {modal === 'prolong' && (
              <p className="text-sm text-gray-600 mb-3">Obecny czas: {task.duration_min} min</p>
            )}
            <div className="flex gap-2 items-center mb-4">
              <input
                type="number"
                value={inputHours}
                onChange={e => setInputHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
              />
              <span className="text-sm text-gray-500">godz.</span>
              <input
                type="number"
                value={inputMinutes}
                onChange={e => setInputMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                max={59}
              />
              <span className="text-sm text-gray-500">min.</span>
            </div>
            {modal === 'split' && totalMin >= task.duration_min && (
              <p className="text-xs text-red-500 mb-2">Pierwsza część musi być krótsza niż całość</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleModalConfirm}
                disabled={loading || totalMin <= 0 || (modal === 'split' && totalMin >= task.duration_min)}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Potwierdź
              </button>
              <button
                onClick={() => setModal(null)}
                className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'finish' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/20" onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <h4 className="font-semibold mb-3">Zakończ zadanie</h4>
            <p className="text-sm text-gray-600 mb-5">
              Czy na pewno chcesz zakończyć zadanie &quot;{task.title}&quot; teraz?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { onFinishEarly(task.id); setModal(null); onClose() }}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Zakończ
              </button>
              <button onClick={() => setModal(null)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
