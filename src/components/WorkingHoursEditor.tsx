'use client'

import { useState, useEffect } from 'react'

const DAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const MONTH_LABELS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']

function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  const dow = (d.getDay() + 6) % 7
  return `${DAY_LABELS[dow]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`
}

function minToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

type Props = {
  machineId: string
  machineName: string
  date: string
  initialHours: { start_min: number; end_min: number; is_working: boolean }
  existingOverrideId: string | null
  onClose: () => void
  onSaved: () => void
  onError: (msg: string) => void
}

export function WorkingHoursEditor({
  machineId,
  machineName,
  date,
  initialHours,
  existingOverrideId,
  onClose,
  onSaved,
  onError,
}: Props) {
  const [isWorking, setIsWorking] = useState(initialHours.is_working)
  const [startTime, setStartTime] = useState(
    initialHours.is_working ? minToTime(initialHours.start_min) : '06:00'
  )
  const [endTime, setEndTime] = useState(
    initialHours.is_working ? minToTime(initialHours.end_min) : '14:00'
  )
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    if (isWorking && timeToMin(endTime) <= timeToMin(startTime)) {
      onError('Godzina zakończenia musi być późniejsza niż rozpoczęcia')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/working-hours/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machineId,
          date,
          start_time: isWorking ? startTime : null,
          end_time: isWorking ? endTime : null,
          is_working: isWorking,
        }),
      })
      if (!res.ok) throw new Error('Nie udało się zapisać')
      onSaved()
      onClose()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!existingOverrideId) return
    setResetting(true)
    try {
      const res = await fetch('/api/working-hours/overrides', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: existingOverrideId }),
      })
      if (!res.ok) throw new Error('Nie udało się zresetować')
      onSaved()
      onClose()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Błąd resetu')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{machineName}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{formatDate(date)}</p>
          </div>
          {existingOverrideId && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">wyjątek</span>
          )}
        </div>

        <div className="space-y-4">
          {/* Working toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isWorking}
              onChange={e => setIsWorking(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Dzień roboczy</span>
          </label>

          {/* Times */}
          {isWorking && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Od</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Do</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Zapisuję...' : 'Zapisz wyjątek'}
          </button>
          <button
            onClick={onClose}
            className="px-3 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
        </div>

        {existingOverrideId && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="mt-2 w-full text-xs text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors text-center py-1"
          >
            {resetting ? 'Resetuję...' : 'Resetuj do ustawień domyślnych'}
          </button>
        )}
      </div>
    </div>
  )
}
