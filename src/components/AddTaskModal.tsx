'use client'

import { useState, useEffect } from 'react'

type Props = {
  machineId: string
  machineName: string
  onClose: () => void
  onAdded: () => void
  onError: (msg: string) => void
}

export function AddTaskModal({ machineId, machineName, onClose, onAdded, onError }: Props) {
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState(1)
  const [minutes, setMinutes] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const totalMin = hours * 60 + minutes

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || totalMin <= 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: machineId, title: title.trim(), duration_min: totalMin }),
      })
      if (!res.ok) throw new Error('Nie udało się dodać zadania')
      onAdded()
      onClose()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Błąd sieci')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900 mb-4">Dodaj zadanie – {machineName}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nazwa zadania..."
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Czas trwania</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={hours}
                onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
              />
              <span className="text-sm text-gray-500">godz.</span>
              <input
                type="number"
                value={minutes}
                onChange={e => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={0}
                max={59}
              />
              <span className="text-sm text-gray-500">min.</span>
            </div>
            {totalMin <= 0 && (
              <p className="text-xs text-red-500 mt-1">Czas musi być większy niż 0</p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || !title.trim() || totalMin <= 0}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Dodawanie...' : 'Dodaj zadanie'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
