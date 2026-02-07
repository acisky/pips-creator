<template>
  <NuxtLayout>
    <NuxtPage />
    <Toast />
    <ConfirmationToast />
  </NuxtLayout>
</template>

<script setup>
import { provide } from 'vue'
import { createToastProvider } from './composables/useToast.js'
import Toast from './components/Toast.vue'
import ConfirmationToast from './components/ConfirmationToast.vue'

// Create and provide toast functionality globally
const toastProvider = createToastProvider()
provide('toast', toastProvider)
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
}

body {
  font-family: "Lato", "sans-serif";
}

body * {
  box-sizing: border-box;
}
</style>