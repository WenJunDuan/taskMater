<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { todoItems } from '@/data/todos'
import { projectSummaries } from '@/data/projects'
import type { TodoItem, TodoStatus } from '@/types/todo'

type TodoWithProject = TodoItem & { projectName: string }

const route = useRoute()
const router = useRouter()

const statusConfigs: { status: TodoStatus; label: string; tone: string; accent: string }[] = [
  { status: 'todo', label: '待处理', tone: 'todo-badge todo-badge--todo', accent: 'status-accent status-accent--todo' },
  { status: 'in-progress', label: '进行中', tone: 'todo-badge todo-badge--progress', accent: 'status-accent status-accent--progress' },
  { status: 'done', label: '已完成', tone: 'todo-badge todo-badge--done', accent: 'status-accent status-accent--done' },
]

const priorityConfigs: Record<TodoItem['priority'], { label: string; tone: string }> = {
  high: { label: '高', tone: 'priority priority--high' },
  medium: { label: '中', tone: 'priority priority--medium' },
  low: { label: '低', tone: 'priority priority--low' },
}

const tasks = ref<TodoWithProject[]>(
  todoItems.map((item) => ({
    ...item,
    projectName: projectSummaries.find((project) => project.id === item.projectId)?.name ?? '未分配项目',
  })),
)

const normalizeProjectId = (value: unknown): string | 'all' => {
  if (typeof value === 'string' && value.trim()) return value
  return 'all'
}

const selectedProjectId = ref<string | 'all'>(normalizeProjectId(route.query.projectId))

watch(
  () => route.query.projectId,
  (value) => {
    const normalized = normalizeProjectId(value)
    if (normalized !== selectedProjectId.value) {
      selectedProjectId.value = normalized
    }
  },
)

watch(selectedProjectId, (value) => {
  const current = normalizeProjectId(route.query.projectId)
  if (value === current) return

  if (value === 'all') {
    const { projectId, ...rest } = route.query
    router.replace({ query: rest })
    return
  }
  router.replace({ query: { ...route.query, projectId: value } })
})

const projectOptions = computed(() => [
  { value: 'all', label: '全部项目' },
  ...projectSummaries.map((project) => ({ value: project.id, label: project.name })),
])

const filteredTasks = computed(() => {
  if (selectedProjectId.value === 'all') return tasks.value
  return tasks.value.filter((task) => task.projectId === selectedProjectId.value)
})

const groupedTasks = computed(() =>
  statusConfigs
    .map((config) => ({
      ...config,
      items: filteredTasks.value.filter((task) => task.status === config.status),
    }))
    .filter((section) => section.items.length > 0),
)

const selectedIds = ref<string[]>([])

watch(filteredTasks, (items) => {
  const visibleIds = new Set(items.map((item) => item.id))
  selectedIds.value = selectedIds.value.filter((id) => visibleIds.has(id))
})

const selectedCount = computed(() => selectedIds.value.length)

const isAllSelected = computed(
  () => filteredTasks.value.length > 0 && filteredTasks.value.every((item) => selectedIds.value.includes(item.id)),
)

const isIndeterminate = computed(
  () => selectedCount.value > 0 && !isAllSelected.value,
)

const toggleItemSelection = (id: string, checked: boolean) => {
  const set = new Set(selectedIds.value)
  if (checked) {
    set.add(id)
  } else {
    set.delete(id)
  }
  selectedIds.value = Array.from(set)
}

const toggleAllSelection = (checked: boolean) => {
  if (!checked) {
    selectedIds.value = []
    return
  }
  selectedIds.value = filteredTasks.value.map((item) => item.id)
}

const clearSelection = () => {
  selectedIds.value = []
  dueDateDraft.value = ''
}

const updateSelectedTasks = (updater: (task: TodoWithProject) => TodoWithProject) => {
  if (!selectedIds.value.length) return
  const set = new Set(selectedIds.value)
  tasks.value = tasks.value.map((task) => (set.has(task.id) ? updater(task) : task))
}

const markSelectedDone = () => {
  updateSelectedTasks((task) => ({ ...task, status: 'done' }))
  clearSelection()
}

const addDays = (input: string | undefined, days: number) => {
  const base = input ? new Date(input) : new Date()
  if (Number.isNaN(base.getTime())) return input ?? ''
  base.setDate(base.getDate() + days)
  return base.toISOString().slice(0, 10)
}

const delaySelected = () => {
  updateSelectedTasks((task) => ({ ...task, dueDate: addDays(task.dueDate, 1) }))
  clearSelection()
}

const dueDateDraft = ref('')

const applyDueDate = () => {
  if (!dueDateDraft.value) return
  updateSelectedTasks((task) => ({ ...task, dueDate: dueDateDraft.value }))
  clearSelection()
}

const totalCount = computed(() => filteredTasks.value.length)
const inProgressCount = computed(() => filteredTasks.value.filter((item) => item.status === 'in-progress').length)
const doneCount = computed(() => filteredTasks.value.filter((item) => item.status === 'done').length)
const completionRate = computed(() => {
  if (!totalCount.value) return '0%'
  return `${Math.round((doneCount.value / totalCount.value) * 100)}%`
})

const formatDate = (input?: string) => {
  if (!input) return '未设定'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return input
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date)
}
</script>

<template>
  <div class="todo-view">
    <header class="todo-header">
      <div class="todo-header__text">
        <h1>待办清单</h1>
        <p>按照状态与项目维度，集中管理团队的关键待办事项。</p>
      </div>
      <div class="todo-header__filters">
        <label class="todo-filter">
          <span>所属项目</span>
          <select v-model="selectedProjectId">
            <option v-for="option in projectOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <section class="todo-metrics">
      <article class="metric-card">
        <h3>待办总量</h3>
        <strong>{{ totalCount }}</strong>
      </article>
      <article class="metric-card">
        <h3>进行中</h3>
        <strong>{{ inProgressCount }}</strong>
      </article>
      <article class="metric-card">
        <h3>已完成</h3>
        <strong>{{ doneCount }}</strong>
      </article>
      <article class="metric-card">
        <h3>完成率</h3>
        <strong>{{ completionRate }}</strong>
      </article>
    </section>

    <section class="todo-actions" v-if="filteredTasks.length">
      <label class="todo-actions__select-all">
        <input
          type="checkbox"
          :checked="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="toggleAllSelection(($event.target as HTMLInputElement).checked)"
        />
        <span>全选当前列表</span>
      </label>
      <div class="todo-actions__bulk" v-if="selectedCount">
        <span class="todo-actions__count">已选 {{ selectedCount }}</span>
        <button type="button" class="todo-button" @click="markSelectedDone">标记完成</button>
        <button type="button" class="todo-button" @click="delaySelected">延后一天</button>
        <label class="todo-actions__date">
          <span>截止日期</span>
          <input type="date" v-model="dueDateDraft" />
        </label>
        <button type="button" class="todo-button" :disabled="!dueDateDraft" @click="applyDueDate">应用</button>
        <button type="button" class="todo-button todo-button--ghost" @click="clearSelection">取消选择</button>
      </div>
    </section>

    <section v-if="groupedTasks.length" class="todo-section-list">
      <article v-for="section in groupedTasks" :key="section.status" class="todo-section">
        <header class="todo-section__header">
          <div class="todo-section__title">
            <span :class="section.accent" />
            <h2>{{ section.label }}</h2>
            <span class="todo-section__count">{{ section.items.length }}</span>
          </div>
        </header>

        <ul class="todo-table">
          <li v-for="item in section.items" :key="item.id" class="todo-row">
            <label class="todo-row__checkbox">
              <input
                type="checkbox"
                :checked="selectedIds.includes(item.id)"
                @change="toggleItemSelection(item.id, ($event.target as HTMLInputElement).checked)"
              />
            </label>
            <div class="todo-row__main">
              <div class="todo-row__title">
                <span class="todo-row__title-text">{{ item.title }}</span>
                <span class="todo-row__project">{{ item.projectName }}</span>
              </div>
              <p v-if="item.description" class="todo-row__desc">{{ item.description }}</p>
            </div>
            <div class="todo-row__meta">
              <span :class="priorityConfigs[item.priority].tone">{{ priorityConfigs[item.priority].label }}</span>
              <span class="todo-row__due">{{ formatDate(item.dueDate) }}</span>
            </div>
          </li>
        </ul>
      </article>
    </section>

    <section v-else class="todo-empty">
      <h2>暂无待办事项</h2>
      <p>可以从项目空间创建新的任务或调整筛选条件。</p>
    </section>
  </div>
</template>

<style scoped>
.todo-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.todo-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}

.todo-header__text h1 {
  font-size: 1.9rem;
  font-weight: 700;
  color: #0f172a;
}

.todo-header__text p {
  margin-top: 0.4rem;
  color: #64748b;
}

.todo-header__filters {
  display: flex;
  gap: 1rem;
}

.todo-filter {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #475569;
}

.todo-filter select {
  min-width: 200px;
  padding: 0.5rem 0.75rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: #ffffff;
  color: #0f172a;
  font-size: 0.88rem;
}

.todo-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.metric-card {
  background: #ffffff;
  border-radius: 0.9rem;
  padding: 1rem;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-card h3 {
  font-size: 0.82rem;
  color: #64748b;
}

.metric-card strong {
  font-size: 1.6rem;
  font-weight: 600;
  color: #0f172a;
}

.todo-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 0.9rem;
  background: #edf2ff;
  border: 1px solid rgba(37, 99, 235, 0.2);
}

.todo-actions__select-all {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #1d4ed8;
}

.todo-actions__bulk {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.todo-actions__count {
  font-size: 0.85rem;
  color: #0f172a;
  font-weight: 600;
}

.todo-actions__date {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #475569;
}

.todo-actions__date input {
  padding: 0.4rem 0.6rem;
  border-radius: 0.6rem;
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.todo-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.9rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(37, 99, 235, 0.35);
  background: #1d4ed8;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.2s ease;
}

.todo-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.todo-button:not(:disabled):hover {
  background: #1e40af;
  transform: translateY(-1px);
}

.todo-button--ghost {
  background: transparent;
  color: #1d4ed8;
}

.todo-section-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.todo-section {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.todo-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.todo-section__title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.todo-section__title h2 {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0f172a;
}

.todo-section__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6rem;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
  font-size: 0.72rem;
  font-weight: 600;
}

.todo-table {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.todo-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
  padding: 0.75rem 1rem;
  border-radius: 0.9rem;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.todo-row__checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.todo-row__main {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.todo-row__title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.92rem;
  color: #0f172a;
  font-weight: 600;
}

.todo-row__project {
  font-size: 0.75rem;
  color: #64748b;
  background: rgba(148, 163, 184, 0.16);
  padding: 0.1rem 0.5rem;
  border-radius: 0.65rem;
}

.todo-row__desc {
  font-size: 0.78rem;
  color: #64748b;
}

.todo-row__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #475569;
}

.todo-row__due {
  font-weight: 600;
  color: #1d4ed8;
}

.todo-empty {
  padding: 3rem;
  border-radius: 1.1rem;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.06);
  color: #475569;
}

.todo-empty h2 {
  font-size: 1.4rem;
  font-weight: 600;
  color: #0f172a;
}

.todo-empty p {
  margin-top: 0.5rem;
}

.todo-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.todo-badge--todo {
  background: rgba(250, 204, 21, 0.15);
  color: #b45309;
}

.todo-badge--progress {
  background: rgba(37, 99, 235, 0.15);
  color: #1d4ed8;
}

.todo-badge--done {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.priority {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.2rem;
  padding: 0.15rem 0.45rem;
  border-radius: 0.65rem;
  font-size: 0.72rem;
  font-weight: 600;
}

.priority--high {
  background: rgba(248, 113, 113, 0.22);
  color: #b91c1c;
}

.priority--medium {
  background: rgba(251, 191, 36, 0.22);
  color: #b45309;
}

.priority--low {
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
}

.status-accent {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

.status-accent--todo {
  background: #facc15;
}

.status-accent--progress {
  background: #2563eb;
}

.status-accent--done {
  background: #22c55e;
}

@media (max-width: 960px) {
  .todo-row {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
  }
  .todo-row__meta {
    flex-direction: row;
    justify-content: flex-start;
    gap: 0.6rem;
    grid-column: 2 / -1;
  }
}
</style>
