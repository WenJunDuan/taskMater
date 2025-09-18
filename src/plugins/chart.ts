import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export type ChartTheme = 'light' | 'dark'

export const createChartDefaults = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    title: {
      display: false,
      text: ''
    }
  },
  scales: {
    x: {
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
    }
  }
})
