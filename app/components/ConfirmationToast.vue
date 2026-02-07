<template>
  <Teleport to="body">
    <TransitionGroup name="toast">
      <div v-for="toast in confirmationToasts" :key="toast.id"
        class="fixed inset-0 flex items-center justify-center z-50">
        <!-- Overlay/Backdrop -->
        <div class="absolute inset-0 bg-black bg-opacity-50" @click="toast.onCancel"></div>

        <!-- Modal Content -->
        <div
          class="flex flex-col max-w-sm transform transition-all duration-300 ease-in-out bg-white border border-solid border-[#2b2e3a] rounded-lg overflow-hidden font-['Lato',sans-serif]">
          <!-- Icon and Title -->
          <div
            class="flex items-center justify-between bg-[#2b2e3a] text-white border-b border-solid border-[#2b2e3a] px-4 py-3">
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"></path>
              </svg>
              <strong class="font-bold text-sm">{{ toast.title || 'Confirmation' }}</strong>
            </div>
          </div>

          <!-- Message -->
          <div class="toast-body bg-[#fbf9f5] text-[#2b2e3a] p-4 text-sm">
            <p class="m-0 mb-4">{{ toast.message }}</p>

            <!-- Action buttons -->
            <div class="flex space-x-2 justify-end">
              <button @click="toast.onCancel"
                class="px-4 py-2 font-medium text-[#2b2e3a] bg-white border border-[#2b2e3a]/20 rounded-full hover:bg-[#2b2e3a]/5 hover:-translate-y-0.5 transition-all duration-300 ease-in-out">
                Cancel
              </button>
              <button @click="toast.onConfirm"
                class="px-4 py-2 font-medium text-white bg-[#2b2e3a] rounded-full hover:bg-[#1a1d26] hover:-translate-y-0.5 transition-all duration-300 ease-in-out">
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { inject, computed } from 'vue'

// Inject toast methods from the composable
const { toasts } = inject('toast')

// Filter only confirmation toasts
const confirmationToasts = computed(() => {
  return toasts.value.filter(toast => toast.isConfirmation)
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
}

.toast-leave-to {
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>