import * as XLSX from 'xlsx'
import { metricColumns, metricCells } from './minigameMetrics'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

export function exportAllSessions(sessions, filename = 'controlland_sesiones.xlsx') {
  const columns = metricColumns(sessions)
  const rows = sessions.map(s => ({
    'Jugador': s.player_name || s.player_id,
    'Minijuego': s.minigame_key,
    'Tipo de control': s.control_type || '',
    'Puntaje': s.score ?? 0,
    'Aciertos': s.successes ?? 0,
    'Errores': s.errors ?? 0,
    'Gemas': s.gems ?? 0,
    'Racha máxima': s.max_streak ?? 0,
    'Nivel alcanzado': s.level_reached ?? '',
    'Duración (s)': s.duration_seconds ? Math.round(s.duration_seconds * 100) / 100 : '',
    'Completada': s.completed ? 'Sí' : 'No',
    'Fecha de inicio': formatDate(s.started_at),
    'Fecha de fin': formatDate(s.ended_at),
    'Dispositivo': s.device_model || '',
    'Versión': s.app_version || '',
    ...metricCells(s, columns),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 10 },
    ...columns.map(c => ({ wch: Math.min(Math.max(c.header.length, 12), 40) })),
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sesiones')
  XLSX.writeFile(wb, filename)
}

export function exportPlayerData(player, sessions, filename) {
  const wb = XLSX.utils.book_new()

  const summaryRows = [{
    'Jugador': player.display_name || 'Sin nombre',
    'ID': player.id,
    'Total de sesiones': player.session_count,
    'Puntaje promedio': player.avg_score?.toFixed(2) ?? '',
    'Gemas totales': player.total_gems ?? 0,
    'Tasa de completitud': player.completion_rate != null ? `${(player.completion_rate * 100).toFixed(1)}%` : '',
    'Primera sesión': formatDate(player.first_session),
    'Última sesión': formatDate(player.last_session),
  }]
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 18 }, { wch: 36 }, { wch: 15 }, { wch: 16 }, { wch: 13 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen')

  const columns = metricColumns(sessions)
  const sessionRows = sessions.map((s, i) => ({
    '#': i + 1,
    'Minijuego': s.minigame_key,
    'Tipo de control': s.control_type || '',
    'Puntaje': s.score ?? 0,
    'Aciertos': s.successes ?? 0,
    'Errores': s.errors ?? 0,
    'Gemas': s.gems ?? 0,
    'Racha máxima': s.max_streak ?? 0,
    'Nivel alcanzado': s.level_reached ?? '',
    'Duración (s)': s.duration_seconds ? Math.round(s.duration_seconds * 100) / 100 : '',
    'Completada': s.completed ? 'Sí' : 'No',
    'Fecha': formatDate(s.started_at),
    ...metricCells(s, columns),
  }))
  const wsSessions = XLSX.utils.json_to_sheet(sessionRows)
  wsSessions['!cols'] = [
    { wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    { wch: 12 }, { wch: 18 },
    ...columns.map(c => ({ wch: Math.min(Math.max(c.header.length, 12), 40) })),
  ]
  XLSX.utils.book_append_sheet(wb, wsSessions, 'Sesiones')

  const name = (player.display_name || player.id.slice(0, 8)).replace(/[^a-zA-Z0-9_-]/g, '_')
  XLSX.writeFile(wb, filename || `controlland_${name}.xlsx`)
}
