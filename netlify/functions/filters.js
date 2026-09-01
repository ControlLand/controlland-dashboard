import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Missing Supabase configuration')
  return createClient(url, key)
}

export async function handler() {
  try {
    const supabase = getSupabase()
    const { data: sessions } = await supabase.from('game_sessions').select('minigame_key, control_type')
    const minigames = [...new Set((sessions || []).map(s => s.minigame_key).filter(Boolean))].sort()
    const controlTypes = [...new Set((sessions || []).map(s => s.control_type).filter(Boolean))].sort()
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ minigames, control_types: controlTypes }) }
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) }
  }
}
