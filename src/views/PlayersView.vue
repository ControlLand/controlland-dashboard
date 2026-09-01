<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useFiltersStore } from '../stores/filters'
import { fetchPlayers, fetchPlayerSessions } from '../lib/api'
import { exportPlayerData } from '../lib/export'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const filters = useFiltersStore()
const players = ref([])
const loading = ref(true)
const selectedPlayer = ref(null)
const playerSessions = ref([])
const playerLoading = ref(false)
const search = ref('')
const exporting = ref(false)

function handleExportPlayer() {
  if (!selectedPlayer.value) return
  exporting.value = true
  try {
    exportPlayerData(selectedPlayer.value, playerSessions.value)
  } catch (e) {
    alert('Error al exportar: ' + e.message)
  } finally {
    exporting.value = false
  }
}

async function loadPlayers() {
  loading.value = true
  try {
    const result = await fetchPlayers(filters.queryParams)
    players.value = result.data || []
  } catch {
    players.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadPlayers)
watch(() => filters.queryParams, loadPlayers, { deep: true })

const filteredPlayers = computed(() => {
  if (!search.value) return players.value
  const q = search.value.toLowerCase()
  return players.value.filter(p =>
    (p.display_name || '').toLowerCase().includes(q) ||
    p.id?.toLowerCase().includes(q)
  )
})

async function selectPlayer(player) {
  selectedPlayer.value = player
  playerLoading.value = true
  try {
    playerSessions.value = await fetchPlayerSessions(player.id, filters.queryParams)
  } catch {
    playerSessions.value = []
  } finally {
    playerLoading.value = false
  }
}

const learningCurveOption = computed(() => {
  if (!playerSessions.value.length) return {}
  const sorted = [...playerSessions.value].sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Puntaje', 'Aciertos', 'Errores'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: sorted.map((_, i) => `Sesión ${i + 1}`),
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
    series: [
      {
        name: 'Puntaje',
        type: 'line',
        data: sorted.map(s => s.score ?? 0),
        smooth: true,
        itemStyle: { color: '#14c35e' },
      },
      {
        name: 'Aciertos',
        type: 'line',
        data: sorted.map(s => s.successes ?? 0),
        smooth: true,
        itemStyle: { color: '#4477AA' },
      },
      {
        name: 'Errores',
        type: 'line',
        data: sorted.map(s => s.errors ?? 0),
        smooth: true,
        itemStyle: { color: '#EE6677' },
      },
    ],
  }
})

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="flex flex-col md:flex-row gap-6 md:h-full">
    <div class="w-full md:w-80 shrink-0 space-y-4">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar jugador..."
        class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div v-if="loading" class="p-6 text-center text-slate-400 text-sm animate-pulse">
          Cargando jugadores...
        </div>
        <div v-else class="divide-y divide-slate-100 max-h-60 md:max-h-[calc(100vh-260px)] overflow-y-auto">
          <button
            v-for="player in filteredPlayers"
            :key="player.id"
            @click="selectPlayer(player)"
            class="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
            :class="{ 'bg-brand-50 border-l-2 border-l-brand-500': selectedPlayer?.id === player.id }"
          >
            <div class="text-sm font-medium text-slate-800">{{ player.display_name || 'Sin nombre' }}</div>
            <div class="text-xs text-slate-500 mt-0.5">
              {{ player.session_count }} sesiones · {{ formatDate(player.first_session) }}
            </div>
          </button>
          <div v-if="filteredPlayers.length === 0" class="p-6 text-center text-slate-400 text-sm">
            No se encontraron jugadores
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 space-y-4 min-w-0">
      <template v-if="selectedPlayer">
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-slate-800">{{ selectedPlayer.display_name || 'Sin nombre' }}</h3>
              <p class="text-sm text-slate-500">ID: {{ selectedPlayer.id?.slice(0, 12) }}...</p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <div class="flex gap-4 text-sm">
                <div class="text-center">
                  <div class="text-2xl font-bold text-slate-800">{{ selectedPlayer.session_count }}</div>
                  <div class="text-slate-500 text-xs">Sesiones</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-brand-600">{{ selectedPlayer.avg_score?.toFixed(0) ?? '—' }}</div>
                  <div class="text-slate-500 text-xs">Puntaje prom.</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-amber-600">{{ selectedPlayer.total_gems ?? '—' }}</div>
                  <div class="text-slate-500 text-xs">Gemas totales</div>
                </div>
              </div>
              <button
                @click="handleExportPlayer"
                :disabled="exporting || playerLoading"
                class="flex items-center justify-center gap-2 text-sm bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {{ exporting ? 'Exportando...' : 'Exportar' }}
              </button>
            </div>
          </div>

          <div v-if="playerLoading" class="h-64 flex items-center justify-center text-slate-400 text-sm animate-pulse">
            Cargando curva de aprendizaje...
          </div>
          <v-chart v-else-if="playerSessions.length" :option="learningCurveOption" autoresize class="h-64" />
          <div v-else class="h-64 flex items-center justify-center text-slate-400 text-sm">
            Sin datos de sesión para este jugador
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <h3 class="text-sm font-semibold text-slate-700">Historial de sesiones</h3>
          </div>
          <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[640px]">
            <thead>
              <tr class="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wider">
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3">Minijuego</th>
                <th class="px-4 py-3">Control</th>
                <th class="px-4 py-3">Puntaje</th>
                <th class="px-4 py-3">Nivel</th>
                <th class="px-4 py-3">Duración</th>
                <th class="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in playerSessions" :key="s.id" class="border-t border-slate-100">
                <td class="px-4 py-3 text-slate-600">{{ formatDate(s.started_at) }}</td>
                <td class="px-4 py-3 text-slate-700">{{ s.minigame_key }}</td>
                <td class="px-4 py-3 text-slate-600">{{ s.control_type || '—' }}</td>
                <td class="px-4 py-3 font-semibold">{{ s.score?.toLocaleString('es-MX') ?? '—' }}</td>
                <td class="px-4 py-3 text-slate-600">{{ s.level_reached ?? '—' }}</td>
                <td class="px-4 py-3 text-slate-600">{{ s.duration_seconds ? `${Math.round(s.duration_seconds)}s` : '—' }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="s.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ s.completed ? 'Completada' : 'Incompleta' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </template>

      <div v-else class="bg-white rounded-xl border border-slate-200 h-full flex items-center justify-center">
        <div class="text-center text-slate-400">
          <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <p class="text-sm">Selecciona un jugador para ver su análisis</p>
        </div>
      </div>
    </div>
  </div>
</template>
