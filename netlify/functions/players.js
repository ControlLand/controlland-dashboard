import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Missing Supabase configuration')
  return createClient(url, key)
}

function applyFilters(query, params) {
  if (params.minigame_key) query = query.eq('minigame_key', params.minigame_key)
  if (params.control_type) query = query.eq('control_type', params.control_type)
  if (params.completed === 'true') query = query.eq('completed', true)
  if (params.start_date) query = query.gte('started_at', params.start_date)
  if (params.end_date) query = query.lte('started_at', params.end_date)
  return query
}

export async function handler(event) {
  try {
    const supabase = getSupabase()
    const params = event.queryStringParameters || {}

    let sessionsQuery = supabase.from('game_sessions').select('player_id, minigame_key, score, gems, started_at, completed')
    sessionsQuery = applyFilters(sessionsQuery, params)
    const { data: sessions, error } = await sessionsQuery
    if (error) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: error.message }) }

    const { data: profiles } = await supabase.from('profiles').select('id, display_name')
    const profileMap = {}
    ;(profiles || []).forEach(p => { profileMap[p.id] = p.display_name })

    const playerMap = {}
    sessions.forEach(s => {
      if (!playerMap[s.player_id]) {
        playerMap[s.player_id] = { id: s.player_id, display_name: profileMap[s.player_id] || 'Sin nombre', session_count: 0, total_score: 0, total_gems: 0, completed: 0, first_session: s.started_at, last_session: s.started_at }
      }
      const p = playerMap[s.player_id]
      p.session_count++
      p.total_score += s.score || 0
      p.total_gems += s.gems || 0
      if (s.completed) p.completed++
      if (s.started_at < p.first_session) p.first_session = s.started_at
      if (s.started_at > p.last_session) p.last_session = s.started_at
    })

    const players = Object.values(playerMap).map(p => ({
      ...p,
      avg_score: p.total_score / p.session_count,
      completion_rate: p.completed / p.session_count,
    })).sort((a, b) => b.session_count - a.session_count)

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: players }) }
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) }
  }
}
