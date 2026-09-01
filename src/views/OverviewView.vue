<script setup>
import { ref, computed, onMounted, watch, shallowRef } from 'vue'
import { useFiltersStore } from '../stores/filters'
import { fetchOverview, fetchSessions } from '../lib/api'
import { exportAllSessions } from '../lib/export'
import KpiCard from '../components/KpiCard.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent, MarkPointComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent, MarkPointComponent])

const filters = useFiltersStore()
const data = ref(null)
const loading = ref(true)
const error = ref(null)
const exporting = ref(false)

async function handleExportAll() {
  exporting.value = true
  try {
    const result = await fetchSessions({ ...filters.queryParams, page: 1, page_size: 10000 })
    exportAllSessions(result.data || [])
  } catch (e) {
    alert('Error al exportar: ' + e.message)
  } finally {
    exporting.value = false
  }
}

const CT_COLORS = ['#4477AA', '#EE6677', '#228833', '#CCBB44']

async function loadData() {
  loading.value = true
  error.value = null
  try {
    data.value = await fetchOverview(filters.queryParams)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch(() => filters.queryParams, loadData, { deep: true })

const kpis = computed(() => {
  if (!data.value) return []
  const s = data.value.summary
  return [
    { label: 'Participantes', value: s?.total_players ?? '—', icon: 'users' },
    { label: 'Sesiones', value: s?.total_sessions ?? '—', icon: 'sessions' },
    { label: 'Tasa de completitud', value: s?.completion_rate != null ? `${(s.completion_rate * 100).toFixed(1)}%` : '—', icon: 'check' },
    { label: 'Puntuación promedio', value: s?.avg_score != null ? Math.round(s.avg_score).toLocaleString('es-MX') : '—', icon: 'star' },
  ]
})

const timelineOption = computed(() => {
  const tl = data.value?.timeline
  if (!tl || !tl.dates?.length) return null
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 40, bottom: 60 },
    xAxis: {
      type: 'category',
      data: tl.dates,
      axisLabel: { fontSize: 11 },
      boundaryGap: true,
    },
    yAxis: {
      type: 'value',
      name: 'Sesiones',
      nameTextStyle: { fontSize: 12 },
      axisLabel: { fontSize: 11 },
      minInterval: 1,
    },
    series: [{
      name: 'Sesiones por día',
      type: 'line',
      data: tl.counts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      areaStyle: { opacity: 0.15 },
      lineStyle: { width: 2 },
      itemStyle: { color: '#14c35e' },
      markPoint: tl.dates.length === 1 ? {
        data: [{ type: 'max', name: 'Máximo' }],
        symbolSize: 50,
      } : undefined,
    }],
    dataZoom: tl.dates.length > 10 ? [{ type: 'inside' }, { type: 'slider', height: 20, bottom: 8 }] : undefined,
  }
})

const perfOption = computed(() => {
  const perf = data.value?.performance
  if (!perf || !perf.control_types?.length) return null
  const controlTypes = perf.control_types
  const metrics = perf.metrics || {}
  const metricKeys = Object.keys(metrics)

  const series = controlTypes.map((ct, i) => ({
    name: ct,
    type: 'bar',
    data: metricKeys.map(mk => metrics[mk]?.[ct] ?? 0),
    itemStyle: { color: CT_COLORS[i % CT_COLORS.length], borderRadius: [4, 4, 0, 0] },
    barMaxWidth: 40,
    label: { show: controlTypes.length === 1, position: 'top', fontSize: 11 },
  }))

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: controlTypes, top: 0, textStyle: { fontSize: 12 } },
    grid: { left: 60, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: metricKeys.map(mk => metricLabels[mk] || mk),
      axisLabel: { fontSize: 11, interval: 0 },
    },
    yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
    series,
  }
})

const metricLabels = {
  avg_score: 'Puntuación prom.',
  avg_errors: 'Errores prom.',
  avg_successes: 'Aciertos prom.',
  avg_duration: 'Duración prom. (s)',
  avg_gems: 'Gemas prom.',
  avg_max_streak: 'Racha máx. prom.',
  completion_rate: 'Tasa completitud',
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
      Error al cargar datos: {{ error }}
    </div>

    <div v-if="loading" class="grid grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="bg-white rounded-xl p-5 animate-pulse h-28" />
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-800">Resumen General</h2>
        <button
          @click="handleExportAll"
          :disabled="exporting"
          class="flex items-center gap-2 text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {{ exporting ? 'Exportando...' : 'Exportar XLSX' }}
        </button>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <KpiCard v-for="kpi in kpis" :key="kpi.label" v-bind="kpi" />
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">Volumen de sesiones en el tiempo</h3>
        <div v-if="timelineOption" style="height: 280px;">
          <v-chart :option="timelineOption" autoresize style="width: 100%; height: 100%;" />
        </div>
        <div v-else class="h-40 flex items-center justify-center text-slate-400 text-sm">
          Sin datos de sesiones aún
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <h3 class="text-sm font-semibold text-slate-700 mb-4">Comparación de rendimiento por tipo de control</h3>
        <div v-if="perfOption" style="height: 320px;">
          <v-chart :option="perfOption" autoresize style="width: 100%; height: 100%;" />
        </div>
        <div v-else class="h-40 flex items-center justify-center text-slate-400 text-sm">
          Sin datos de rendimiento aún
        </div>
      </div>

      <div v-if="data?.minigame_summary?.length" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100">
          <h3 class="text-sm font-semibold text-slate-700">Resumen por minijuego</h3>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wider">
              <th class="px-5 py-3">Minijuego</th>
              <th class="px-5 py-3">Sesiones</th>
              <th class="px-5 py-3">Jugadores</th>
              <th class="px-5 py-3">Puntaje prom.</th>
              <th class="px-5 py-3">Completitud</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data.minigame_summary" :key="row.minigame_key" class="border-t border-slate-100 hover:bg-slate-50">
              <td class="px-5 py-3 font-medium text-slate-800">{{ row.minigame_key }}</td>
              <td class="px-5 py-3 text-slate-600">{{ row.session_count }}</td>
              <td class="px-5 py-3 text-slate-600">{{ row.player_count }}</td>
              <td class="px-5 py-3 text-slate-600">{{ row.avg_score?.toFixed(1) ?? '—' }}</td>
              <td class="px-5 py-3 text-slate-600">{{ row.completion_rate != null ? (row.completion_rate * 100).toFixed(1) + '%' : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
