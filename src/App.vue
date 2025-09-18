<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import SprintCalendar from '@/components/widgets/SprintCalendar.vue'
import SprintTodoList from '@/components/widgets/SprintTodoList.vue'
import type { CalendarEvent } from '@/types/calendar'
import { useAppStore } from '@/stores/app'

const store = useAppStore()

const kpiCards = computed(() => [
  { title: '进行中的任务', value: 48, hint: '比昨日增加 5 项', tone: 'text-emerald-600' },
  { title: '已完成任务', value: 132, hint: '本周新增完成 18 项', tone: 'text-emerald-600' },
  { title: '逾期任务', value: 4, hint: '较上周减少 1 项', tone: 'text-amber-600' },
  { title: '平均工时', value: '6.3 小时', hint: '单任务平均投入', tone: 'text-slate-500' },
  { title: '准时交付率', value: '91%', hint: '相比昨日提升 3%', tone: 'text-emerald-600' },
  { title: '团队负载', value: '78%', hint: '目标区间 75% ~ 80%', tone: 'text-slate-500' },
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

onMounted(() => {
  store.setTheme(store.theme)
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <main class="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <section>
        <h1 class="text-4xl font-semibold text-slate-900">任务大师控制台</h1>
        <p class="mt-1 text-sm text-slate-500">当前冲刺关键指标一览</p>
      </section>

      <section class="lg:flex lg:items-start lg:gap-6">
        <div class="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="card in kpiCards"
            :key="card.title"
            class="rounded-2xl bg-white p-5 shadow-lg"
          >
            <h2 class="text-sm font-medium text-slate-500">{{ card.title }}</h2>
            <p class="mt-2 text-2xl font-semibold text-slate-900">{{ card.value }}</p>
            <p class="text-xs" :class="card.tone">{{ card.hint }}</p>
          </article>
        </div>

        <aside class="mt-6 w-full space-y-6 lg:mt-0 lg:w-96 xl:w-[28rem]">
          <div class="rounded-2xl bg-white p-6 shadow-lg">
            <div class="flex items-center justify-between">
              <h1 class="text-base font-semibold text-slate-800">日历</h1>
            </div>
            <div class="mt-4 min-h-[32rem] rounded-lg border border-slate-100 bg-white/60 p-4">
              <SprintCalendar v-model="selectedDate" />
            </div>
          </div>

          <div class="rounded-2xl bg-white p-6 shadow-lg">
            <SprintTodoList :date="selectedDate" :events="sprintEvents" />
          </div>
        </aside>
      </section>
    </main>
  </div>
</template>
