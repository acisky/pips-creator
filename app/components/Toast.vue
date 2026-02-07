<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast" tag="div" class="space-y-2">
        <div v-for="toast in regularToasts" :key="toast.id"
          class="flex flex-col max-w-sm transform transition-all duration-300 ease-in-out bg-white border border-solid border-[#2b2e3a] rounded-lg overflow-hidden font-['Lato',sans-serif]">
          <!-- Toast Header -->
          <div
            class="flex items-center justify-between bg-[#2b2e3a] text-white border-b border-solid border-[#2b2e3a] px-4 py-3">
            <div class="flex items-center">
              <component :is="getIcon(toast.type)" class="w-4 h-4 mr-2" />
              <strong v-if="toast.title" class="font-bold text-sm">{{ toast.title }}</strong>
              <strong v-else class="font-bold text-sm">{{ getTypeTitle(toast.type) }}</strong>
            </div>
            <button @click="removeToast(toast.id)"
              class="flex-shrink-0 w-6 h-6 p-1 rounded-full hover:opacity-100 transition-opacity flex items-center justify-center opacity-80"
              aria-label="Close toast">
              <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>

          <!-- Toast Body -->
          <div class="bg-[#fbf9f5] text-[#2b2e3a] p-4 text-sm" v-html="toast.message">
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { inject, computed } from 'vue'

// Inject toast methods from the composable
const { toasts, removeToast } = inject('toast')

// Filter out confirmation toasts (they have their own component)
// 只保留第一个普通 toast，确保同一时间只存在一个
const regularToasts = computed(() => {
  const list = toasts.value.filter(toast => !toast.isConfirmation)
  return list.length > 0 ? [list[0]] : []
})

// Icon components (using simple SVG icons)
const CheckCircleIcon = {
  template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
    </svg>
  `
}

const ExclamationCircleIcon = {
  template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
    </svg>
  `
}

const XCircleIcon = {
  template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
    </svg>
  `
}

const InformationCircleIcon = {
  template: `
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
    </svg>
  `
}

const getIcon = (type) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationCircleIcon,
    info: InformationCircleIcon
  }
  return icons[type] || InformationCircleIcon
}

const getTypeTitle = (type) => {
  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information'
  }
  return titles[type] || 'Notification'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>