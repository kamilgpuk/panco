'use client'

const PIXELS_PER_HOUR = 60

type Props = {
  startHour: number // inclusive
  endHour: number   // inclusive (last label shown)
}

export function TimeAxis({ startHour, endHour }: Props) {
  const hours: number[] = []
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h)
  }

  return (
    <div
      className="relative flex-shrink-0 select-none"
      style={{ width: 56, height: (endHour - startHour) * PIXELS_PER_HOUR }}
    >
      {hours.map(h => (
        <div
          key={h}
          className="absolute right-2 text-xs text-gray-400 leading-none"
          style={{ top: (h - startHour) * PIXELS_PER_HOUR - 6 }}
        >
          {String(h).padStart(2, '0')}:00
        </div>
      ))}
    </div>
  )
}
