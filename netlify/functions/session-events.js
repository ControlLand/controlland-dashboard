import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Missing Supabase configuration')
  return createClient(url, key)
}

const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export async function handler(event) {
  try {
    const params = event.queryStringParameters || {}
    if (!params.session_id) return json(400, { error: 'session_id required' })

    let query = getSupabase()
      .from('gameplay_events')
      .select('seq, event_type, t_ms, level, payload')
      .eq('session_id', params.session_id)
      .order('seq', { ascending: true })
      .limit(5000)

    if (params.types) query = query.in('event_type', params.types.split(',').filter(Boolean))

    const { data, error } = await query
    if (error) return json(500, { error: error.message })
    return json(200, data || [])
  } catch (err) {
    return json(500, { error: err.message })
  }
}
