<script setup lang="ts">
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import AppShell from "@/components/layout/AppShell.vue"
import { useAppStore } from "@/stores/app"

const store = useAppStore()
const router = useRouter()

const handleNavigateHome = () => {
  router.push({ name: "dashboard" })
}
onMounted(() => {
  store.setTheme(store.theme)
})
</script>

<template>
  <AppShell @navigate-home="handleNavigateHome">
    <RouterView />
  </AppShell>
</template>
