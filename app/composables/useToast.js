import { ref, reactive } from 'vue'

// Global toast state
const toasts = ref([])
let toastId = 0

export const useToast = () => {
  const addToast = (message, type = 'info', title = null, duration = 5000) => {
    const id = ++toastId
    // 只保留一个：添加前清空已有的
    toasts.value = []
    const toast = {
      id,
      message,
      type,
      title,
      duration
    }
    
    toasts.value.push(toast)
    
    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }
  
  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const clearAllToasts = () => {
    toasts.value = []
  }
  
  // Convenience methods for different toast types
  const success = (message, title = null, duration = 5000) => {
    return addToast(message, 'success', title, duration)
  }
  
  const error = (message, title = null, duration = 7000) => {
    return addToast(message, 'error', title, duration)
  }
  
  const warning = (message, title = null, duration = 6000) => {
    return addToast(message, 'warning', title, duration)
  }
  
  const info = (message, title = null, duration = 5000) => {
    return addToast(message, 'info', title, duration)
  }
  
  // Confirmation toast that returns a promise
  const confirm = (message, title = 'Confirmation') => {
    return new Promise((resolve) => {
      const id = ++toastId
      // 只保留一个：添加前清空已有的
      toasts.value = []
      const toast = {
        id,
        message,
        type: 'warning',
        title,
        duration: 0, // Don't auto-remove
        isConfirmation: true,
        onConfirm: () => {
          removeToast(id)
          resolve(true)
        },
        onCancel: () => {
          removeToast(id)
          resolve(false)
        }
      }
      
      toasts.value.push(toast)
    })
  }
  
  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    confirm
  }
}

// Create a global instance for injection
export const createToastProvider = () => {
  return useToast()
}