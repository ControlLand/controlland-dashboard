import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'overview',
    component: () => import('../views/OverviewView.vue'),
    meta: { title: 'Resumen General' },
  },
  {
    path: '/sesiones',
    name: 'sessions',
    component: () => import('../views/SessionsView.vue'),
    meta: { title: 'Explorador de Sesiones' },
  },
  {
    path: '/jugadores',
    name: 'players',
    component: () => import('../views/PlayersView.vue'),
    meta: { title: 'Análisis de Jugadores' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  document.title = `${to.meta.title} — ControlLand`
})

export default router
