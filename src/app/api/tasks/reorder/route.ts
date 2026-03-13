import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Receives ordered array of task ids, reassigns positions 0..n
// Two-pass update to avoid unique(machine_id, position) constraint violations
export async function POST(req: NextRequest) {
  const { task_ids } = await req.json()

  // Pass 1: shift all to large temporary positions (avoids mid-loop collisions)
  for (let i = 0; i < task_ids.length; i++) {
    const { error } = await supabase
      .from('tasks')
      .update({ position: 10000 + i })
      .eq('id', task_ids[i])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Pass 2: set final positions
  for (let i = 0; i < task_ids.length; i++) {
    const { error } = await supabase
      .from('tasks')
      .update({ position: i })
      .eq('id', task_ids[i])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
