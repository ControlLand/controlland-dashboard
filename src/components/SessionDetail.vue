<script setup>
import { ref, computed, watch } from 'vue'
import { fetchSessionEvents } from '../lib/api'
import { minigameDef, sessionMetrics, describeEvent, detailEventTypes } from '../lib/minigameMetrics'

const props = defineProps({
  session: { type: Object, required: true },
})

const def = computed(() => minigameDef(props.session.minigame_key))
const metrics = computed(() => sessionMetrics(props.session))
const eventTypes = computed(() => detailEventTypes(props.session.minigame_key))

const events = ref([])
const loading = ref(false)
const error = ref(null)

async function loadEvents() {
  events.value = []
  error.value = null
  if (!eventTypes.value.length || !props.session.metrics) return
  loading.value = true
  try {
    events.value = await fetchSessionEvents(props.session.id, eventTypes.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => props.session.id, loadEvents, { immediate: true })

const rows = computed(() => events.value
  .map(e => ({ ...e, text: describeEvent(props.session.minigame_key, e) }))
  .filter(e => e.text))

function formatTime(msValue) {
  const total = Math.max(0, Math.round((msValue ?? 0) / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!def" class="text-xs text-slate-500">
      Este minijuego todavía no registra datos específicos.
    </div>
    <div v-else-if="!metrics.length" class="text-xs text-slate-500">
      Sin datos de {{ def.code }} en esta sesión (probablemente se jugó con una versión anterior de la app).
    </div>
    <template v-else>
      <div>
        <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{{ def.code }} · {{ def.name }}</h4>
        <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <div v-for="m in metrics" :key="m.key" class="rounded-lg bg-white border border-slate-200 px-3 py-2 min-w-0">
            <dt class="text-xs text-slate-500 leading-tight">{{ m.label }}</dt>
            <dd class="text-base font-semibold text-slate-800 tabular-nums mt-0.5">{{ m.text }}</dd>
          </div>
        </dl>
      </div>

      <div v-if="eventTypes.length">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Registro de acciones</h4>
        <div v-if="loading" class="text-xs text-slate-400 animate-pulse">Cargando acciones...</div>
        <div v-else-if="error" class="text-xs text-red-600">{{ error }}</div>
        <div v-else-if="!rows.length" class="text-xs text-slate-400">Sin acciones registradas.</div>
        <ol v-else class="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          <li v-for="e in rows" :key="e.seq" class="flex gap-3 px-3 py-2 text-xs">
            <span class="text-slate-400 tabular-nums w-10 shrink-0">{{ formatTime(e.t_ms) }}</span>
            <span class="text-slate-500 w-14 shrink-0">Nivel {{ e.level ?? '—' }}</span>
            <span class="text-slate-700">{{ e.text }}</span>
          </li>
        </ol>
      </div>
    </template>
  </div>
</template>
