<script setup>
import { computed } from 'vue'
import { minigameDef, formatMetric } from '../lib/minigameMetrics'

const props = defineProps({
  a: { type: Object, required: true },
  b: { type: Object, required: true },
  numberA: Number,
  numberB: Number,
})

const num = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 })
const signed = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1, signDisplay: 'exceptZero' })

function accuracy(s) {
  const total = (s.successes ?? 0) + (s.errors ?? 0)
  return total > 0 ? (s.successes ?? 0) / total : null
}

// better: which direction counts as an improvement (null = no judgement, e.g. duration)
const METRICS = [
  { label: 'Puntaje', value: s => s.score, better: 'higher' },
  { label: 'Aciertos', value: s => s.successes, better: 'higher' },
  { label: 'Errores', value: s => s.errors, better: 'lower' },
  {
    label: 'Precisión',
    value: accuracy,
    better: 'higher',
    format: v => `${num.format(v * 100)}%`,
    formatDelta: d => `${signed.format(d * 100)} pp`,
    relative: false,
  },
  { label: 'Gemas', value: s => s.gems, better: 'higher' },
  { label: 'Racha máxima', value: s => s.max_streak, better: 'higher' },
  { label: 'Nivel alcanzado', value: s => s.level_reached, better: 'higher' },
  {
    label: 'Duración',
    value: s => s.duration_seconds,
    better: null,
    format: v => `${Math.round(v)}s`,
    formatDelta: d => `${signed.format(Math.round(d))}s`,
  },
]

function minigameMetrics() {
  if (props.a.minigame_key !== props.b.minigame_key) return []
  const def = minigameDef(props.a.minigame_key)
  if (!def || !props.a.metrics || !props.b.metrics) return []
  return def.metrics.map(m => ({
    label: `${def.code} · ${m.label}`,
    value: m.value,
    better: m.better || null,
    format: v => formatMetric(m, v),
    ...(m.percent ? { formatDelta: d => `${signed.format(d * 100)} pp`, relative: false } : {}),
  }))
}

const rows = computed(() => [...METRICS, ...minigameMetrics()].map(m => {
  const va = m.value(props.a) ?? null
  const vb = m.value(props.b) ?? null
  const format = m.format || (v => num.format(v))
  const row = {
    label: m.label,
    a: va == null ? '—' : format(va),
    b: vb == null ? '—' : format(vb),
    delta: '—',
    pct: null,
    tone: 'neutral',
  }
  if (va == null || vb == null) return row

  const d = vb - va
  const changed = Math.abs(d) > 1e-9
  row.delta = (m.formatDelta || (x => signed.format(x)))(changed ? d : 0)
  if (changed && m.relative !== false && va !== 0) row.pct = `${signed.format((d / Math.abs(va)) * 100)}%`
  if (changed && m.better) row.tone = (d > 0) === (m.better === 'higher') ? 'better' : 'worse'
  return row
}))

const toneClass = {
  better: 'text-emerald-600',
  worse: 'text-red-500',
  neutral: 'text-slate-500',
}

const differentMinigame = computed(() => props.a.minigame_key !== props.b.minigame_key)
const differentControl = computed(() => (props.a.control_type || null) !== (props.b.control_type || null))

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100">
      <h3 class="text-sm font-semibold text-slate-700">Comparación de sesiones</h3>
    </div>

    <div class="grid grid-cols-2 gap-3 px-4 sm:px-5 pt-4">
      <div v-for="(s, i) in [a, b]" :key="s.id" class="rounded-lg bg-slate-50 px-3 py-2.5 min-w-0">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-brand-600 text-white text-xs font-bold">
            {{ i === 0 ? 'A' : 'B' }}
          </span>
          <span class="text-sm font-medium text-slate-800">Sesión {{ i === 0 ? numberA : numberB }}</span>
        </div>
        <div class="text-xs text-slate-500 mt-1">{{ formatDate(s.started_at) }}</div>
        <div class="text-xs text-slate-600 mt-0.5 truncate">
          {{ s.minigame_key }} · {{ s.control_type || '—' }} · {{ s.completed ? 'Completada' : 'Incompleta' }}
        </div>
      </div>
    </div>

    <p
      v-if="differentMinigame || differentControl"
      class="mx-4 sm:mx-5 mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800"
    >
      <template v-if="differentMinigame">Las sesiones son de minijuegos distintos; los valores pueden no ser comparables.</template>
      <template v-else>Las sesiones usan tipos de control distintos.</template>
    </p>

    <div class="overflow-x-auto mt-3">
    <table class="w-full text-sm">
      <thead>
        <tr class="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wider">
          <th class="pl-4 sm:pl-5 pr-2 py-2.5">Métrica</th>
          <th class="px-2 sm:px-3 py-2.5 text-right">A</th>
          <th class="px-2 sm:px-3 py-2.5 text-right">B</th>
          <th class="pl-2 pr-4 sm:pr-5 py-2.5 text-right">Diferencia</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label" class="border-t border-slate-100">
          <td class="pl-4 sm:pl-5 pr-2 py-2.5 text-slate-700">{{ row.label }}</td>
          <td class="px-2 sm:px-3 py-2.5 text-right text-slate-600 tabular-nums whitespace-nowrap">{{ row.a }}</td>
          <td class="px-2 sm:px-3 py-2.5 text-right text-slate-800 font-medium tabular-nums whitespace-nowrap">{{ row.b }}</td>
          <td class="pl-2 pr-4 sm:pr-5 py-2.5 text-right tabular-nums" :class="toneClass[row.tone]">
            <span class="font-semibold whitespace-nowrap">{{ row.delta }}</span>
            <span v-if="row.pct" class="block sm:inline sm:ml-1 text-xs opacity-80 whitespace-nowrap">({{ row.pct }})</span>
          </td>
        </tr>
      </tbody>
    </table>
    </div>

    <p class="px-4 sm:px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
      Diferencia = B − A. Verde indica mejora y rojo retroceso (en errores, bajar es mejora).
    </p>
  </div>
</template>
