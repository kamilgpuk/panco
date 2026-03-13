import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const machineId = req.nextUrl.searchParams.get('machine_id')
  let query = supabase.from('machine_schedule_defaults').select('*').order('day_of_week')
  if (machineId) query = query.eq('machine_id', machineId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('machine_schedule_defaults')
    .upsert(body, { onConflict: 'machine_id,day_of_week' })
    .select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
