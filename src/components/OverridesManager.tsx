'use client'

import { useState } from 'react'
import { ScheduleOverride } from '@/lib/supabase'
import { ConfirmDialog } from './ConfirmDialog'

type Props = {
  machineId: string
  overrides: ScheduleOverride[]
  onChanged: () => void
  onError: (msg: string) => void
}

export function OverridesManager({ machineId, overrides, onChanged, onError }: Props) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newStart, setNewStart] = useState('06:00')
  const [newEnd, setNewEnd] = useState('14:00')
  const [newOff, setNewOff] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!newDate) return
    setLoading(true)
    try {
      const res = await fetch('/api/working-hours/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machineId,
          date: newDate,
          start_time: newOff ? null : newStart,
          end_time: newOff ? null : newEnd,
          is_working: !newOff,
        }),
      })
      if (!res.ok) throw new Error()
      setShowAddModal(false)
      setNewDate('')
      setNewOff(false)
      onChanged()
    } catch {
      onError('Nie udało się dodać wyjątku')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/working-hours/overrides', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setDeleteId(null)
      onChanged()
    } catch {
      onError('Nie udało się usunąć wyjątku')
    }
  }

  const sorted = [...overrides].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      {sorted.length === 0 && (
        <p className="text-sm text-gray-400 mb-4">Brak wyjątków</p>
      )}

      {sorted.length > 0 && (
        <div className="mb-4 rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left py-2 px-3 font-medium text-gray-600">Data</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Godziny</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(o => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{o.date}</td>
                  <td className="py-2 px-3">
                    {o.is_working
                      ? <span>{o.start_time?.slice(0, 5)} – {o.end_time?.slice(0, 5)}</span>
                      : <span className="text-red-500 font-medium">Dzień wolny</span>
                    }
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => setDeleteId(o.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors text-base leading-none"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Dodaj wyjątek
      </button>

      {/* Add override modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-4">Dodaj wyjątek</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newOff}
                  onChange={e => setNewOff(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span>Dzień wolny</span>
              </label>
              {!newOff && (
                <div className="flex gap-2 items-center">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Od</label>
                    <input
                      type="time"
                      value={newStart}
                      onChange={e => setNewStart(e.target.value)}
                      className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-gray-400 mt-4">–</span>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Do</label>
                    <input
                      type="time"
                      value={newEnd}
                      onChange={e => setNewEnd(e.target.value)}
                      className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleAdd}
                disabled={loading || !newDate}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Zapisywanie...' : 'Dodaj'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Usuń wyjątek"
          message="Czy na pewno chcesz usunąć ten wyjątek?"
          confirmLabel="Usuń"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
