const num = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 })

const raw = key => s => {
  if (!s?.metrics) return null
  const v = s.metrics[key]
  return typeof v === 'number' ? v : 0
}

const ratio = (numKey, denKey) => s => {
  const n = raw(numKey)(s)
  const d = raw(denKey)(s)
  return n != null && d ? n / d : null
}

const share = (partKey, otherKey) => s => {
  const a = raw(partKey)(s) ?? 0
  const b = raw(otherKey)(s) ?? 0
  return a + b > 0 ? a / (a + b) : null
}

const seconds = v => `${num.format(v)} s`
const percent = v => `${num.format(v * 100)}%`
const ms = v => `${Math.round(v)} ms`

export const MINIGAME_METRICS = {
  'B1-1': {
    code: 'MA2',
    name: 'Recolección inteligente',
    metrics: [
      { key: 'tempting_shown', label: 'Objetos tentadores que aparecieron', value: raw('tempting_shown') },
      { key: 'tempting_inspected', label: 'Objetos tentadores tomados', value: raw('tempting_inspected'), better: 'lower' },
      { key: 'tempting_kept', label: 'Objetos tentadores recogidos', value: raw('tempting_kept'), better: 'lower' },
      { key: 'tempting_kept_rate', label: '% de tentadores recogidos', value: ratio('tempting_kept', 'tempting_shown'), better: 'lower', format: percent, percent: true },
      { key: 'batteries_shown', label: 'Baterías que aparecieron', value: raw('batteries_shown') },
      { key: 'batteries_collected', label: 'Baterías recolectadas', value: raw('batteries_collected'), better: 'higher' },
    ],
    events: {
      tempting_inspected: e => `Tomó un objeto tentador${e.payload?.item ? ` (${e.payload.item})` : ''}`,
      tempting_kept: e => `Recogió un objeto tentador${e.payload?.item ? ` (${e.payload.item})` : ''}`,
    },
  },
  'B1-2': {
    code: 'MA3',
    name: 'Drones aliados',
    metrics: [
      { key: 'enemies_shown', label: 'Drones enemigos que aparecieron', value: raw('enemies_shown') },
      { key: 'enemies_tapped', label: 'Enemigos tocados', value: raw('enemies_tapped'), better: 'higher' },
      { key: 'enemies_missed', label: 'Enemigos dejados pasar', value: raw('enemies_missed'), better: 'lower' },
      { key: 'allies_shown', label: 'Drones aliados que aparecieron', value: raw('allies_shown') },
      { key: 'allies_tapped', label: 'Aliados tocados', value: raw('allies_tapped'), better: 'lower' },
      { key: 'allies_passed', label: 'Aliados dejados pasar', value: raw('allies_passed'), better: 'higher' },
      { key: 'enemy_reaction_ms', label: 'Reacción promedio ante enemigos', value: ratio('enemy_reaction_ms_sum', 'enemies_tapped'), better: 'lower', format: ms },
    ],
    events: {},
  },
  'B1-4': {
    code: 'MA4',
    name: 'Marcha de resistencia',
    metrics: [
      { key: 'marching_seconds', label: 'Tiempo efectivo marchando', value: raw('marching_seconds'), better: 'higher', format: seconds },
      { key: 'stopped_seconds', label: 'Tiempo detenido', value: raw('stopped_seconds'), better: 'lower', format: seconds },
      { key: 'marching_share', label: '% del tiempo marchando', value: share('marching_seconds', 'stopped_seconds'), better: 'higher', format: percent, percent: true },
      { key: 'interruptions', label: 'Interrupciones', value: raw('interruptions'), better: 'lower' },
      { key: 'interruption_seconds', label: 'Duración total de interrupciones', value: raw('interruption_seconds'), better: 'lower', format: seconds },
      { key: 'interruption_avg', label: 'Duración promedio por interrupción', value: ratio('interruption_seconds', 'interruptions'), better: 'lower', format: seconds },
      { key: 'interruption_max_seconds', label: 'Interrupción más larga', value: raw('interruption_max_seconds'), better: 'lower', format: seconds },
    ],
    events: {
      interruption: e => `Interrupción de ${seconds(e.payload?.duration_s ?? 0)}`,
    },
  },
  'B3-3': {
    code: 'MA10',
    name: 'Espera estratégica',
    metrics: [
      { key: 'cash_outs', label: 'Decisiones de cobrar', value: raw('cash_outs'), better: 'lower' },
      { key: 'cash_out_gems', label: 'Gemas cobradas antes de tiempo', value: raw('cash_out_gems') },
      { key: 'cash_out_wait_avg', label: 'Espera promedio antes de cobrar', value: ratio('cash_out_waited_seconds', 'cash_outs'), better: 'higher', format: seconds },
      { key: 'cash_out_required_avg', label: 'Tiempo necesario para la recompensa mayor', value: ratio('cash_out_required_seconds', 'cash_outs'), format: seconds },
      { key: 'levels_waited_full', label: 'Niveles esperando la recompensa mayor', value: raw('levels_waited_full'), better: 'higher' },
      { key: 'levels_with_cash_out', label: 'Niveles con cobro anticipado', value: raw('levels_with_cash_out'), better: 'lower' },
      { key: 'exits_after_cash_out', label: 'Salidas tras cobrar', value: raw('exits_after_cash_out'), better: 'lower' },
    ],
    events: {
      cash_out: e => {
        const p = e.payload || {}
        return `Cobró ${p.gems ?? 0} gemas tras esperar ${seconds(p.waited_s ?? 0)} (necesitaba ${seconds(p.required_s ?? 0)}, faltaban ${seconds(p.missing_s ?? 0)})`
      },
      cash_out_choice: e => (e.payload?.choice === 'exit' ? 'Después de cobrar salió del juego' : 'Después de cobrar siguió jugando'),
      reward_wait: e => {
        const p = e.payload || {}
        return p.cash_outs
          ? `Terminó el nivel con ${p.cash_outs} cobro(s) anticipado(s)`
          : `Esperó la recompensa mayor: ${p.gems_in_box ?? 0} gemas en ${seconds(p.level_time_s ?? 0)}`
      },
    },
  },
}

export function minigameDef(key) {
  return MINIGAME_METRICS[key] || null
}

export function minigameLabel(key) {
  const def = minigameDef(key)
  return def ? `${def.code} · ${def.name}` : key
}

export function formatMetric(metric, value) {
  if (value == null) return '—'
  return (metric.format || (v => num.format(v)))(value)
}

export function sessionMetrics(session) {
  const def = minigameDef(session?.minigame_key)
  if (!def || !session?.metrics) return []
  return def.metrics.map(m => {
    const value = m.value(session)
    return { ...m, raw: value, text: formatMetric(m, value) }
  })
}

export function describeEvent(minigameKey, event) {
  const fn = minigameDef(minigameKey)?.events?.[event.event_type]
  return fn ? fn(event) : null
}

export function detailEventTypes(minigameKey) {
  return Object.keys(minigameDef(minigameKey)?.events || {})
}

export function metricColumns(sessions) {
  const keys = [...new Set(sessions.map(s => s.minigame_key))].filter(k => MINIGAME_METRICS[k]).sort()
  return keys.flatMap(k => MINIGAME_METRICS[k].metrics.map(m => ({
    minigameKey: k,
    header: `${MINIGAME_METRICS[k].code} · ${m.label}`,
    metric: m,
  })))
}

export function metricCells(session, columns) {
  const out = {}
  columns.forEach(c => {
    if (session.minigame_key !== c.minigameKey) { out[c.header] = ''; return }
    const v = c.metric.value(session)
    out[c.header] = v == null ? '' : Math.round(v * (c.metric.percent ? 100 : 1) * 100) / 100
  })
  return out
}
