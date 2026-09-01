import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFiltersStore = defineStore('filters', () => {
  const minigameKey = ref(null)
  const controlType = ref(null)
  const dateRange = ref(null)
  const completedOnly = ref(false)

  const queryParams = computed(() => {
    const params = {}
    if (minigameKey.value) params.minigame_key = minigameKey.value
    if (controlType.value) params.control_type = controlType.value
    if (completedOnly.value) params.completed = true
    if (dateRange.value?.start) params.start_date = dateRange.value.start
    if (dateRange.value?.end) params.end_date = dateRange.value.end
    return params
  })

  function resetFilters() {
    minigameKey.value = null
    controlType.value = null
    dateRange.value = null
    completedOnly.value = false
  }

  return { minigameKey, controlType, dateRange, completedOnly, queryParams, resetFilters }
})
