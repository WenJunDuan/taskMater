<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ClipboardDocumentListIcon,
  HomeIcon,
  PlusCircleIcon,
  BoltIcon,
  Squares2X2Icon,
} from '@heroicons/vue/24/outline'

interface NavItem {
  label: string
  icon?: Component
  path?: string
  action?: () => void
}

interface NavSection {
  title: string
  items: NavItem[]
}

const emit = defineEmits<{
  (e: 'navigate-home'): void
  (e: 'open-create-task'): void
  (e: 'open-create-project'): void
}>()

const router = useRouter()
const route = useRoute()

const navSections = computed<NavSection[]>(() => [
  {
    title: '导航',
    items: [
      { label: '仪表盘', icon: HomeIcon, path: '/' },
      { label: '项目空间', icon: Squares2X2Icon, path: '/projects' },
      { label: '待办清单', icon: ClipboardDocumentListIcon, path: '/todos' },
    ],
  },
  {
    title: '快捷操作',
    items: [
      { label: '新建任务', icon: PlusCircleIcon, action: () => emit('open-create-task') },
      { label: '新建项目', icon: BoltIcon, action: () => emit('open-create-project') },
    ],
  },
])

const handleBrandClick = () => {
  emit('navigate-home')
  if (route.path !== '/') {
    router.push({ name: 'dashboard' })
  }
}

const normalizePath = (path?: string) => path?.split('?')[0] ?? null

const isActive = (item: NavItem) => {
  if (!item.path) return false

  const target = normalizePath(item.path)
  return target ? target === route.path : false
}

const handleNavItem = (item: NavItem) => {
  if (item.path) {
    router.push(item.path)
    return
  }
  item.action?.()
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-shell__sidebar">
      <header class="sidebar__brand" @click="handleBrandClick">
        <div class="brand-icon">TM</div>
        <span class="brand-title">Task Master</span>
      </header>
      <nav class="sidebar__nav">
        <section v-for="section in navSections" :key="section.title" class="sidebar__section">
          <div class="sidebar__section-header">
            <h3 class="sidebar__section-title">{{ section.title }}</h3>
          </div>
          <ul>
            <li
              v-for="item in section.items"
              :key="item.label"
              :class="['sidebar__item', { 'sidebar__item--active': isActive(item) }]"
              @click="handleNavItem(item)"
            >
              <component v-if="item.icon" :is="item.icon" class="sidebar__item-icon" />
              <span class="sidebar__item-label">{{ item.label }}</span>
            </li>
          </ul>
        </section>
      </nav>
    </aside>

    <main class="app-shell__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
}

.app-shell__sidebar {
  background: #ffffff;
  border-right: 1px solid rgba(15, 23, 42, 0.08);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.9rem;
  transition: background 0.2s ease, transform 0.2s ease;
  cursor: pointer;
}

.sidebar__brand:hover {
  background: rgba(37, 99, 235, 0.12);
  transform: translateY(-1px);
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 70%);
  color: #ffffff;
  font-weight: 700;
  font-size: 1rem;
}

.brand-title {
  font-weight: 700;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar__section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 0.5rem;
}

.sidebar__section-title {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.88rem;
  color: #1e293b;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.sidebar__item:hover {
  background-color: rgba(148, 163, 184, 0.12);
}

.sidebar__item--active {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-weight: 600;
}

.sidebar__item-icon {
  width: 1.15rem;
  height: 1.15rem;
  color: #475569;
}

.sidebar__item--active .sidebar__item-icon {
  color: #1d4ed8;
}

.sidebar__item-label {
  flex: 1;
}

.app-shell__main {
  padding: 2rem 2.5rem;
  overflow: auto;
}

@media (max-width: 960px) {
  .app-shell {
    grid-template-columns: 220px 1fr;
  }
  .app-shell__main {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
  .app-shell__sidebar {
    position: sticky;
    top: 0;
    z-index: 2;
    flex-direction: row;
    align-items: center;
    overflow-x: auto;
    gap: 1rem;
  }
  .sidebar__nav {
    flex-direction: row;
    gap: 1rem;
  }
  .sidebar__section {
    min-width: 200px;
  }
}
</style>
