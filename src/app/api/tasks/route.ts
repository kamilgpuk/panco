import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const machineId = req.nextUrl.searchParams.get('machine_id')
  if (!machineId) return NextResponse.json({ error: 'machine_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('machine_id', machineId)
    .order('position')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { machine_id, title, duration_min, position } = await req.json()

  // Shift existing tasks down to make room
  const { data: existing } = await supabase
    .from('tasks')
    .select('id, position')
    .eq('machine_id', machine_id)
    .gte('position', position ?? 999)
    .order('position', { ascending: false })

  if (existing && existing.length > 0) {
    for (const t of existing) {
      await supabase.from('tasks').update({ position: t.position + 1 }).eq('id', t.id)
    }
  }

  const { data: maxPos } = await supabase
    .from('tasks')
    .select('position')
    .eq('machine_id', machine_id)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const finalPosition = position ?? ((maxPos?.position ?? -1) + 1)

  const { data, error } = await supabase
    .from('tasks')
    .insert({ machine_id, title, duration_min, position: finalPosition })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
