<template>
  <div
    ref="dominoRef"
    :id="`domino-${domino.id}`"
    draggable="true"
    @dragstart="handleDragStart"
    @click.stop="handleClick"
    :class="`flex items-center justify-center p-1 rounded-md bg-stone-200 border-3 border-stone-600 cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-105 select-none ${isHorizontal ? 'flex-row' : 'flex-col'}`"
    :title="domino.placement ? 'Drag to move' : 'Click to rotate, drag to place'"
  >
    <div class="w-10 h-10 bg-white rounded flex items-center justify-center font-bold text-gray-800 border border-stone-300 pointer-events-none">
      <div class="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full p-0.5">
        <div
          v-for="(pos, idx) in getDotPositions(pips[0])"
          :key="idx"
          :class="getClassForPos(pos) + ' justify-self-center self-center w-1.5 h-1.5 bg-black rounded-full'"
        ></div>
      </div>
    </div>
    <div :class="`border-stone-400 pointer-events-none ${isHorizontal ? 'border-l-2 h-10' : 'border-t-2 w-10'}`"></div>
    <div class="w-10 h-10 bg-white rounded flex items-center justify-center font-bold text-gray-800 border border-stone-300 pointer-events-none">
      <div class="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full p-0.5">
        <div
          v-for="(pos, idx) in getDotPositions(pips[1])"
          :key="idx"
          :class="getClassForPos(pos) + ' justify-self-center self-center w-1.5 h-1.5 bg-black rounded-full'"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const dominoRef = ref(null)

// 将 props 赋值到变量以供脚本中使用
const props = defineProps({
  domino: {
    type: Object,
    required: true
  }
})

// 使用 defineEmits 返回的 emit 函数
const emit = defineEmits(['drag-start', 'rotate'])

const isHorizontal = computed(() => props.domino.rotation % 180 === 0)

const pips = computed(() => {
  return (props.domino.rotation === 180 || props.domino.rotation === 270)
    ? [props.domino.pips[1], props.domino.pips[0]]
    : props.domino.pips
})

// 将点数映射到标准多米诺的 3x3 位置集合
const getDotPositions = (count) => {
  const c = Math.max(0, Math.min(count, 6))
  switch (c) {
    case 0: return []
    case 1: return ['c']
    case 2: return ['tl', 'br']
    case 3: return ['tl', 'c', 'br']
    case 4: return ['tl', 'tr', 'bl', 'br']
    case 5: return ['tl', 'tr', 'c', 'bl', 'br']
    case 6: return ['tl', 'tr', 'ml', 'mr', 'bl', 'br']
    default: return []
  }
}

// 将位置标识转换为 Tailwind 的网格定位类
const getClassForPos = (pos) => {
  switch (pos) {
    case 'tl': return 'row-start-1 col-start-1'
    case 'tr': return 'row-start-1 col-start-3'
    case 'bl': return 'row-start-3 col-start-1'
    case 'br': return 'row-start-3 col-start-3'
    case 'c':  return 'row-start-2 col-start-2'
    case 'ml': return 'row-start-2 col-start-1'
    case 'mr': return 'row-start-2 col-start-3'
    default:   return ''
  }
}

// 处理点击事件（用于旋转）
const handleClick = (e) => {
  // 只有在调色板中（未放置）时才响应点击旋转
  if (!props.domino.placement) {
    emit('rotate')
  }
}

const handleDragStart = (e) => {
  // 获取骨牌元素的边界
  const rect = e.currentTarget.getBoundingClientRect()

  // 计算鼠标点击位置相对于骨牌元素的偏移
  const offsetX = e.clientX - rect.left
  const offsetY = e.clientY - rect.top

  // 根据骨牌方向和点击位置计算抓取的是哪一半
  let grabOffset = 0
  const horizontal = isHorizontal.value

  if (horizontal) {
    // 水平骨牌：检查点击位置是左半边还是右半边
    grabOffset = offsetX > rect.width / 2 ? 1 : 0
  } else {
    // 垂直骨牌：检查点击位置是上半边还是下半边
    grabOffset = offsetY > rect.height / 2 ? 1 : 0
  }

  // 设置拖动图像，使用实际点击位置作为热点
  e.dataTransfer.setDragImage(e.currentTarget, offsetX, offsetY)
  e.dataTransfer.effectAllowed = 'move'

  // 发送拖动开始事件，带上抓取偏移信息
  emit('drag-start', grabOffset)
}
</script>