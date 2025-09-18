<script setup lang="ts">
import { computed } from 'vue'
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/24/outline'
import { useAppStore, type ThemeOption } from '@/stores/app'

const store = useAppStore()

const themeOptions: Array<{ id: ThemeOption; label: string; description: string }> = [
  {
    id: 'system',
    label: '跟随系统',
    description: '根据系统偏好自动切换明暗模式',
  },
  {
    id: 'light',
    label: '浅色模式',
    description: '适用于日间或高亮环境',
  },
  {
    id: 'dark',
    label: '深色模式',
    description: '降低光线刺激，适用于暗光环境',
  },
]

const selectedLabel = computed(
  () => themeOptions.find((option) => option.id === store.theme)?.label ?? '跟随系统',
)

const onUpdate = (theme: ThemeOption) => {
  store.setTheme(theme)
}
</script>

<template>
  <Listbox :modelValue="store.theme" as="div" class="space-y-1" @update:modelValue="onUpdate">
    <ListboxLabel class="block text-sm font-medium text-slate-600">主题模式</ListboxLabel>
    <div class="relative">
      <ListboxButton
        class="relative w-60 cursor-default rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:text-sm"
      >
        <span class="block truncate">{{ selectedLabel }}</span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon class="h-5 w-5 text-slate-400" aria-hidden="true" />
        </span>
      </ListboxButton>
      <ListboxOptions
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-base shadow-lg focus:outline-none sm:text-sm"
      >
        <ListboxOption
          v-for="option in themeOptions"
          :key="option.id"
          :value="option.id"
          class="relative"
        >
          <template #default="{ active, selected }">
            <div
              class="relative flex cursor-default select-none flex-col rounded-lg px-3 py-2"
              :class="[
                active ? 'bg-primary/10 text-primary' : 'text-slate-900',
              ]"
            >
              <span class="block truncate font-medium" :class="{ 'text-primary': selected }">
                {{ option.label }}
              </span>
              <span class="text-xs text-slate-500">{{ option.description }}</span>
              <span
                v-if="selected"
                class="absolute inset-y-0 right-0 flex items-center pr-4 text-primary"
              >
                <CheckIcon class="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </template>
        </ListboxOption>
      </ListboxOptions>
    </div>
  </Listbox>
</template>

