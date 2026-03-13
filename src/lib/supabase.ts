import { createClient } from '@supabase/supabase-js'

export type Machine = {
  id: string
  name: string
  created_at: string
}

export type ScheduleDefault = {
  id: string
  machine_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_working: boolean
}

export type ScheduleOverride = {
  id: string
  machine_id: string
  date: string
  start_time: string | null
  end_time: string | null
  is_working: boolean
}

export type Task = {
  id: string
  machine_id: string
  title: string
  duration_min: number
  position: number
  created_at: string
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
