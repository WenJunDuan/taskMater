<script setup lang="ts">
import { computed, ref, type Component } from "vue"
import { useRoute, useRouter } from "vue-router"
import {
  BoltIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  InboxArrowDownIcon,
  PlusCircleIcon,
  Squares2X2Icon,
} from "@heroicons/vue/24/outline"
import { projectSummaries } from "@/data/projects"

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

const MAX_PROJECT_DISPLAY = 5

const emit = defineEmits<{
  (e: "navigate-home"): void
}>()

const router = useRouter()
const route = useRoute()

const collapsedSections = ref<Record<string, boolean>>({ 项目: false })

const projectTotal = computed(() => projectSummaries.length)

const projectNavItems = computed<NavItem[]>(() => {
  const base = projectSummaries.slice(0, MAX_PROJECT_DISPLAY).map<NavItem>((project) => ({
    label: project.name,
    path: `/projects?focus=${project.id}`,
  }))

  if (projectTotal.value > MAX_PROJECT_DISPLAY) {
    base.push({
      label: `查看全部项目 (${projectTotal.value})`,
      path: "/projects",
    })
  }

  return base
})

const navSections = computed<NavSection[]>(() => [
  {
    title: "导航",
    items: [
      { label: "仪表盘", icon: HomeIcon, path: "/" },
      { label: "项目空间", icon: Squares2X2Icon, path: "/projects" },
      { label: "任务视图", icon: ClipboardDocumentListIcon, path: "/task-view" },
    ],
  },
  {
    title: "项目",
    items: collapsedSections.value["项目"] ? [] : projectNavItems.value,
  },
  {
    title: "快捷操作",
    items: [
      { label: "创建待办", icon: PlusCircleIcon },
      { label: "新建项目", icon: BoltIcon },
      { label: "收集反馈", icon: InboxArrowDownIcon },
    ],
  },
])

const handleBrandClick = () => {
  emit("navigate-home")
  if (route.path !== "/") {
    router.push({ name: "dashboard" })
  }
}

const normalizePath = (path?: string) => path?.split("?")[0] ?? null

const isActive = (item: NavItem) => {
  const current = route.path
  const target = normalizePath(item.path)
  return target ? target === current : false
}

const handleNavItem = (item: NavItem) => {
  if (item.path) {
    router.push(item.path)
    return
  }
  item.action?.()
}

const isSectionCollapsed = (title: string) => collapsedSections.value[title] ?? false

const toggleSection = (title: string) => {
  if (!(title in collapsedSections.value)) return
  collapsedSections.value = {
    ...collapsedSections.value,
    [title]: !collapsedSections.value[title],
  }
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
          <div
            class="sidebar__section-header"
            :class="{ 'sidebar__section-header--clickable': section.title === '项目' }"
            @click="section.title === '项目' && toggleSection(section.title)"
          >
            <h3 class="sidebar__section-title">{{ section.title }}</h3>
            <template v-if="section.title === '项目'">
              <ChevronDownIcon
                class="sidebar__section-toggle"
                :class="{ 'sidebar__section-toggle--collapsed': isSectionCollapsed(section.title) }"
              />
            </template>
          </div>
          <ul v-show="section.title !== '项目' || !isSectionCollapsed(section.title)">
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
  font-size: 1.15rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  border-radius: 0.9rem;
  transition: background 0.2s ease, transform 0.2s ease;
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

.sidebar__section-header--clickable {
  cursor: pointer;
}

.sidebar__section-header--clickable:hover .sidebar__section-title {
  color: #1d4ed8;
}

.sidebar__section-title {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
}

.sidebar__section-toggle {
  width: 1rem;
  height: 1rem;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.sidebar__section-toggle--collapsed {
  transform: rotate(-90deg);
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
