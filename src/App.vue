<script setup lang="ts">
import { onMounted } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import DashboardView from '@/views/DashboardView.vue'
import { useAppStore } from '@/stores/app'

const store = useAppStore()

onMounted(() => {
  store.setTheme(store.theme)
})
</script>

<template>
  <AppShell>
    <DashboardView />
  </AppShell>
</template>
