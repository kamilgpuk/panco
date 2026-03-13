'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ScheduleDefault, ScheduleOverride } from '@/lib/supabase'
import { DefaultHoursTable } from '@/components/DefaultHoursTable'
import { OverridesManager } from '@/components/OverridesManager'
import { Toast, ToastItem } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const MACHINES = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Router 1' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Router 2' },
]

let toastCounter = 0

function SettingsPageInner() {
  const [selectedMachine, setSelectedMachine] = useState(MACHINES[0].id)
  const [defaults, setDefaults] = useState<ScheduleDefault[]>([])
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function showToast(message: string, type: ToastItem['type'] = 'info') {
    const id = ++toastCounter
    setToasts(prev => [...prev, { id, message, type }])
  }

  function dismissToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [d, o] = await Promise.all([
        fetch(`/api/working-hours/defaults?machine_id=${selectedMachine}`).then(r => r.json()),
        fetch(`/api/working-hours/overrides?machine_id=${selectedMachine}`).then(r => r.json()),
      ])
      setDefaults(d)
      setOverrides(o)
    } catch {
      showToast('Nie udało się załadować danych', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedMachine])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
          ← Harmonogram
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Ustawienia</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Machine selector */}
        <div className="flex gap-2">
          {MACHINES.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMachine(m.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMachine === m.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border hover:bg-gray-50 text-gray-700'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-sm text-gray-400 py-8 text-center">Ładowanie...</div>
        ) : (
          <>
            {/* Default weekly hours */}
            <div className="bg-white rounded-xl border p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Domyślne godziny pracy</h2>
              <DefaultHoursTable
                machineId={selectedMachine}
                defaults={defaults}
                onSaved={() => { fetchData(); showToast('Zapisano godziny pracy', 'success') }}
                onError={(msg) => showToast(msg, 'error')}
              />
            </div>

            {/* Overrides */}
            <div className="bg-white rounded-xl border p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Wyjątki (święta, przestoje)</h2>
              <OverridesManager
                machineId={selectedMachine}
                overrides={overrides}
                onChanged={() => { fetchData(); showToast('Zapisano wyjątek', 'success') }}
                onError={(msg) => showToast(msg, 'error')}
              />
            </div>
          </>
        )}
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </main>
  )
}

export default function SettingsPage() {
  return (
    <ErrorBoundary>
      <SettingsPageInner />
    </ErrorBoundary>
  )
}
