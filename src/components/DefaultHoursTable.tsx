'use client'

import { useState, useEffect } from 'react'
import { ScheduleDefault } from '@/lib/supabase'

const DAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

type Props = {
  machineId: string
  defaults: ScheduleDefault[]
  onSaved: () => void
  onError: (msg: string) => void
}

type RowState = {
  is_working: boolean
  start_time: string
  end_time: string
}

export function DefaultHoursTable({ machineId, defaults, onSaved, onError }: Props) {
  const [rows, setRows] = useState<RowState[]>(() =>
    Array.from({ length: 7 }, (_, i) => {
      const def = defaults.find(d => d.day_of_week === i)
      return {
        is_working: def?.is_working ?? false,
        start_time: def?.start_time?.slice(0, 5) ?? '06:00',
        end_time: def?.end_time?.slice(0, 5) ?? '14:00',
      }
    })
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setRows(Array.from({ length: 7 }, (_, i) => {
      const def = defaults.find(d => d.day_of_week === i)
      return {
        is_working: def?.is_working ?? false,
        start_time: def?.start_time?.slice(0, 5) ?? '06:00',
        end_time: def?.end_time?.slice(0, 5) ?? '14:00',
      }
    }))
  }, [defaults])

  function updateRow(dow: number, field: keyof RowState, value: string | boolean) {
    setRows(prev => prev.map((r, i) => i === dow ? { ...r, [field]: value } : r))
  }

  async function saveAll() {
    setSaving(true)
    try {
      for (let dow = 0; dow < 7; dow++) {
        const row = rows[dow]
        await fetch('/api/working-hours/defaults', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            machine_id: machineId,
            day_of_week: dow,
            start_time: row.start_time,
            end_time: row.end_time,
            is_working: row.is_working,
          }),
        })
      }
      onSaved()
    } catch {
      onError('Nie udało się zapisać godzin pracy')
    } finally {
      setSaving(false)
    }
  }

  async function saveRow(dow: number, overrides?: Partial<RowState>) {
    const row = { ...rows[dow], ...overrides }
    try {
      const res = await fetch('/api/working-hours/defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machineId,
          day_of_week: dow,
          start_time: row.start_time,
          end_time: row.end_time,
          is_working: row.is_working,
        }),
      })
      if (!res.ok) throw new Error()
      onSaved()
    } catch {
      onError('Nie udało się zapisać wiersza')
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium text-gray-600 w-36">Dzień</th>
              <th className="text-center py-2 font-medium text-gray-600 w-20">Pracujący</th>
              <th className="text-left py-2 font-medium text-gray-600">Od</th>
              <th className="text-left py-2 font-medium text-gray-600">Do</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, dow) => (
              <tr key={dow} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium text-gray-700">{DAY_NAMES[dow]}</td>
                <td className="py-2 text-center">
                  <input
                    type="checkbox"
                    checked={row.is_working}
                    onChange={e => {
                      const checked = e.target.checked
                      updateRow(dow, 'is_working', checked)
                      saveRow(dow, { is_working: checked })
                    }}
                    className="w-4 h-4 accent-blue-600"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="time"
                    value={row.start_time}
                    disabled={!row.is_working}
                    onChange={e => updateRow(dow, 'start_time', e.target.value)}
                    onBlur={() => saveRow(dow)}
                    className="border rounded-lg px-2 py-1 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="time"
                    value={row.end_time}
                    disabled={!row.is_working}
                    onChange={e => updateRow(dow, 'end_time', e.target.value)}
                    onBlur={() => saveRow(dow)}
                    className="border rounded-lg px-2 py-1 text-sm disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={saveAll}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Zapisywanie...' : 'Zapisz wszystko'}
        </button>
      </div>
    </div>
  )
}
