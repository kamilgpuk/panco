'use client'

import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Options = {
  machineIds: string[]
  onRefresh: () => void
  onExternalChange?: (msg: string) => void
}

export function useRealtimeSync({ machineIds, onRefresh, onExternalChange }: Options) {
  const onRefreshRef = useRef(onRefresh)
  const onExternalChangeRef = useRef(onExternalChange)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    onExternalChangeRef.current = onExternalChange
  }, [onExternalChange])

  const handleChange = useCallback(() => {
    onRefreshRef.current()
    onExternalChangeRef.current?.('Dane zostały zaktualizowane')
  }, [])

  useEffect(() => {
    const channels = machineIds.map(machineId => {
      const tasksCh = supabase
        .channel(`rt-tasks-${machineId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `machine_id=eq.${machineId}`,
        }, handleChange)
        .subscribe()

      const overridesCh = supabase
        .channel(`rt-overrides-${machineId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'machine_schedule_overrides',
          filter: `machine_id=eq.${machineId}`,
        }, handleChange)
        .subscribe()

      return [tasksCh, overridesCh]
    })

    return () => {
      channels.flat().forEach(ch => ch.unsubscribe())
    }
  }, [machineIds, handleChange])
}
