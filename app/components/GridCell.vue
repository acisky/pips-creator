<template>
  <div
    @mousedown="$emit('mouse-down', x, y)"
    @mouseenter="$emit('mouse-enter', x, y)"
    @drop="$emit('drop', $event)"
    @dragover="$emit('drag-over', $event)"
    @click="$emit('click')"
    :class="`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center select-none transition-colors duration-150 ease-in-out relative ${className}`"
  >
    <span class="absolute top-0 left-1 text-xs text-gray-400">{{ y }},{{ x }}</span>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  className: {
    type: String,
    default: ''
  }
})

defineEmits(['mouse-down', 'mouse-enter', 'drop', 'drag-over', 'click'])
</script>