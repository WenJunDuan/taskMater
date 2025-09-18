<script setup lang="ts">
import { computed, ref } from 'vue'
import SprintCalendar from '@/components/widgets/SprintCalendar.vue'
import SprintTodoList from '@/components/widgets/SprintTodoList.vue'
import type { CalendarEvent } from '@/types/calendar'

const kpiCards = computed(() => [
  { title: '进行中的任务', value: 48, hint: '比昨日增加 5 项', tone: 'text-emerald-600' },
  { title: '已完成任务', value: 132, hint: '本周新增完成 18 项', tone: 'text-emerald-600' },
  { title: '逾期任务', value: 4, hint: '较上周减少 1 项', tone: 'text-amber-600' },
  { title: '准备发布版本', value: 'v0.3.0', hint: '预计下周一发布', tone: 'text-indigo-500' },
])

const toISODate = (offset = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

const sprintEvents: CalendarEvent[] = [
  { id: 'evt-1', title: '冲刺规划会', date: toISODate(0), description: '同步冲刺目标与开发范围。' },
  { id: 'evt-2', title: '需求澄清会', date: toISODate(1), description: '与产品确认高优需求细节。' },
  { id: 'evt-3', title: '用户访谈', date: toISODate(2), description: '采访核心用户收集反馈。' },
  { id: 'evt-4', title: '回归测试', date: toISODate(4), description: '执行自动化回归测试用例。' },
]

const selectedDate = ref(toISODate())
</script>

<template>
  <div class="dashboard">
    <header class="dashboard__header">
      <div>
        <h1>任务大师控制台</h1>
        <p>当前冲刺关键指标一览</p>
      </div>
    </header>

    <div class="dashboard__content">
      <section class="dashboard__left">
        <section class="dashboard__kpi">
          <article
            v-for="card in kpiCards"
            :key="card.title"
            class="dashboard__kpi-card"
          >
            <h2>{{ card.title }}</h2>
            <p class="dashboard__kpi-value">{{ card.value }}</p>
            <p :class="['dashboard__kpi-hint', card.tone]">{{ card.hint }}</p>
          </article>
        </section>

        <slot name="left-extra" />
      </section>

      <aside class="dashboard__right">
        <div class="dashboard__calendar-card">
          <div class="dashboard__card-header">
            <h1>日历</h1>
          </div>
          <div class="dashboard__calendar-body">
            <SprintCalendar v-model="selectedDate" />
          </div>
        </div>

        <div class="dashboard__todo-card">
          <SprintTodoList :date="selectedDate" :events="sprintEvents" />
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard__header h1 {
  font-size: 2.25rem;
  font-weight: 600;
  color: #0f172a;
}

.dashboard__header p {
  margin-top: 0.5rem;
  color: #64748b;
}

.dashboard__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 540px;
  gap: 2rem;
  align-items: start;
}

.dashboard__left {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard__kpi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.dashboard__kpi-card {
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.dashboard__kpi-card h2 {
  font-size: 0.9rem;
  color: #64748b;
}

.dashboard__kpi-value {
  font-size: 2rem;
  font-weight: 600;
  color: #0f172a;
}

.dashboard__kpi-hint {
  font-size: 0.75rem;
}

.dashboard__right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dashboard__calendar-card,
.dashboard__todo-card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
}

.dashboard__calendar-card {
  padding: 1.5rem;
}

.dashboard__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: #64748b;
}

.dashboard__card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.dashboard__calendar-body {
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.65);
}

.dashboard__todo-card {
  padding: 1.5rem;
}

@media (max-width: 1200px) {
  .dashboard__content {
    grid-template-columns: minmax(0, 1fr) 420px;
  }
}

@media (max-width: 960px) {
  .dashboard__content {
    grid-template-columns: 1fr;
  }
  .dashboard__right {
    order: -1;
  }
}
</style>
