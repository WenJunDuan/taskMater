<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import { createChartDefaults } from '@/plugins/chart'

const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const data = computed<ChartData<'bar'>>(() => ({
  labels,
  datasets: [
    {
      label: '已完成任务',
      data: [12, 19, 9, 15, 14, 7, 6],
      backgroundColor: '#2563eb',
      borderRadius: 6,
    },
    {
      label: '计划任务',
      data: [18, 21, 16, 17, 20, 12, 9],
      backgroundColor: '#94a3b8',
      borderRadius: 6,
    },
  ],
}))

const options = computed<ChartOptions<'bar'>>(() => ({
  ...createChartDefaults(),
  plugins: {
    ...createChartDefaults().plugins,
    legend: {
      position: 'top',
    },
  },
}))
</script>

<template>
  <div class="h-64">
    <Bar :data="data" :options="options" />
  </div>
</template>
