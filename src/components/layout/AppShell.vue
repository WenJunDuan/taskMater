<script setup lang="ts">
interface NavItem {
  label: string
  icon?: string
  badge?: number
  active?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: '导航',
    items: [
      { label: '仪表盘', icon: '🏠', active: true },
      { label: '项目空间', icon: '📁' },
      { label: '任务视图', icon: '🗂️' },
      { label: '知识库', icon: '🧠' },
    ],
  },
  {
    title: '项目',
    items: [
      { label: '任务大师重构', badge: 12 },
      { label: 'AI 协作助手', badge: 7 },
      { label: '用户调研计划', badge: 3 },
    ],
  },
  {
    title: '快速操作',
    items: [
      { label: '新建任务', icon: '＋' },
      { label: '新建项目', icon: '🛠️' },
      { label: '导入数据', icon: '⬆️' },
    ],
  },
]
</script>

<template>
  <div class="app-shell">
    <aside class="app-shell__sidebar">
      <header class="sidebar__brand">Task Master</header>
      <nav class="sidebar__nav">
        <section v-for="section in navSections" :key="section.title" class="sidebar__section">
          <h3 class="sidebar__section-title">{{ section.title }}</h3>
          <ul>
            <li
              v-for="item in section.items"
              :key="item.label"
              :class="['sidebar__item', { 'sidebar__item--active': item.active }]"
            >
              <span class="sidebar__item-icon" v-if="item.icon">{{ item.icon }}</span>
              <span class="sidebar__item-label">{{ item.label }}</span>
              <span v-if="item.badge" class="sidebar__item-badge">{{ item.badge }}</span>
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
  font-size: 1.25rem;
  font-weight: 700;
  padding: 0 0.5rem;
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

.sidebar__section-title {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  padding: 0 0.5rem;
}

.sidebar__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  font-size: 1rem;
}

.sidebar__item-label {
  flex: 1;
}

.sidebar__item-badge {
  min-width: 1.5rem;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.24);
  font-size: 0.7rem;
  font-weight: 600;
  color: #475569;
  text-align: center;
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
    min-width: 180px;
  }
}
</style>
