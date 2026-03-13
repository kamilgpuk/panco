'use client'

import Link from 'next/link'

const MONTH_NAMES_PL = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
]

export type ViewDays = 1 | 3 | 7

function formatDate(date: Date, viewDays: ViewDays): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dayDiff = Math.round((d.getTime() - today.getTime()) / 86400000)

  if (viewDays === 1) {
    const dayStr = `${date.getDate()} ${MONTH_NAMES_PL[date.getMonth()]} ${date.getFullYear()}`
    if (dayDiff === 0) return `Dziś, ${dayStr}`
    if (dayDiff === -1) return `Wczoraj, ${dayStr}`
    if (dayDiff === 1) return `Jutro, ${dayStr}`
    return dayStr
  }

  // Multi-day: show range
  const end = new Date(date)
  end.setDate(end.getDate() + viewDays - 1)
  if (dayDiff === 0) return `Dziś — ${end.getDate()} ${MONTH_NAMES_PL[end.getMonth()]}`
  return `${date.getDate()} ${MONTH_NAMES_PL[date.getMonth()]} — ${end.getDate()} ${MONTH_NAMES_PL[end.getMonth()]}`
}

type Props = {
  currentDate: Date
  viewDays: ViewDays
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (v: ViewDays) => void
}

export function CalendarHeader({ currentDate, viewDays, onPrev, onNext, onToday, onViewChange }: Props) {
  return (
    <div className="flex items-center justify-between bg-white border-b px-4 py-3 flex-shrink-0 gap-4">
      <div className="flex items-center gap-1">
        <h1 className="text-lg font-bold text-gray-900 mr-3">Panco</h1>
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="Poprzedni">←</button>
        <button onClick={onToday} className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors mx-1">Dziś</button>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="Następny">→</button>
      </div>

      <span className="text-base font-medium text-gray-800 flex-1 text-center">
        {formatDate(currentDate, viewDays)}
      </span>

      <div className="flex items-center gap-2">
        {/* View mode selector */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {([1, 3, 7] as ViewDays[]).map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 font-medium transition-colors ${viewDays === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {v === 1 ? 'Dzień' : v === 3 ? '3 dni' : 'Tydzień'}
            </button>
          ))}
        </div>

        <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-900 border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
          ⚙ Ustawienia
        </Link>
      </div>
    </div>
  )
}
