<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { todoItems } from '@/data/todos'
import { projectSummaries } from '@/data/projects'
import type { TodoItem, TodoStatus } from '@/types/todo'

type TodoWithProject = TodoItem & { projectName: string }

type DateEditorState = {
  id: string | null
  delay: number
  date: string
}

type ContextMenuState = {
  visible: boolean
  x: number
  y: number
  itemId: string | null
}

const route = useRoute()
const router = useRouter()

const statusConfigs: { status: TodoStatus; label: string; badge: string; accent: string }[] = [
  { status: 'planned', label: '已规划', badge: 'todo-badge todo-badge--planned', accent: 'status-accent status-accent--planned' },
  { status: 'in-progress', label: '进行中', badge: 'todo-badge todo-badge--progress', accent: 'status-accent status-accent--progress' },
  { status: 'done', label: '已完成', badge: 'todo-badge todo-badge--done', accent: 'status-accent status-accent--done' },
]

const statusLabelMap = computed(() =>
  statusConfigs.reduce<Record<TodoStatus, string>>((map, config) => ({
    ...map,
    [config.status]: config.label,
  }), {} as Record<TodoStatus, string>),
)

const statusBadgeMap = computed(() =>
  statusConfigs.reduce<Record<TodoStatus, string>>((map, config) => ({
    ...map,
    [config.status]: config.badge,
  }), {} as Record<TodoStatus, string>),
)

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
}

const updateTaskById = (id: string, updater: (task: TodoWithProject) => TodoWithProject) => {
  tasks.value = tasks.value.map((task) => (task.id === id ? updater(task) : task))
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

const sanitizeDelay = (value: number | string) => {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const addDays = (input: string | undefined, days: number) => {
  const base = input ? new Date(input) : new Date()
  if (Number.isNaN(base.getTime())) return input ?? ''
  base.setDate(base.getDate() + days)
  return base.toISOString().slice(0, 10)
}

const deleteSelected = () => {
  if (!selectedIds.value.length) return
  const set = new Set(selectedIds.value)
  tasks.value = tasks.value.filter((task) => !set.has(task.id))
  clearSelection()
}

const dateEditor = ref<DateEditorState>({ id: null, delay: 1, date: '' })

const openDateEditor = (task: TodoWithProject) => {
  dateEditor.value = {
    id: task.id,
    delay: 1,
    date: task.dueDate ?? '',
  }
}

const closeDateEditor = () => {
  dateEditor.value = { id: null, delay: 1, date: '' }
}

const applyItemDelay = (taskId: string) => {
  if (dateEditor.value.id !== taskId) return
  const days = sanitizeDelay(dateEditor.value.delay)
  updateTaskById(taskId, (task) => ({ ...task, dueDate: addDays(task.dueDate, days) }))
  closeDateEditor()
}

const applyItemDate = (taskId: string) => {
  if (dateEditor.value.id !== taskId) return
  if (!dateEditor.value.date) return
  updateTaskById(taskId, (task) => ({ ...task, dueDate: dateEditor.value.date }))
  closeDateEditor()
}

const markTaskDone = (taskId: string) => {
  updateTaskById(taskId, (task) => ({ ...task, status: 'done' }))
  if (dateEditor.value.id === taskId) {
    closeDateEditor()
  }
}

const deleteTask = (taskId: string) => {
  tasks.value = tasks.value.filter((task) => task.id !== taskId)
  if (dateEditor.value.id === taskId) {
    closeDateEditor()
  }
}

const contextMenu = ref<ContextMenuState>({ visible: false, x: 0, y: 0, itemId: null })

const openContextMenu = (event: MouseEvent, taskId: string) => {
  event.preventDefault()
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    itemId: taskId,
  }
}

const closeContextMenu = () => {
  contextMenu.value = { visible: false, x: 0, y: 0, itemId: null }
}

const handleContextAction = (action: 'done' | 'delete') => {
  if (!contextMenu.value.itemId) return
  if (action === 'done') {
    markTaskDone(contextMenu.value.itemId)
  } else {
    deleteTask(contextMenu.value.itemId)
  }
  closeContextMenu()
}

const handleGlobalPointer = () => {
  closeContextMenu()
  if (dateEditor.value.id) {
    closeDateEditor()
  }
}

onMounted(() => {
  window.addEventListener('pointerdown', handleGlobalPointer)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', handleGlobalPointer)
})

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
        <div class="todo-header__title">
          <span class="todo-header__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 3h6a1 1 0 011 1v1h1.5A1.5 1.5 0 0119 6.5v12A2.5 2.5 0 0116.5 21h-9A2.5 2.5 0 015 18.5v-12A1.5 1.5 0 016.5 5H8V4a1 1 0 011-1z" />
              <path d="M9 3a1 1 0 00-1 1v1h8V4a1 1 0 00-1-1H9z" />
              <path d="M8 10h8M8 14h6M8 18h4" />
            </svg>
          </span>
          <h1>待办清单</h1>
        </div>
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
      <article class="metric-card metric-card--total">
        <span class="metric-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 3h6a1 1 0 011 1v1h1.5A1.5 1.5 0 0119 6.5v11.75A2.75 2.75 0 0116.25 21H7.75A2.75 2.75 0 015 18.25V6.5A1.5 1.5 0 016.5 5H8V4a1 1 0 011-1z" />
            <path d="M9 3a1 1 0 00-1 1v1h8V4a1 1 0 00-1-1H9z" />
            <path d="M8 10h8M8 14h6M8 18h4" />
          </svg>
        </span>
        <div class="metric-card__content">
          <h3>任务总数</h3>
          <strong>{{ totalCount }}</strong>
        </div>
      </article>
      <article class="metric-card metric-card--progress">
        <span class="metric-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2l-1.2 7H18l-7 13 1.2-8H6l7-12z" />
          </svg>
        </span>
        <div class="metric-card__content">
          <h3>进行中</h3>
          <strong>{{ inProgressCount }}</strong>
        </div>
      </article>
      <article class="metric-card metric-card--done">
        <span class="metric-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 12l2.5 2.5L18 8" />
            <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          </svg>
        </span>
        <div class="metric-card__content">
          <h3>已完成</h3>
          <strong>{{ doneCount }}</strong>
        </div>
      </article>
      <article class="metric-card metric-card--rate">
        <span class="metric-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 4a8 8 0 110 16 8 8 0 010-16z" />
            <path d="M12 8v4l3 2" />
          </svg>
        </span>
        <div class="metric-card__content">
          <h3>完成率</h3>
          <strong>{{ completionRate }}</strong>
        </div>
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
        <span class="todo-actions__count">
          <span class="todo-actions__count-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
              <path d="M5 19.25A7.25 7.25 0 0112 12a7.25 7.25 0 017 7.25V21H5v-1.75z" />
            </svg>
          </span>
          已选 {{ selectedCount }}
        </span>
        <button type="button" class="todo-button" @click="markSelectedDone">
          <span class="todo-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span class="todo-button__label">标记完成</span>
        </button>
        <button type="button" class="todo-button todo-button--danger" @click="deleteSelected">
          <span class="todo-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 7h12" />
              <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
              <path d="M10 11v6M14 11v6" />
              <path d="M7 7h10l-1 12a2 2 0 01-2 2H10a2 2 0 01-2-2z" />
            </svg>
          </span>
          <span class="todo-button__label">删除任务</span>
        </button>
        <button type="button" class="todo-button todo-button--ghost" @click="clearSelection">
          <span class="todo-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 9l-6 6M9 9l6 6" />
              <path d="M12 3a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
          </span>
          <span class="todo-button__label">取消选择</span>
        </button>
      </div>

    </section>

    <section v-if="groupedTasks.length" class="todo-section-list">
      <article v-for="section in groupedTasks" :key="section.status" class="todo-section" :data-status="section.status">
        <header class="todo-section__header">
          <div class="todo-section__title">
            <span :class="section.accent" />
            <h2>{{ section.label }}</h2>
            <span class="todo-section__count">{{ section.items.length }}</span>
          </div>
        </header>

        <ul class="todo-table">
          <li
            v-for="item in section.items"
            :key="item.id"
            :class="['todo-row', { 'todo-row--done': item.status === 'done' }]"
            @contextmenu="openContextMenu($event, item.id)"
          >
            <label class="todo-row__checkbox">
              <input
                type="checkbox"
                :checked="selectedIds.includes(item.id)"
                @change="toggleItemSelection(item.id, ($event.target as HTMLInputElement).checked)"
              />
            </label>
            <div class="todo-row__body">
              <div class="todo-row__top">
                <div class="todo-row__primary">
                  <span class="todo-row__title-text">{{ item.title }}</span>
                  <span v-if="item.projectName" class="todo-row__project">{{ item.projectName }}</span>
                </div>
                <div class="todo-row__meta">
                  <button type="button" class="todo-row__due" @click.stop="openDateEditor(item)">
                    {{ formatDate(item.dueDate) }}
                  </button>
                  <div v-if="dateEditor.id === item.id" class="todo-date-editor" @click.stop>
                    <div class="todo-date-editor__field">
                      <label>延后</label>
                      <div class="todo-delay-input">
          <button type="button" @click="dateEditor.delay = Math.max(1, sanitizeDelay(dateEditor.delay) - 1)">-</button>
          <input type="number" min="1" v-model.number="dateEditor.delay" />
          <button type="button" @click="dateEditor.delay = sanitizeDelay(dateEditor.delay) + 1">+</button>
        </div>
                      <button type="button" @click="applyItemDelay(item.id)">应用</button>
                    </div>
                    <div class="todo-date-editor__field">
                      <label>选择日期</label>
                      <input type="date" v-model="dateEditor.date" />
                      <button type="button" :disabled="!dateEditor.date" @click="applyItemDate(item.id)">设置</button>
                    </div>
                    <button type="button" class="todo-date-editor__close" @click="closeDateEditor">关闭</button>
                  </div>
                  <span :class="statusBadgeMap[item.status]">{{ statusLabelMap[item.status] ?? item.status }}</span>
                  <span :class="priorityConfigs[item.priority].tone">{{ priorityConfigs[item.priority].label }}</span>
                </div>
              </div>
              <p v-if="item.description" class="todo-row__desc">{{ item.description }}</p>
            </div>
          </li>
        </ul>
      </article>
    </section>

    <section v-else class="todo-empty">
      <h2>暂无待办事项</h2>
      <p>可以从项目空间创建新的任务或调整筛选条件。</p>
    </section>

    <div v-if="contextMenu.visible" class="todo-context-menu" :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }">
      <button type="button" @click="handleContextAction('done')">标记已完成</button>
      <button type="button" class="todo-context-menu__danger" @click="handleContextAction('delete')">删除任务</button>
    </div>
  </div>
</template>

<style scoped>
.todo-view {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.todo-header {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.6rem;
  border-radius: 1.2rem;
  background: linear-gradient(135deg, #eef2ff 0%, #fef3c7 100%);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.todo-header::after {
  content: '';
  position: absolute;
  right: -3rem;
  top: -3.5rem;
  width: 11rem;
  height: 11rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.25), rgba(79, 70, 229, 0));
}

.todo-header__title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.todo-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 0.9rem;
  background: linear-gradient(140deg, #1d4ed8, #9333ea);
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.28);
  flex-shrink: 0;
}

.todo-header__icon svg {
  width: 1.4rem;
  height: 1.4rem;
  pointer-events: none;
}

.todo-header__text h1 {
  margin: 0;
  font-size: 1.95rem;
  font-weight: 700;
  color: #0b1324;
}

.todo-header__text p {
  margin-top: 0.45rem;
  font-size: 0.95rem;
  color: #334155;
  max-width: 32rem;
}

.todo-header__filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.todo-filter {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: #1e293b;
  background: rgba(255, 255, 255, 0.85);
  padding: 0.6rem 0.85rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
}

.todo-filter select {
  min-width: 200px;
  padding: 0.55rem 0.85rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(59, 130, 246, 0.28);
  background: #ffffff;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 500;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.todo-filter select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.todo-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.metric-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 1rem;
  color: #0f172a;
  overflow: hidden;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
}

.metric-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.metric-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.32);
  color: #0f172a;
  flex-shrink: 0;
}

.metric-card__icon svg {
  width: 1.4rem;
  height: 1.4rem;
  pointer-events: none;
}

.metric-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.metric-card__content h3 {
  margin: 0;
  font-size: 0.83rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.7);
}

.metric-card__content strong {
  font-size: 1.55rem;
  font-weight: 700;
}

.metric-card--total {
  background: linear-gradient(135deg, #dbeafe, #ede9fe);
}

.metric-card--total .metric-card__icon {
  background: rgba(59, 130, 246, 0.25);
  color: #1d4ed8;
}

.metric-card--progress {
  background: linear-gradient(135deg, #fee2e2, #fef3c7);
}

.metric-card--progress .metric-card__icon {
  background: rgba(248, 113, 113, 0.22);
  color: #dc2626;
}

.metric-card--done {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
}

.metric-card--done .metric-card__icon {
  background: rgba(34, 197, 94, 0.22);
  color: #15803d;
}

.metric-card--rate {
  background: linear-gradient(135deg, #e0f2fe, #fef9c3);
}

.metric-card--rate .metric-card__icon {
  background: rgba(14, 165, 233, 0.22);
  color: #0ea5e9;
}

.todo-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(56, 189, 248, 0.08));
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

.todo-actions__select-all {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1d4ed8;
  background: #ffffff;
  padding: 0.45rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(37, 99, 235, 0.25);
  box-shadow: 0 8px 18px rgba(59, 130, 246, 0.12);
}

.todo-actions__bulk {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.todo-actions__count {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.75rem;
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.08);
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
}

.todo-actions__count-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.55rem;
  background: rgba(37, 99, 235, 0.16);
  color: #1d4ed8;
  flex-shrink: 0;
}

.todo-actions__count-icon svg {
  width: 1rem;
  height: 1rem;
  pointer-events: none;
}

.todo-delay-input {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(148, 163, 184, 0.4);
  border-radius: 0.7rem;
  overflow: hidden;
}

.todo-delay-input input {
  width: 70px;
  padding: 0.45rem 0.6rem;
  border: none;
  text-align: center;
  font-size: 0.85rem;
}

.todo-delay-input button {
  width: 42px;
  height: 42px;
  border: none;
  background: rgba(148, 163, 184, 0.16);
  color: #475569;
  font-size: 1rem;
  cursor: pointer;
}

.todo-delay-input button:hover {
  background: rgba(37, 99, 235, 0.18);
  color: #1d4ed8;
}


.todo-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.25);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.todo-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.todo-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.28);
}

.todo-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 0.45rem;
  background: rgba(255, 255, 255, 0.2);
}

.todo-button__icon svg {
  width: 1rem;
  height: 1rem;
  pointer-events: none;
}

.todo-button__label {
  white-space: nowrap;
}

.todo-button--ghost {
  background: rgba(255, 255, 255, 0.92);
  color: #1d4ed8;
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.15);
}

.todo-button--ghost:hover {
  background: #ffffff;
}

.todo-button--danger {
  background: linear-gradient(135deg, #f87171, #ef4444);
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.3);
}

.todo-button--danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 32px rgba(220, 38, 38, 0.35);
}

.todo-section-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.todo-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.2rem;
  border-radius: 1.1rem;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.07);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.todo-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 36px rgba(15, 23, 42, 0.1);
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
  position: relative;
}

.todo-section__title::before {
  content: '';
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 0.55rem;
  font-size: 1rem;
  margin-right: 0.45rem;
  background: rgba(37, 99, 235, 0.16);
  color: #1d4ed8;
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
  padding: 0.12rem 0.55rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
  font-size: 0.72rem;
  font-weight: 600;
}

.todo-section[data-status='planned'] {
  background: linear-gradient(135deg, rgba(224, 231, 255, 0.95), rgba(241, 245, 249, 0.95));
  border-color: rgba(148, 163, 184, 0.35);
}

.todo-section[data-status='planned'] .todo-section__title::before {
  content: '🗂️';
  background: rgba(148, 163, 184, 0.22);
  color: #1f2937;
}

.todo-section[data-status='planned'] .todo-section__count {
  background: rgba(148, 163, 184, 0.25);
  color: #1f2937;
}

.todo-section[data-status='in-progress'] {
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.95), rgba(255, 247, 237, 0.95));
  border-color: rgba(96, 165, 250, 0.35);
}

.todo-section[data-status='in-progress'] .todo-section__title::before {
  content: '⚡';
  background: rgba(96, 165, 250, 0.25);
  color: #1d4ed8;
}

.todo-section[data-status='in-progress'] .todo-section__count {
  background: rgba(96, 165, 250, 0.2);
  color: #1d4ed8;
}

.todo-section[data-status='done'] {
  background: linear-gradient(135deg, rgba(209, 250, 229, 0.95), rgba(204, 251, 241, 0.95));
  border-color: rgba(34, 197, 94, 0.35);
}

.todo-section[data-status='done'] .todo-section__title::before {
  content: '✅';
  background: rgba(34, 197, 94, 0.25);
  color: #15803d;
}

.todo-section[data-status='done'] .todo-section__count {
  background: rgba(34, 197, 94, 0.2);
  color: #15803d;
}

.todo-table {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.todo-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.9rem;
  padding: 0.9rem 1.1rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(238, 242, 255, 0.95));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  cursor: default;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.todo-row:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.1);
}

.todo-row--done {
  opacity: 0.85;
}

.todo-row--done .todo-row__title-text {
  text-decoration: line-through;
  color: #94a3b8;
}

.todo-row__checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.todo-row__body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.todo-row__top {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.todo-row__primary {
  display: inline-flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.todo-row__title-text {
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 600;
}

.todo-row__project {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #475569;
  background: rgba(148, 163, 184, 0.18);
  padding: 0.12rem 0.55rem;
  border-radius: 0.7rem;
}

.todo-row__project::before {
  content: '🏷️';
  font-size: 0.85rem;
}

.todo-row__meta {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex-shrink: 0;
  align-self: center;
}

.todo-row__meta > span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.todo-row__desc {
  font-size: 0.78rem;
  color: #64748b;
}

.todo-row__due {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 120px;
  min-height: 2.45rem;
  padding: 0.5rem 1rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(37, 99, 235, 0.32);
  background: rgba(37, 99, 235, 0.16);
  color: #1d4ed8;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.todo-row__due::before {
  content: '📅';
  font-size: 1rem;
}

.todo-row__due:hover {
  background: rgba(37, 99, 235, 0.24);
  transform: translateY(-1px);
}


.todo-date-editor {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 240px;
  padding: 0.9rem;
  border-radius: 0.85rem;
  background: #ffffff;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.16);
  z-index: 10;
}

.todo-date-editor__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: #475569;
}

.todo-date-editor__field input {
  padding: 0.45rem 0.6rem;
  border-radius: 0.6rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.todo-date-editor__field button {
  align-self: flex-end;
  padding: 0.35rem 0.7rem;
  border-radius: 0.6rem;
  border: 1px solid rgba(37, 99, 235, 0.35);
  background: #1d4ed8;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
}

.todo-date-editor__field button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.todo-date-editor__close {
  align-self: flex-end;
  padding: 0.35rem 0.75rem;
  border-radius: 0.6rem;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: transparent;
  color: #475569;
  font-size: 0.75rem;
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
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.todo-badge::before {
  font-size: 0.85rem;
}

.todo-badge--planned {
  background: rgba(148, 163, 184, 0.2);
  color: #1f2937;
}

.todo-badge--planned::before {
  content: '🗓️';
}

.todo-badge--progress {
  background: rgba(37, 99, 235, 0.18);
  color: #1d4ed8;
}

.todo-badge--progress::before {
  content: '🚀';
}

.todo-badge--done {
  background: rgba(34, 197, 94, 0.2);
  color: #15803d;
}

.todo-badge--done::before {
  content: '🥳';
}

.priority {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.55rem;
  border-radius: 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.priority::before {
  font-size: 0.85rem;
}

.priority--high {
  background: rgba(248, 113, 113, 0.25);
  color: #b91c1c;
}

.priority--high::before {
  content: '🔥';
}

.priority--medium {
  background: rgba(251, 191, 36, 0.24);
  color: #b45309;
}

.priority--medium::before {
  content: '⚖️';
}

.priority--low {
  background: rgba(148, 163, 184, 0.2);
  color: #475569;
}

.priority--low::before {
  content: '🌱';
}

.status-accent {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

.status-accent--planned {
  background: #94a3b8;
}

.status-accent--progress {
  background: #2563eb;
}

.status-accent--done {
  background: #22c55e;
}

.todo-context-menu {
  position: fixed;
  z-index: 20;
  display: flex;
  flex-direction: column;
  min-width: 140px;
  padding: 0.6rem 0.4rem;
  border-radius: 0.75rem;
  background: #ffffff;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.18);
  gap: 0.25rem;
}

.todo-context-menu button {
  padding: 0.45rem 0.6rem;
  border-radius: 0.6rem;
  border: none;
  background: transparent;
  color: #0f172a;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;
}

.todo-context-menu button:hover {
  background: rgba(37, 99, 235, 0.12);
}

.todo-context-menu__danger {
  color: #dc2626;
}

@media (max-width: 960px) {
  .todo-row__top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.85rem;
  }

  .todo-row__primary {
    width: 100%;
  }

  .todo-row__meta {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    row-gap: 0.45rem;
    gap: 0.6rem;
  }

  .todo-row__due {
    width: 100%;
    justify-content: flex-start;
  }

  .todo-date-editor {
    right: auto;
    left: 0;
  }
}



</style>



