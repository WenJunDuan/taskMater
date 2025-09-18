import { defineStore } from 'pinia'

export type ThemeOption = 'system' | 'light' | 'dark'

interface AppState {
  theme: ThemeOption
  sidebarOpen: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    theme: 'system',
    sidebarOpen: true,
  }),
  actions: {
    setTheme(theme: ThemeOption) {
      this.theme = theme
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
        return
      }
      document.documentElement.classList.toggle('dark', theme === 'dark')
    },
    toggleSidebar(force?: boolean) {
      this.sidebarOpen = typeof force === 'boolean' ? force : !this.sidebarOpen
    },
  },
})
