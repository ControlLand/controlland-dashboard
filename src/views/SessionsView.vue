<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useFiltersStore } from '../stores/filters'
import { fetchSessions, exportCSV } from '../lib/api'

const filters = useFiltersStore()
const sessions = ref([])
const loading = ref(true)
const error = ref(null)
const page = ref(1)
const pageSize = 25
const totalCount = ref(0)
const sortCol = ref('started_at')
const sortDir = ref('desc')
const search = ref('')

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const params = {
      ...filters.queryParams,
      page: page.value,
      page_size: pageSize,
      sort: sortCol.value,
      order: sortDir.value,
    }
    if (search.value) params.search = search.value
    const result = await fetchSessions(params)
    sessions.value = result.data || []
    totalCount.value = result.total || 0
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch(() => [filters.queryParams, page.value, sortCol.value, sortDir.value], loadData, { deep: true })

function toggleSort(col) {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortCol.value = col
    sortDir.value = 'desc'
  }
}

function sortIcon(col) {
  if (sortCol.value !== col) return '↕'
  return sortDir.value === 'asc' ? '↑' : '↓'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

function handleExport() {
  exportCSV('/sessions', filters.queryParams)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por jugador o minijuego..."
          class="text-sm border border-slate-200 rounded-lg px-3 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-brand-500"
          @input="page = 1"
        />
        <span class="text-sm text-slate-500">{{ totalCount.toLocaleString('es-MX') }} sesiones</span>
      </div>
      <button
        @click="handleExport"
        class="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium"
      >
        Exportar CSV
      </button>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
      {{ error }}
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div v-if="loading" class="p-12 text-center text-slate-400">
        <div class="animate-pulse text-sm">Cargando sesiones...</div>
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-wider">
            <th class="px-4 py-3 cursor-pointer hover:text-slate-700" @click="toggleSort('started_at')">
              Fecha {{ sortIcon('started_at') }}
            </th>
            <th class="px-4 py-3">Jugador</th>
            <th class="px-4 py-3 cursor-pointer hover:text-slate-700" @click="toggleSort('minigame_key')">
              Minijuego {{ sortIcon('minigame_key') }}
            </th>
            <th class="px-4 py-3">Control</th>
            <th class="px-4 py-3 cursor-pointer hover:text-slate-700" @click="toggleSort('score')">
              Puntaje {{ sortIcon('score') }}
            </th>
            <th class="px-4 py-3">Aciertos</th>
            <th class="px-4 py-3">Errores</th>
            <th class="px-4 py-3">Nivel</th>
            <th class="px-4 py-3">Racha</th>
            <th class="px-4 py-3">Duración</th>
            <th class="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sessions" :key="s.id" class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3 text-slate-600 whitespace-nowrap">{{ formatDate(s.started_at) }}</td>
            <td class="px-4 py-3 font-medium text-slate-800">{{ s.player_name || s.player_id?.slice(0, 8) }}</td>
            <td class="px-4 py-3 text-slate-700">{{ s.minigame_key }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {{ s.control_type || '—' }}
              </span>
            </td>
            <td class="px-4 py-3 font-semibold text-slate-800">{{ s.score?.toLocaleString('es-MX') ?? '—' }}</td>
            <td class="px-4 py-3 text-emerald-600">{{ s.successes ?? '—' }}</td>
            <td class="px-4 py-3 text-red-500">{{ s.errors ?? '—' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ s.level_reached ?? '—' }}</td>
            <td class="px-4 py-3 text-amber-600 font-medium">{{ s.max_streak ?? '—' }}</td>
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
          <tr v-if="sessions.length === 0">
            <td colspan="11" class="px-4 py-12 text-center text-slate-400">No se encontraron sesiones</td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <button
          @click="page = Math.max(1, page - 1)"
          :disabled="page <= 1"
          class="text-sm px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
        >
          Anterior
        </button>
        <span class="text-sm text-slate-500">Página {{ page }} de {{ totalPages }}</span>
        <button
          @click="page = Math.min(totalPages, page + 1)"
          :disabled="page >= totalPages"
          class="text-sm px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>
