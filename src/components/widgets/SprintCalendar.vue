
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Calendar, CalendarOptions } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import zhCnLocale from '@fullcalendar/core/locales/zh-cn'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const calendarRef = ref<{ getApi: () => Calendar } | null>(null)
const currentDate = ref(new Date(props.modelValue))
const selectedKey = ref(props.modelValue)
const cellMap = new Map<string, HTMLElement>()

const formatKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

watch(
  () => props.modelValue,
  (value) => {
    selectedKey.value = value
    highlightSelectedDay()
  },
  { immediate: true },
)

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(currentDate.value),
)

function highlightSelectedDay() {
  cellMap.forEach((el, dateKey) => {
    el.classList.toggle('tm-calendar-cell--selected', dateKey === selectedKey.value)
  })
}

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  locale: zhCnLocale,
  initialView: 'dayGridMonth',
  initialDate: new Date(selectedKey.value),
  headerToolbar: false,
  firstDay: 1,
  height: 'auto',
  contentHeight: 'auto',
  aspectRatio: 1.35,
  fixedWeekCount: false,
  showNonCurrentDates: false,
  expandRows: false,
  selectable: true,
  dayMaxEventRows: false,
  dayHeaderFormat: { weekday: 'short' },
  dateClick: (arg) => {
    selectedKey.value = arg.dateStr
    emit('update:modelValue', arg.dateStr)
    highlightSelectedDay()
  },
  dayCellDidMount: (info) => {
    const key = formatKey(info.date)
    cellMap.set(key, info.el)
    highlightSelectedDay()
  },
  dayCellWillUnmount: (info) => {
    const key = formatKey(info.date)
    cellMap.delete(key)
  },
  datesSet: (arg) => {
    currentDate.value = arg.start
    highlightSelectedDay()
  },
}))

const syncFromCalendar = () => {
  const api = calendarRef.value?.getApi()
  if (!api) return
  const date = api.getDate()
  const key = formatKey(date)
  currentDate.value = date
  selectedKey.value = key
  emit('update:modelValue', key)
  highlightSelectedDay()
}

const gotoPrev = () => {
  calendarRef.value?.getApi().prev()
  syncFromCalendar()
}

const gotoToday = () => {
  calendarRef.value?.getApi().today()
  syncFromCalendar()
}

const gotoNext = () => {
  calendarRef.value?.getApi().next()
  syncFromCalendar()
}

onMounted(() => {
  syncFromCalendar()
})
</script>


<template>
  <div class="tm-calendar">
    <div class="tm-calendar__header">
      <div class="tm-calendar__month">{{ monthLabel }}</div>
      <div class="tm-calendar__controls">
        <button class="tm-calendar__button" @click="gotoPrev">上一月</button>
        <button class="tm-calendar__button" @click="gotoToday">今日</button>
        <button class="tm-calendar__button" @click="gotoNext">下一月</button>
      </div>
    </div>

    <FullCalendar ref="calendarRef" :options="calendarOptions" />
  </div>
</template>


<style scoped>
.tm-calendar {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tm-calendar__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tm-calendar__month {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #0f172a;
  font-family: 'PingFangSC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}

.tm-calendar__controls {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 0.4rem;
}

.tm-calendar__button {
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.18);
  color: #1e293b;
  font-size: 0.72rem;
  font-weight: 500;
  transition: background 0.2s ease, transform 0.2s ease;
}

.tm-calendar__button:hover {
  transform: translateY(-1px);
  background: rgba(148, 163, 184, 0.32);
}

:deep(.fc) {
  border-radius: 1.1rem;
  border: none;
  overflow: hidden;
  background: #ffffff;
}

:deep(.fc-scrollgrid),
:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
  border: none !important;
}

:deep(.fc-col-header-cell) {
  background: transparent;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
}

:deep(.fc-daygrid-day) {
  padding: 0.3rem 0.55rem;
}

:deep(.fc-daygrid-day-frame) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  margin: 0;
  border-radius: 0.8rem;
  background-color: transparent;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

 :deep(.fc-daygrid-day-number) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  background: rgba(148, 163, 184, 0.12);
  transition: background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

:deep(.tm-calendar-cell--selected .fc-daygrid-day-number) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 60%);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.28);
}

:deep(.fc-daygrid-day-frame:hover) {
  background: rgba(148, 163, 184, 0.18);
}

 :deep(.fc-daygrid-day-frame:hover .fc-daygrid-day-number) {
  background: rgba(148, 163, 184, 0.28);
  color: #1e293b;
}

:deep(.tm-calendar-cell--selected .fc-daygrid-day-frame) {
  background: #1d4ed8;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(29, 78, 216, 0.28);
}

:deep(.fc-day-other .fc-daygrid-day-number) {
  color: #c1c7d6;
}

 :deep(.fc-view-harness) {
  min-height: 300px;
}

:deep(.fc-daygrid-day-events) {
  display: none !important;
}
</style>
