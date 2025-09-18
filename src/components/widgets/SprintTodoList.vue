<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '@/types/calendar'

const props = defineProps<{
  date: string
  events: CalendarEvent[]
}>()

const items = computed(() => {
  const key = props.date
  return props.events.filter((event) => event.date === key)
})
</script>

<template>
  <div class="todo-panel">
    <div class="todo-panel__header">
      <h3>当天待办</h3>
      <span class="todo-panel__count">{{ items.length }}</span>
    </div>
    <ul v-if="items.length" class="todo-panel__list">
      <li v-for="event in items" :key="event.id" class="todo-panel__item">
        <div class="todo-panel__title">{{ event.title }}</div>
        <p v-if="event.description" class="todo-panel__desc">{{ event.description }}</p>
      </li>
    </ul>
    <div v-else class="todo-panel__empty">当日暂无计划事项</div>
  </div>
</template>

<style scoped>
.todo-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.todo-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.todo-panel__header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.todo-panel__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.2);
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
}

.todo-panel__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.todo-panel__item {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 0.85rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.todo-panel__title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
}

.todo-panel__desc {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 0.35rem;
}

.todo-panel__empty {
  font-size: 0.8rem;
  color: #94a3b8;
}
</style>
