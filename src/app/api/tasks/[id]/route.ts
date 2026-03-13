import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabase
    .from('tasks')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Get task info first for reordering
  const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single()
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Shift tasks up to close the gap
  const { data: above } = await supabase
    .from('tasks')
    .select('id, position')
    .eq('machine_id', task.machine_id)
    .gt('position', task.position)
    .order('position')

  if (above) {
    for (const t of above) {
      await supabase.from('tasks').update({ position: t.position - 1 }).eq('id', t.id)
    }
  }

  return NextResponse.json({ ok: true })
}
