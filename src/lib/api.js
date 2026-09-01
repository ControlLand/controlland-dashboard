const BASE = '/.netlify/functions'

async function request(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`, window.location.origin)
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined) url.searchParams.set(key, String(val))
  })

  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json()
}

export function fetchOverview() {
  return request('/overview')
}

export function fetchSessions(params) {
  return request('/sessions', params)
}

export function fetchPlayers(params) {
  return request('/players', params)
}

export function fetchPlayerSessions(playerId, params) {
  return request('/player-sessions', { ...params, player_id: playerId })
}

export function fetchSessionEvents(sessionId) {
  return request('/session-events', { session_id: sessionId })
}

export function fetchFilters() {
  return request('/filters')
}

export function exportCSV(endpoint, params) {
  const url = new URL(`${BASE}${endpoint}`, window.location.origin)
  url.searchParams.set('format', 'csv')
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined) url.searchParams.set(key, String(val))
  })
  window.open(url, '_blank')
}
