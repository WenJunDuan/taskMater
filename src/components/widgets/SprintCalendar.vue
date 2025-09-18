<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import type { Calendar, CalendarOptions } from "@fullcalendar/core"
import FullCalendar from "@fullcalendar/vue3"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import zhCnLocale from "@fullcalendar/core/locales/zh-cn"

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const calendarRef = ref<{ getApi: () => Calendar } | null>(null)
const currentDate = ref(new Date())
const selectedKey = ref("")
const cellMap = new Map<string, HTMLElement>()

const formatKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseKey = (key: string) => {
  const parts = key.split("-")
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date()
  }
  return new Date(year, month - 1, day)
}

const normalizeKey = (value: string) => formatKey(parseKey(value))

const getISOWeekNumber = (date: Date) => {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = temp.getUTCDay() || 7
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1))
  return Math.ceil(((temp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

const monthLabel = computed(() =>
  new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(currentDate.value),
)

const selectedDateDisplay = computed(() =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(parseKey(selectedKey.value)),
)

const weekLabel = computed(() => `当前第 ${getISOWeekNumber(parseKey(selectedKey.value))} 周`)

function highlightSelectedDay() {
  cellMap.forEach((el, dateKey) => {
    el.classList.toggle("calendar-day--selected", dateKey === selectedKey.value)
  })
}

const setSelectedKey = (key: string) => {
  selectedKey.value = key
  emit("update:modelValue", key)
  highlightSelectedDay()
}

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  locale: zhCnLocale,
  initialView: "dayGridMonth",
  initialDate: parseKey(selectedKey.value),
  headerToolbar: false,
  firstDay: 1,
  height: "auto",
  contentHeight: "auto",
  aspectRatio: 1.35,
  fixedWeekCount: false,
  showNonCurrentDates: false,
  expandRows: false,
  selectable: true,
  dayMaxEventRows: false,
  dayHeaderFormat: { weekday: "short" },
  dateClick: (arg) => {
    setSelectedKey(arg.dateStr)
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

const goto = (mode: "prev" | "today" | "next") => {
  const api = calendarRef.value?.getApi()
  if (!api) return
  if (mode === "today") {
    const key = formatKey(new Date())
    api.gotoDate(parseKey(key))
    currentDate.value = parseKey(key)
    setSelectedKey(key)
    return
  }
  mode === "prev" ? api.prev() : api.next()
  currentDate.value = api.view.currentStart ?? api.getDate()
  highlightSelectedDay()
}

const gotoPrev = () => goto("prev")
const gotoToday = () => goto("today")
const gotoNext = () => goto("next")

watch(
  () => props.modelValue,
  (value) => {
    const key = normalizeKey(value)
    if (key !== selectedKey.value) {
      selectedKey.value = key
      currentDate.value = parseKey(key)
      calendarRef.value?.getApi().gotoDate(parseKey(key))
      highlightSelectedDay()
    }
  },
  { immediate: true },
)

onMounted(() => {
  const key = normalizeKey(props.modelValue)
  selectedKey.value = key
  currentDate.value = parseKey(key)
  calendarRef.value?.getApi().gotoDate(parseKey(key))
  highlightSelectedDay()
})
</script>


<template>
  <div class="calendar-card">
    <div class="calendar-head">
      <div class="calendar-head__meta">
        <p class="calendar-date">{{ selectedDateDisplay }}</p>
        <p class="calendar-week">{{ weekLabel }}</p>
      </div>
      <div class="calendar-controls">
        <button @click="gotoPrev">‹ 上月</button>
        <button @click="gotoToday">今天</button>
        <button @click="gotoNext">下月 ›</button>
      </div>
    </div>

    <div class="calendar-title-wrap">
      <h3 class="calendar-title">{{ monthLabel }}</h3>
    </div>

    <div class="calendar-body">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </div>
  </div>
</template>


<style scoped>
.calendar-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #ffffff;
  border-radius: 1.2rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  padding: 1.3rem 1.5rem;
  color: #0f172a;
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.calendar-head__meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.calendar-date {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0f172a;
}

.calendar-week {
  font-size: 0.78rem;
  color: #64748b;
  letter-spacing: 0.08em;
}

.calendar-controls {
  display: inline-flex;
  gap: 0.4rem;
}

.calendar-controls button {
  padding: 0.34rem 0.95rem;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(248, 250, 252, 0.9);
  color: #0f172a;
  font-size: 0.72rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.calendar-controls button:hover {
  background: rgba(37, 99, 235, 0.12);
  border-color: rgba(37, 99, 235, 0.2);
  color: #1d4ed8;
}

.calendar-title-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.calendar-title {
  font-size: 1.85rem;
  font-weight: 700;
  color: #0f172a;
}

.calendar-body {
  border-radius: 1rem;
  overflow: hidden;
}

:deep(.fc) {
  border: none;
  background: transparent;
  color: #1f2937;
}

:deep(.fc-scrollgrid),
:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
  border: none !important;
}

:deep(.fc-col-header-cell) {
  background: rgba(248, 250, 252, 0.9);
  color: #475569;
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.55rem 0.3rem;
}

:deep(.fc-daygrid-day) {
  padding: 0.34rem 0.55rem;
}

:deep(.fc-daygrid-day-frame) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  min-height: 56px;
  padding: 0.35rem;
  border-radius: 0.9rem;
  background-color: transparent;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.fc-daygrid-day-frame > div) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

:deep(.fc-daygrid-day-number) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 1.85rem;
  border-radius: 0.9rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.fc-daygrid-day-frame:hover) {
  background: rgba(148, 163, 184, 0.12);
  color: #0f172a;
}


:deep(.fc .fc-daygrid-day.fc-day-today){
  background: rgba(255, 255, 255, 0.24);
  color: #0f172a;
}

:deep(.fc-day-today .fc-daygrid-day-number) {
  background: rgba(37, 99, 235, 0.18);
  color: #1d4ed8;
}

:deep(.calendar-day--selected .fc-daygrid-day-frame) {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(59, 130, 246, 0.28));
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.18);
}

:deep(.calendar-day--selected .fc-daygrid-day-number) {
  background: transparent;
  color: #ffffff;
}

:deep(.fc-daygrid-day-events) {
  display: none !important;
}

:deep(.fc-view-harness) {
  min-height: 220px;
}

:deep(.fc .fc-day-disabled){
  background: rgba(255, 255, 255, 0.24);
}

</style>
