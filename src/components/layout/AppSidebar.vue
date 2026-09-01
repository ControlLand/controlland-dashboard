<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const route = useRoute()

watch(() => route.path, () => emit('close'))

const navItems = [
  { name: 'overview', path: '/', label: 'Resumen', icon: 'chart-bar' },
  { name: 'sessions', path: '/sesiones', label: 'Sesiones', icon: 'table' },
  { name: 'players', path: '/jugadores', label: 'Jugadores', icon: 'users' },
]

function isActive(item) {
  if (item.path === '/') return route.path === '/'
  return route.path.startsWith(item.path)
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-30 bg-black/50 md:hidden" @click="emit('close')" />

  <aside
    class="fixed inset-y-0 left-0 z-40 w-64 bg-sidebar flex flex-col transform transition-transform duration-200 md:static md:translate-x-0 md:z-auto"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="px-6 py-5 border-b border-white/10 flex items-center justify-between">
      <div>
        <h1 class="text-white text-lg font-bold tracking-tight">ControlLand</h1>
        <p class="text-slate-400 text-xs mt-0.5">Panel de Investigación</p>
      </div>
      <button class="md:hidden text-slate-400 hover:text-white" @click="emit('close')" aria-label="Cerrar menú">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-1">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="isActive(item)
          ? 'bg-brand-600 text-white'
          : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'"
      >
        <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path v-if="item.icon === 'chart-bar'" stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          <path v-else-if="item.icon === 'table'" stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-12.75c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-12.75c0-.621-.504-1.125-1.125-1.125m-18.375 2.625h7.5c.621 0 1.125-.504 1.125-1.125m0 0h9.75v9.75" />
          <path v-else-if="item.icon === 'users'" stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
        {{ item.label }}
      </router-link>
    </nav>

    <div class="px-4 py-3 border-t border-white/10">
      <p class="text-slate-500 text-[10px] uppercase tracking-wider">Estudio PhD</p>
      <p class="text-slate-400 text-xs mt-0.5">Control & Motor</p>
    </div>
  </aside>
</template>
