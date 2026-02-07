<template>
  <div class="p-4 bg-white rounded-lg border border-solid border-[#dee2e6]">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-bold m-0 text-gray-700">Domino Palette</h3>
      <button
        @click="$emit('regenerate-dominoes')"
        class="px-5 py-2 rounded-full font-medium text-white border-0 bg-green-500 transition-all duration-300 ease-in-out hover:bg-green-600 hover:-translate-y-0.5"
      >
        Regenerate Dominoes
      </button>
    </div>
    <p class="text-sm text-gray-500 mb-4">Drag dominoes onto the board. Click a domino in the palette to rotate it before placing.</p>

    <div
      class="bg-gray-100 p-4 rounded-lg min-h-[120px] border-2 border-dashed border-gray-300 flex flex-wrap justify-center items-start gap-4 transition-colors duration-200"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <DominoDisplay
        v-for="domino in unplacedDominoes"
        :key="domino.id"
        :domino="domino"
        @drag-start="(grabOffset) => $emit('domino-drag-start', domino.id, grabOffset)"
        @rotate="() => $emit('domino-rotate', domino.id)"
      />
      <div
        v-if="unplacedDominoes.length === 0"
        class="flex items-center justify-center w-full min-h-[90px] text-center text-gray-500 leading-6"
      >
        <p>All dominoes placed! <br /> You can now proceed to define regions.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  unplacedDominoes: {
    type: Array,
    required: true
  }
})

defineEmits(['domino-drag-start', 'domino-rotate', 'drop-in-palette'])

const handleDragOver = (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = "move"
}

const handleDrop = (e) => {
  e.preventDefault()
  $emit('drop-in-palette')
}
</script>

<script>
import DominoDisplay from './DominoDisplay.vue'

export default {
  components: {
    DominoDisplay
  }
}
</script>