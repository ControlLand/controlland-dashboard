<script setup>
import { ref, onMounted } from 'vue'
import { useFiltersStore } from '../../stores/filters'
import { fetchFilters } from '../../lib/api'

const filters = useFiltersStore()
const availableMinigames = ref([])
const availableControls = ref([])

onMounted(async () => {
  try {
    const data = await fetchFilters()
    availableMinigames.value = data.minigames || []
    availableControls.value = data.control_types || []
  } catch {
    // filters endpoint not critical
  }
})
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0">
    <div class="flex items-center gap-3">
      <h2 class="text-sm font-semibold text-slate-700">{{ $route.meta.title }}</h2>
    </div>

    <div class="flex-1" />

    <div class="flex items-center gap-3">
      <select
        v-model="filters.minigameKey"
        class="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option :value="null">Todos los minijuegos</option>
        <option v-for="m in availableMinigames" :key="m" :value="m">{{ m }}</option>
      </select>

      <select
        v-model="filters.controlType"
        class="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option :value="null">Todos los controles</option>
        <option v-for="c in availableControls" :key="c" :value="c">{{ c }}</option>
      </select>

      <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          v-model="filters.completedOnly"
          class="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        Solo completadas
      </label>

      <button
        @click="filters.resetFilters()"
        class="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
      >
        Limpiar filtros
      </button>
    </div>
  </header>
</template>
