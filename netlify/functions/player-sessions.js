import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Missing Supabase configuration')
  return createClient(url, key)
}

export async function handler(event) {
  try {
    const supabase = getSupabase()
    const params = event.queryStringParameters || {}
    const playerId = params.player_id
    if (!playerId) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'player_id required' }) }

    let query = supabase.from('game_sessions').select('*').eq('player_id', playerId)
    if (params.minigame_key) query = query.eq('minigame_key', params.minigame_key)
    if (params.control_type) query = query.eq('control_type', params.control_type)
    if (params.completed === 'true') query = query.eq('completed', true)

    query = query.order('started_at', { ascending: true })
    const { data, error } = await query
    if (error) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: error.message }) }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || []) }
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) }
  }
}
