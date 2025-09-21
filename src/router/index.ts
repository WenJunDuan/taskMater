import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '仪表盘' },
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
    meta: { title: '项目空间' },
  },
  {
    path: '/todos',
    name: 'todos',
    component: () => import('@/views/TodoView.vue'),
    meta: { title: '待办清单' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
