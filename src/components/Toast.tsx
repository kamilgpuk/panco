'use client'

import { useEffect } from 'react'

type ToastType = 'info' | 'error' | 'success'

type Props = {
  message: string
  type?: ToastType
  onDismiss: () => void
}

const COLORS: Record<ToastType, string> = {
  info: 'bg-blue-600',
  error: 'bg-red-600',
  success: 'bg-green-600',
}

export function Toast({ message, type = 'info', onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium max-w-xs ${COLORS[type]}`}>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-75 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  )
}

export type ToastItem = {
  id: number
  message: string
  type: ToastType
}
