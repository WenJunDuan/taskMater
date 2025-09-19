<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import type { ProjectStatus } from "@/data/projects"
import { projectSummaries } from "@/data/projects"

const statusLabels: Record<ProjectStatus, string> = {
  active: "进行中",
  planning: "规划中",
  "on-hold": "暂停",
}

const statusTone: Record<ProjectStatus, string> = {
  active: "status-pill status-pill--active",
  planning: "status-pill status-pill--planning",
  "on-hold": "status-pill status-pill--hold",
}

const route = useRoute()
const router = useRouter()

const filterStatus = ref<ProjectStatus | "all">("all")
const expandedProjectIds = ref<string[]>([])

const filteredProjects = computed(() => {
  if (filterStatus.value === "all") return projectSummaries
  return projectSummaries.filter((project) => project.status === filterStatus.value)
})

const metrics = computed(() => {
  const total = projectSummaries.length
  const activeCount = projectSummaries.filter((p) => p.status === "active").length
  const upcomingDue = projectSummaries
    .filter((p) => p.status !== "on-hold")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3)
    .map((p) => ({ id: p.id, name: p.name, dueDate: p.dueDate }))
  const avgProgress = Math.round(
    projectSummaries.reduce((acc, item) => acc + item.progress, 0) / Math.max(total, 1),
  )

  return { total, activeCount, avgProgress, upcomingDue }
})

const isExpanded = (id: string) => expandedProjectIds.value.includes(id)

const toggleProject = (id: string) => {
  if (isExpanded(id)) {
    expandedProjectIds.value = expandedProjectIds.value.filter((item) => item !== id)
  } else {
    expandedProjectIds.value = [...expandedProjectIds.value, id]
  }
}

const expandProject = (id: string | undefined) => {
  if (!id) return
  if (!isExpanded(id)) {
    expandedProjectIds.value = [...expandedProjectIds.value, id]
  }
  nextTick(() => {
    const element = document.querySelector(`[data-project-id="${id}"]`)
    element?.scrollIntoView({ behavior: "smooth", block: "start" })
  })
}

const handleFocusFromRoute = (focusId: unknown) => {
  const id = Array.isArray(focusId) ? focusId[0] : focusId
  if (typeof id !== "string" || !id) return
  expandProject(id)
  router.replace({ query: { ...route.query, focus: undefined } })
}

watch(
  () => route.query.focus,
  (value) => {
    handleFocusFromRoute(value)
  },
  { immediate: true },
)

onMounted(() => {
  expandedProjectIds.value = projectSummaries.slice(0, 2).map((item) => item.id)
})
</script>

<template>
  <div class="projects-view">
    <header class="projects-header">
      <div>
        <h1>项目空间</h1>
        <p>追踪团队关键项目，聚焦进展与风险。</p>
      </div>
      <div class="projects-metrics">
        <div class="metric-card">
          <span class="metric-label">总项目</span>
          <span class="metric-value">{{ metrics.total }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">进行中</span>
          <span class="metric-value metric-value--positive">{{ metrics.activeCount }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">平均进度</span>
          <span class="metric-value">{{ metrics.avgProgress }}%</span>
        </div>
      </div>
    </header>

    <section class="projects-toolbar">
      <div class="filter-group">
        <button
          class="filter-chip"
          :class="{ 'filter-chip--active': filterStatus === 'all' }"
          @click="filterStatus = 'all'"
        >
          全部
        </button>
        <button
          class="filter-chip"
          :class="{ 'filter-chip--active': filterStatus === 'active' }"
          @click="filterStatus = 'active'"
        >
          进行中
        </button>
        <button
          class="filter-chip"
          :class="{ 'filter-chip--active': filterStatus === 'planning' }"
          @click="filterStatus = 'planning'"
        >
          规划中
        </button>
        <button
          class="filter-chip"
          :class="{ 'filter-chip--active': filterStatus === 'on-hold' }"
          @click="filterStatus = 'on-hold'"
        >
          暂停
        </button>
      </div>

      <div class="upcoming-list">
        <h2>近期节点</h2>
        <ul>
          <li v-for="item in metrics.upcomingDue" :key="item.id">
            <span class="upcoming-name">{{ item.name }}</span>
            <span class="upcoming-date">{{ item.dueDate }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section class="projects-grid">
      <article
        v-for="project in filteredProjects"
        :key="project.id"
        :data-project-id="project.id"
        class="project-card"
      >
        <header class="project-card__header">
          <div>
            <h3>{{ project.name }}</h3>
            <p>{{ project.description }}</p>
          </div>
          <button
            type="button"
            class="project-card__toggle"
            @click="toggleProject(project.id)"
            :aria-expanded="isExpanded(project.id)"
          >
            {{ isExpanded(project.id) ? '收起' : '展开' }}
          </button>
        </header>

        <div class="project-card__meta">
          <span :class="statusTone[project.status]">{{ statusLabels[project.status] }}</span>
  active: "status-pill status-pill--active",
  planning: "status-pill status-pill--planning",
  "on-hold": "status-pill status-pill--hold",
        </div>

        <transition name="project-collapse">
          <div v-show="isExpanded(project.id)" class="project-card__body">
            <div class="project-card__stats">
              <div>
                <span class="stat-label">迭代</span>
                <span class="stat-value">{{ project.sprintCount }}</span>
              </div>
              <div>
                <span class="stat-label">待办</span>
                <span class="stat-value">{{ project.backlogCount }}</span>
              </div>
              <div>
                <span class="stat-label">最近更新</span>
                <span class="stat-value">{{ project.lastUpdate }}</span>
              </div>
            </div>
            <div class="project-card__tags">
              <span v-for="tag in project.tags" :key="tag" class="project-tag">#{{ tag }}</span>
            </div>
          </div>
        </transition>
      </article>
    </section>
  </div>
</template>

<style scoped>
.projects-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.projects-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
}

.projects-header p {
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.95rem;
}

.projects-metrics {
  display: flex;
  gap: 1rem;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 1rem;
  border-radius: 0.9rem;
  background: #ffffff;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
  min-width: 120px;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
}

.metric-value--positive {
  color: #16a34a;
}

.projects-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 280px);
  gap: 1.5rem;
}

.filter-group {
  display: inline-flex;
  gap: 0.75rem;
  align-items: center;
}

.filter-chip {
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #ffffff;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.filter-chip--active {
  border-color: rgba(37, 99, 235, 0.4);
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.12);
}

.filter-chip:not(.filter-chip--active):hover {
  background: rgba(148, 163, 184, 0.12);
}

.upcoming-list {
  background: #ffffff;
  border-radius: 0.9rem;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
  padding: 1rem 1.25rem;
}

.upcoming-list h2 {
  font-size: 0.9rem;
  color: #475569;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.upcoming-list ul {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upcoming-name {
  font-weight: 600;
  color: #1f2937;
}

.upcoming-date {
  font-size: 0.8rem;
  color: #64748b;
  margin-left: 0.5rem;
}

.projects-grid {
  display: grid;
  gap: 1rem;
}

.project-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-card__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.project-card__header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}

.project-card__header p {
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.85rem;
}

.project-card__toggle {
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(248, 250, 252, 0.9);
  font-size: 0.75rem;
  color: #475569;
  transition: all 0.2s ease;
}

.project-card__toggle:hover {
  background: rgba(37, 99, 235, 0.12);
  border-color: rgba(37, 99, 235, 0.32);
  color: #1d4ed8;
}

.project-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #475569;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pill--active {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.status-pill--planning {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.status-pill--hold {
  background: rgba(148, 163, 184, 0.16);
  color: #475569;
}

.project-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.project-card__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.stat-value {
  display: block;
  margin-top: 0.35rem;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.project-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-tag {
  padding: 0.2rem 0.6rem;
  background: rgba(148, 163, 184, 0.16);
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #475569;
}

.project-collapse-enter-active,
.project-collapse-leave-active {
  transition: all 0.2s ease;
}

.project-collapse-enter-from,
.project-collapse-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 1024px) {
  .projects-header {
    flex-direction: column;
  }
  .projects-toolbar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .projects-metrics {
    flex-wrap: wrap;
  }
  .project-card {
    padding: 1rem 1.25rem;
  }
}
</style>

