<script setup>
import { ref } from 'vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import TopBar from './components/layout/TopBar.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="flex flex-1 flex-col overflow-hidden">
      <TopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 overflow-y-auto p-4 md:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
