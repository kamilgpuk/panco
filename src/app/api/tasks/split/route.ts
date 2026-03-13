import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { task_id, first_duration_min } = await req.json()

  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', task_id)
    .single()

  if (fetchError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const remainder = task.duration_min - first_duration_min
  if (remainder <= 0) return NextResponse.json({ error: 'First duration must be less than total' }, { status: 400 })

  // Update current task duration
  await supabase.from('tasks').update({ duration_min: first_duration_min }).eq('id', task_id)

  // Shift all tasks after this one down by 1
  const { data: after } = await supabase
    .from('tasks')
    .select('id, position')
    .eq('machine_id', task.machine_id)
    .gt('position', task.position)
    .order('position', { ascending: false })

  if (after) {
    for (const t of after) {
      await supabase.from('tasks').update({ position: t.position + 1 }).eq('id', t.id)
    }
  }

  // Insert remainder task at position + 1
  const { data: newTask, error: insertError } = await supabase
    .from('tasks')
    .insert({
      machine_id: task.machine_id,
      title: `${task.title} (cd.)`,
      duration_min: remainder,
      position: task.position + 1,
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ original: task, remainder: newTask })
}
