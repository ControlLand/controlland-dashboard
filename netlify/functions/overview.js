import { createClient } from '@supabase/supabase-js'
import { MINIGAME_METRICS } from '../../src/lib/minigameMetrics.js'

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

    let sessionsQuery = supabase.from('game_sessions').select('*')
    sessionsQuery = applyFilters(sessionsQuery, params)
    const { data: sessions, error } = await sessionsQuery
    if (error) return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: error.message }) }

    const totalPlayers = new Set(sessions.map(s => s.player_id)).size
    const totalSessions = sessions.length
    const completed = sessions.filter(s => s.completed).length
    const completionRate = totalSessions > 0 ? completed / totalSessions : 0
    const avgScore = totalSessions > 0 ? sessions.reduce((a, s) => a + (s.score || 0), 0) / totalSessions : 0

    const byDate = {}
    sessions.forEach(s => {
      const d = s.started_at?.slice(0, 10)
      if (d) byDate[d] = (byDate[d] || 0) + 1
    })
    const sortedDates = Object.keys(byDate).sort()
    const timeline = { dates: sortedDates, counts: sortedDates.map(d => byDate[d]) }

    const controlTypes = [...new Set(sessions.map(s => s.control_type).filter(Boolean))]
    const metricDefs = ['avg_score', 'avg_errors', 'avg_successes', 'avg_duration', 'avg_gems', 'avg_max_streak']
    const metrics = {}
    metricDefs.forEach(m => { metrics[m] = {} })
    controlTypes.forEach(ct => {
      const ctSessions = sessions.filter(s => s.control_type === ct)
      const n = ctSessions.length || 1
      metrics.avg_score[ct] = ctSessions.reduce((a, s) => a + (s.score || 0), 0) / n
      metrics.avg_errors[ct] = ctSessions.reduce((a, s) => a + (s.errors || 0), 0) / n
      metrics.avg_successes[ct] = ctSessions.reduce((a, s) => a + (s.successes || 0), 0) / n
      metrics.avg_duration[ct] = ctSessions.reduce((a, s) => a + (s.duration_seconds || 0), 0) / n
      metrics.avg_gems[ct] = ctSessions.reduce((a, s) => a + (s.gems || 0), 0) / n
      metrics.avg_max_streak[ct] = ctSessions.reduce((a, s) => a + (s.max_streak || 0), 0) / n
    })

    const minigameMap = {}
    sessions.forEach(s => {
      const k = s.minigame_key
      if (!minigameMap[k]) minigameMap[k] = { minigame_key: k, session_count: 0, players: new Set(), total_score: 0, completed: 0 }
      minigameMap[k].session_count++
      minigameMap[k].players.add(s.player_id)
      minigameMap[k].total_score += s.score || 0
      if (s.completed) minigameMap[k].completed++
    })
    const minigameSummary = Object.values(minigameMap).map(m => ({
      minigame_key: m.minigame_key,
      session_count: m.session_count,
      player_count: m.players.size,
      avg_score: m.total_score / m.session_count,
      completion_rate: m.completed / m.session_count,
    }))

    const minigameMetrics = Object.entries(MINIGAME_METRICS).map(([key, def]) => {
      const withMetrics = sessions.filter(s => s.minigame_key === key && s.metrics)
      return {
        minigame_key: key,
        session_count: withMetrics.length,
        metrics: def.metrics.map(m => {
          const values = withMetrics.map(m.value).filter(v => v != null)
          return { key: m.key, avg: values.length ? values.reduce((a, v) => a + v, 0) / values.length : null }
        }),
      }
    }).filter(g => g.session_count > 0)

    const result = {
      summary: { total_players: totalPlayers, total_sessions: totalSessions, completion_rate: completionRate, avg_score: avgScore },
      timeline,
      performance: { control_types: controlTypes, metrics },
      minigame_summary: minigameSummary,
      minigame_metrics: minigameMetrics,
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) }
  }
}
