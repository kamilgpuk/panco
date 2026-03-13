'use client'

import { useState } from 'react'

type Props = {
  onAdd: (title: string, durationMin: number) => void
}

export function AddTaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [open, setOpen] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const h = parseInt(hours) || 0
    const m = parseInt(minutes) || 0
    const total = h * 60 + m
    if (!title.trim() || total <= 0) return
    onAdd(title.trim(), total)
    setTitle('')
    setHours('')
    setMinutes('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
      >
        + Dodaj zadanie
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-3 bg-gray-50 mb-2">
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Nazwa zadania"
        className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
        autoFocus
      />
      <div className="flex gap-2 mb-2">
        <input
          type="number"
          value={hours}
          onChange={e => setHours(e.target.value)}
          placeholder="godz."
          min="0"
          className="w-1/2 border rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={minutes}
          onChange={e => setMinutes(e.target.value)}
          placeholder="min"
          min="0"
          max="59"
          className="w-1/2 border rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
          Dodaj
        </button>
        <button type="button" onClick={() => setOpen(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-100">
          Anuluj
        </button>
      </div>
    </form>
  )
}
