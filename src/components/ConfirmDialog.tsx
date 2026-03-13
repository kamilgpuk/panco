'use client'

import { useEffect } from 'react'

type Props = {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, destructive = true }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-white rounded-xl p-6 w-80 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg py-2 text-sm font-medium text-white transition-colors ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  )
}
