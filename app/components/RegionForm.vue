<template>
  <div class="p-4 bg-white rounded-lg border border-solid border-[#dee2e6]">
    <h3 class="text-lg font-bold m-0 mb-3 text-gray-700">
      {{ highlightedRegion ? 'Manage Region' : 'Create Region' }}
    </h3>

    <!-- 显示高亮区域的信息和删除按钮 -->
    <div v-if="highlightedRegion" class="space-y-4">
      <div class="flex items-center justify-between mb-2">
        <div>
          <p class="text-base font-medium text-gray-700 m-0 mb-2">Selected Region</p>
          <p class="text-sm text-gray-600 m-0 mb-2">Value: <span class="font-semibold">{{
            highlightedRegion.computedValue
              }}</span></p>
          <p class="text-sm text-gray-600 m-0 mb-2">Cells: <span class="font-semibold">{{
            highlightedRegion.coordinates.length
              }}</span></p>
        </div>
      </div>
      <div class="flex space-x-2">
        <button type="button" @click="$emit('delete-region')"
          class="flex-1 bg-red-500 text-white font-medium py-2 px-4 rounded-full hover:bg-red-600 hover:-translate-y-0.5 transition-all duration-300 ease-in-out border border-red-500 hover:border-red-600">
          Delete Region
        </button>
        <button type="button" @click="handleClear"
          class="flex-1 bg-white text-[#2b2e3a] font-medium py-2 px-4 rounded-full hover:bg-[#2b2e3a]/5 hover:-translate-y-0.5 transition-all duration-300 ease-in-out border border-[#2b2e3a]/10">
          Deselect
        </button>
      </div>
    </div>

    <!-- 创建新区域的表单 -->
    <form v-else @submit="handleSubmit" class="space-y-4">
      <div>
        <label for="computed-value" class="block text-sm font-medium text-gray-600 mb-1">
          {{ `Computed Value (e.g., "15", "<12", ">4" , "=" , "≠" )` }} </label>
            <div class="flex space-x-2 mb-2">
              <button v-for="(preset, index) in ['=', '≠', '<', '>']" :key="index" type="button"
                @click="computedValue = preset"
                class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {{ preset }}
              </button>
            </div>
            <div class="relative">
              <input id="computed-value" type="text" v-model="computedValue" placeholder="Enter rule..."
                pattern="^[=≠]$|^[<>]\d+$|^\d+$"
                title="Please enter a valid value: number, comparison symbol (=, ≠) or comparison with number (<number, >number)"
                class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
              <p class="mt-1 text-xs text-gray-500">
                Color will be automatically assigned based on the value
              </p>
            </div>
      </div>
      <div class="flex items-center justify-between space-x-2 pt-2">
        <button type="submit" :disabled="selectedCount === 0 || computedValue.trim() === ''"
          class="w-full bg-[#4a86e8] text-white font-medium text-sm py-2 px-4 rounded-full hover:bg-white hover:border-[#4a86e8] hover:text-[#4a86e8] hover:-translate-y-0.5 transition-all duration-300 ease-in-out border border-[#2b2e3a] disabled:opacity-50 disabled:bg-[#2b2e3a]/50 disabled:border-[#2b2e3a]/50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:translate-y-0 cursor-pointer">
          Create ({{ selectedCount }} selected)
        </button>
        <button type="button" @click="handleClear" :disabled="selectedCount === 0"
          class="w-full bg-white text-[#2b2e3a] font-medium text-sm py-2 px-4 rounded-full hover:bg-[#2b2e3a]/5 hover:-translate-y-0.5 transition-all duration-300 ease-in-out border border-[#2b2e3a]/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#2b2e3a]/5 disabled:translate-y-0 cursor-pointer">
          Clear
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { COLOR_MAP } from '../types'

const props = defineProps({
  onCreateRegion: {
    type: Function,
    required: true
  },
  onClearSelection: {
    type: Function,
    required: true
  },
  selectedCount: {
    type: Number,
    required: true
  },
  highlightedRegion: {
    type: Object,
    default: null
  }
})

defineEmits(['delete-region'])

const computedValue = ref('')

const handleSubmit = (e) => {
  e.preventDefault()
  if (computedValue.value.trim() === '' || props.selectedCount === 0) {
    alert('Please select cells and enter a value for the region.')
    return
  }
  props.onCreateRegion(computedValue.value)
  computedValue.value = ''
}

const handleClear = () => {
  props.onClearSelection()
  computedValue.value = ''
}
</script>