<script setup>
import { ref, onMounted } from 'vue'
import { useFiltersStore } from '../../stores/filters'
import { fetchFilters } from '../../lib/api'

defineEmits(['toggle-sidebar'])

const filters = useFiltersStore()
const availableMinigames = ref([])
const availableControls = ref([])
const filtersOpen = ref(false)

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
  <header class="bg-white border-b border-slate-200 shrink-0">
    <div class="h-14 md:h-16 flex items-center px-4 md:px-6 gap-3">
      <button class="md:hidden text-slate-600 hover:text-slate-800" @click="$emit('toggle-sidebar')" aria-label="Abrir menú">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <h2 class="text-sm font-semibold text-slate-700 truncate">{{ $route.meta.title }}</h2>

      <div class="flex-1" />

      <!-- Desktop filters -->
      <div class="hidden lg:flex items-center gap-3">
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

        <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            v-model="filters.completedOnly"
            class="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Solo completadas
        </label>

        <button
          @click="filters.resetFilters()"
          class="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 whitespace-nowrap"
        >
          Limpiar filtros
        </button>
      </div>

      <!-- Mobile filters toggle -->
      <button
        class="lg:hidden flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5"
        @click="filtersOpen = !filtersOpen"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
        </svg>
        Filtros
      </button>
    </div>

    <!-- Mobile filters panel -->
    <div v-if="filtersOpen" class="lg:hidden border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50">
      <select
        v-model="filters.minigameKey"
        class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option :value="null">Todos los minijuegos</option>
        <option v-for="m in availableMinigames" :key="m" :value="m">{{ m }}</option>
      </select>

      <select
        v-model="filters.controlType"
        class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option :value="null">Todos los controles</option>
        <option v-for="c in availableControls" :key="c" :value="c">{{ c }}</option>
      </select>

      <div class="flex items-center justify-between">
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
    </div>
  </header>
</template>
