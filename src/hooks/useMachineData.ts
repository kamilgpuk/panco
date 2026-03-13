'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, Task, ScheduleDefault, ScheduleOverride } from '@/lib/supabase'
import { computeSchedule, ScheduledTask } from '@/lib/scheduler'

export function useMachineData(machineId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [defaults, setDefaults] = useState<ScheduleDefault[]>([])
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([])
  const [scheduled, setScheduled] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const refreshRef = useRef(0)

  const fetchAll = useCallback(async () => {
    const [tasksRes, defaultsRes, overridesRes] = await Promise.all([
      fetch(`/api/tasks?machine_id=${machineId}`).then(r => r.json()),
      fetch(`/api/working-hours/defaults?machine_id=${machineId}`).then(r => r.json()),
      fetch(`/api/working-hours/overrides?machine_id=${machineId}`).then(r => r.json()),
    ])
    setTasks(tasksRes)
    setDefaults(defaultsRes)
    setOverrides(overridesRes)
    setScheduled(computeSchedule(tasksRes, defaultsRes, overridesRes))
    setLoading(false)
  }, [machineId])

  // Trigger fetch by incrementing the ref counter
  const refresh = useCallback(() => {
    refreshRef.current += 1
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const [tasksRes, defaultsRes, overridesRes] = await Promise.all([
        fetch(`/api/tasks?machine_id=${machineId}`).then(r => r.json()),
        fetch(`/api/working-hours/defaults?machine_id=${machineId}`).then(r => r.json()),
        fetch(`/api/working-hours/overrides?machine_id=${machineId}`).then(r => r.json()),
      ])
      if (cancelled) return
      setTasks(tasksRes)
      setDefaults(defaultsRes)
      setOverrides(overridesRes)
      setScheduled(computeSchedule(tasksRes, defaultsRes, overridesRes))
      setLoading(false)
    }
    load()

    // Real-time subscriptions
    const tasksSub = supabase
      .channel(`tasks:${machineId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `machine_id=eq.${machineId}`,
      }, () => fetchAll())
      .subscribe()

    const overridesSub = supabase
      .channel(`overrides:${machineId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'machine_schedule_overrides',
        filter: `machine_id=eq.${machineId}`,
      }, () => fetchAll())
      .subscribe()

    return () => {
      cancelled = true
      tasksSub.unsubscribe()
      overridesSub.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machineId])

  return { tasks, defaults, overrides, scheduled, loading, refresh }
}
