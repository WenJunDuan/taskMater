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
    path: '/task-view',
    name: 'task-view',
    component: () => import('@/views/PlaceholderView.vue'),
    meta: { title: '任务视图' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router


