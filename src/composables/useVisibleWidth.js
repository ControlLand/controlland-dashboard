import { ref, onBeforeUnmount } from 'vue'

export function useVisibleWidth() {
  const width = ref(null)
  let observer = null
  let current = null

  function bind(el) {
    if (el === current) return
    observer?.disconnect()
    current = el
    if (!el) return
    observer = new ResizeObserver(() => { width.value = el.clientWidth })
    observer.observe(el)
    width.value = el.clientWidth
  }

  onBeforeUnmount(() => observer?.disconnect())
  return { width, bind }
}
