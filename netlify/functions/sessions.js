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

    let query = supabase.from('game_sessions').select('*, profiles(display_name)', { count: 'exact' })
    query = applyFilters(query, params)

    if (params.search) {
      query = query.or(`profiles.display_name.ilike.%${params.search}%,minigame_key.ilike.%${params.search}%`)
    }

    const allowedSorts = ['started_at', 'score', 'minigame_key', 'level_reached', 'duration_seconds']
    const sortCol = allowedSorts.includes(params.sort) ? params.sort : 'started_at'
    query = query.order(sortCol, { ascending: params.order === 'asc' })

    const page = parseInt(params.page) || 1
    const pageSize = Math.min(parseInt(params.page_size) || 25, 100)
    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)

    const { data, error, count } = await query
    if (error) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: error.message }) }

    if (params.format === 'csv') {
      const rows = data.map(s => ({
        id: s.id, player: s.profiles?.display_name || s.player_id, minigame: s.minigame_key,
        control_type: s.control_type, score: s.score, successes: s.successes, errors: s.errors,
        gems: s.gems, max_streak: s.max_streak, level_reached: s.level_reached,
        duration_seconds: s.duration_seconds, completed: s.completed, started_at: s.started_at,
      }))
      const headers = rows.length ? Object.keys(rows[0]) : []
      const csvLines = [headers.join(','), ...rows.map(r => headers.map(h => {
        const v = r[h]
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''
      }).join(','))]
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="sesiones.csv"' },
        body: csvLines.join('\n'),
      }
    }

    const result = {
      data: data.map(s => ({ ...s, player_name: s.profiles?.display_name })),
      total: count || 0,
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) }
  }
}
