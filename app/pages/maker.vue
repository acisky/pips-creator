<template>
    <div class="max-w-4xl mx-auto p-5 space-y-8">
        <div class="text-center">
            <h2 class="text-2xl font-bold text-[#333333]">{{ PhaseContent.title }}</h2>
            <p class="text-md text-[#666666] mt-2">{{ PhaseContent.instruction }}</p>
        </div>

        <div
            class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 p-4 bg-white border border-solid border-[#dee2e6] rounded-lg">
            <div class="flex items-center space-x-4">
                <button @click="handleReset"
                    class="px-4 py-2 rounded-lg font-semibold text-[#666666] bg-white border border-solid border-[#dee2e6] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors duration-200">
                    Reset All
                </button>
                <div
                    class="bg-[#fbf9f5] border border-solid border-[#dee2e6] px-3 py-1.5 rounded-lg text-sm font-medium text-[#333333]">
                    Active Cells: <span class="font-bold">{{ activeCellCount }}</span>
                </div>
            </div>
            <div v-if="appPhase === 'defineArea'" class="flex items-center gap-2">
                <span class="font-medium text-[#333333]">Grid Rows:</span>
                <button @click="handleGridResize(1, 0)"
                    class="px-3 py-1 bg-white border border-solid border-[#dee2e6] rounded-lg hover:bg-gray-50 text-[#333333] font-medium">+</button>
                <button @click="handleGridResize(-1, 0)"
                    class="px-3 py-1 bg-white border border-solid border-[#dee2e6] rounded-lg hover:bg-gray-50 text-[#333333] font-medium">-</button>
                <span class="font-semibold text-[#333333]">{{ gridDims.rows }} Rows</span>
            </div>
        </div>

        <div class="flex flex-col items-center">
            <div class="grid gap-0 p-4 bg-[#f5f5f4] border border-solid border-[#dee2e6] rounded-lg"
                :style="{ gridTemplateColumns: `repeat(${gridDims.cols}, minmax(0, 1fr))` }"
                @mouseleave="isMouseDown = false">
                <template v-for="(row, y) in puzzleData.rows" :key="`row-${y}`">
                    <GridCell v-for="(cell, x) in row" :key="`cell-${y}-${x}`" :x="x" :y="y"
                        :className="getCellClassName(y, x)" @mouse-down="handleMouseDown(y, x)"
                        @mouse-enter="handleMouseEnter(y, x)" @drop="(e) => handleGridDrop(e, y, x)"
                        @drag-over="handleGridDragOver" @click="() => handleDominoClick(y, x)">
                        <div class="w-full h-full flex items-center justify-center"
                            :draggable="appPhase === 'placeDominoes' && !!cellToDominoMap[`${y},${x}`]"
                            @dragstart="(e) => handleGridDragStart(e, y, x)">
                            <template v-if="appPhase === 'defineRegions'">
                                <span v-if="cellToRegionMap[`${y},${x}`]"
                                    :class="`font-bold text-lg ${COLOR_MAP[cellToRegionMap[`${y},${x}`].color].text}`">
                                    {{ cellToRegionMap[`${y},${x}`].computedValue }}
                                </span>
                                <span v-else-if="cellToDominoMap[`${y},${x}`]"
                                    class="font-bold text-xl text-[#333333] select-none">
                                    {{ cellToDominoMap[`${y},${x}`].pip }}
                                </span>
                            </template>
                            <template v-else>
                                <span v-if="cellToDominoMap[`${y},${x}`]"
                                    class="font-bold text-xl text-[#333333] select-none">
                                    {{ cellToDominoMap[`${y},${x}`].pip }}
                                </span>
                            </template>
                        </div>
                    </GridCell>
                </template>
            </div>
        </div>

        <div v-if="appPhase === 'placeDominoes'">
            <div v-if="puzzleData.dominoes.length === 0"
                class="flex items-center justify-center gap-4 p-4 bg-white border border-solid border-[#dee2e6] rounded-lg">
                <div class="flex items-center gap-2">
                    <label for="domino-count" class="font-medium text-[#333333] whitespace-nowrap">Domino
                        Count:</label>
                    <input id="domino-count" type="number" :value="dominoCountToGenerate"
                        @input="dominoCountToGenerate = parseInt($event.target.value) || 10" min="1" max="28"
                        class="w-20 p-2 border border-[#cccccc] rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-[#333333]" />
                </div>
                <button @click="handleGenerateDominoes"
                    class="px-5 py-2 rounded-full font-medium text-white border-0 bg-green-500 transition-all duration-300 ease-in-out hover:bg-green-600 hover:-translate-y-0.5">
                    Generate Dominoes
                </button>
            </div>
            <DominoPalette v-else @regenerate-dominoes="handleRegenerateDominoes" :unplaced-dominoes="unplacedDominoes"
                @domino-drag-start="handleDominoDragStart" @domino-rotate="handleDominoRotate"
                @drop-in-palette="handlePaletteDrop" />
        </div>

        <div v-if="appPhase === 'defineRegions'" class="flex justify-center items-center">
            <RegionForm @create-region="handleCreateRegion"
                @clear-selection="() => { selectedCells = new Set(); highlightedRegion = null; }"
                @delete-region="handleDeleteRegion" :selected-count="selectedCells.size"
                :highlighted-region="highlightedRegion" />
        </div>

        <div
            class="flex justify-between items-center mt-6 bg-white/90 rounded-full p-1 backdrop-blur-md border border-[#2b2e3a]/10">
            <button @click="handlePrevStep" :disabled="appPhase === 'defineArea'"
                class="text-[#2b2e3a] font-medium text-sm py-2 px-5 rounded-full transition-all duration-300 ease-in-out relative overflow-hidden hover:bg-[#2b2e3a]/5 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#2b2e3a]/5 disabled:translate-y-0">
                Previous Step
            </button>
            <button @click="handleNextStep" :disabled="appPhase === 'placeDominoes' && unplacedDominoes.length > 0"
                class="bg-[#2b2e3a] text-white font-medium text-sm py-2 px-5 rounded-full transition-all duration-300 ease-in-out relative overflow-hidden hover:bg-[#1a1d26] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#2b2e3a]/50 disabled:translate-y-0">
                Next Step
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession()
import GridCell from './../components/GridCell.vue'
import RegionForm from './../components/RegionForm.vue'
import DominoPalette from './../components/DominoPalette.vue'
import { COLOR_MAP, getColorByComputedValue } from './../types'

// Inject toast functionality
const { success, error, warning, info, confirm } = inject('toast')
const router = useRouter()

// custom title and description
useHead({
    title: 'Pips Puzzle Creator',
    meta: [
        { name: 'description', content: 'Create unique pips puzzles with flexible grid design, smart pips placement, and region rule definition.' }
    ],
    link: [
        { rel: 'canonical', href: 'https://pips-game.com' }
    ]
})

// 生成8位随机hash作为puzzleId
const generatePuzzleId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// 生成符合指定格式的JSON数据
const generatePuzzleJSON = () => {
    // 生成8位随机hash ID
    const id = generatePuzzleId()

    // 转换rows数据格式
    const rows = puzzleData.value.rows.map(row => [...row])

    // 转换regions数据格式
    const regions = puzzleData.value.regions.map(region => ({
        computedValue: region.computedValue,
        coordinates: region.coordinates.map(coord => ({
            y: coord.y,
            x: coord.x
        }))
    }))

    // 转换dominoes数据为dice格式
    const dice = puzzleData.value.dominoes
        .filter(domino => domino.placement) // 只包含已放置的骨牌
        .map(domino => {
            // 根据旋转角度确定点数顺序
            const pips = (domino.rotation === 180 || domino.rotation === 270)
                ? [domino.pips[1], domino.pips[0]]  // 旋转180°或270°时交换点数顺序
                : domino.pips
            return pips
        })

    return {
        id,
        userId: user.value?.id || null, // 添加用户ID，如果用户未登录则为null
        row: rows,
        regions,
        dice
    }
}

// 添加提交锁定状态
const isSubmitting = ref(false)

// 保存拼图到数据库的函数
const savePuzzleToDatabase = async (puzzleData) => {
    // 如果已经在提交中，则不允许重复提交
    if (isSubmitting.value) {
        info('正在提交中，请稍候...')
        return
    }

    try {
        // 设置提交锁定状态
        isSubmitting.value = true

        // 使用 Nuxt 的 $fetch 调用 API
        const response = await $fetch('/api/puzzles', {
            method: 'POST',
            body: puzzleData
        })

        if (response.success) {
            success(response.message)
            // console.log('Puzzle saved successfully:', response.data)
            router.push('/account')
        } else {
            throw new Error(response.message || '保存失败')
        }
    } catch (err) {
        console.error('Error saving puzzle to database:', err)

        if (err.statusCode === 409) {
            // ID冲突，重新生成ID并重试
            const newPuzzleData = {
                ...puzzleData,
                id: generatePuzzleId()
            }
            // 递归调用时不需要重置isSubmitting，保持锁定状态
            return await savePuzzleToDatabase(newPuzzleData)
        }

        error(`保存拼图失败: ${err.data?.message || err.message}`)
    } finally {
        // 无论成功或失败，最终都要解除提交锁定状态
        isSubmitting.value = false
    }
}

// 生成随机、唯一的多米诺骨牌集合的辅助函数
const generateUniqueDominoes = (count) => {
    // 创建所有可能的多米诺骨牌点数组合（0-0到6-6）
    const allPossiblePips = []
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            allPossiblePips.push([i, j])
        }
    }

    // 使用Fisher-Yates洗牌算法随机打乱骨牌顺序
    for (let i = allPossiblePips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[allPossiblePips[i], allPossiblePips[j]] = [allPossiblePips[j], allPossiblePips[i]]
    }

    // 检查请求的骨牌数量是否超过可能的组合数
    if (count > allPossiblePips.length) {
        console.warn(`请求了${count}个骨牌，但只有${allPossiblePips.length}种唯一组合。`)
        return allPossiblePips.map(pips => ({ pips, placement: null, rotation: 0 }))
    }

    // 返回指定数量的骨牌，每个骨牌包含点数、放置位置和旋转角度信息
    return allPossiblePips.slice(0, count).map(pips => ({
        pips,        // 骨牌两端的点数
        placement: null,  // 骨牌在网格中的位置，初始为null
        rotation: 0,      // 骨牌的旋转角度，初始为0度
    }))
}

// 响应式状态定义
const gridDims = ref({ rows: 8, cols: 8 })  // 网格尺寸，默认8行8列
const puzzleData = ref({
    rows: Array(8).fill(0).map(() => Array(8).fill(0)),  // 初始化8x8的网格，所有单元格值为0
    regions: [],  // 区域数组，用于存储用户定义的区域
    dominoes: [],  // 多米诺骨牌数组
})

const appPhase = ref('defineArea')  // 应用阶段：'defineArea'(定义区域)、'placeDominoes'(放置骨牌)、'defineRegions'(定义区域)
const selectedCells = ref(new Set())  // 当前选中的单元格集合
const isMouseDown = ref(false)  // 鼠标按下状态标志
const activationDragState = ref(null)  // 拖动激活状态（0或1）
const draggedDominoId = ref(null)  // 当前拖动的骨牌ID
const draggedDominoGrabOffset = ref(null)  // 拖动时抓取的位置（0或1，表示抓取第一个还是第二个单元格）
const highlightedRegion = ref(null)  // 当前高亮显示的区域
const dominoCountToGenerate = ref(10)  // 要生成的骨牌数量，默认为10
const invalidCells = ref(new Set())  // 无效单元格集合，用于验证

// 计算属性
const activeCellCount = computed(() => {
    // 计算激活单元格（值为1）的总数
    return puzzleData.value.rows.reduce((sum, row) => sum + row.filter(cell => cell === 1).length, 0)
})

const unplacedDominoes = computed(() => {
    // 获取尚未放置在网格上的骨牌（placement为null）
    return puzzleData.value.dominoes.filter(d => d.placement === null)
})

const cellToDominoMap = computed(() => {
    // 创建单元格坐标到骨牌信息的映射
    const map = {}
    puzzleData.value.dominoes.forEach(domino => {
        if (domino.placement) {
            // 根据骨牌旋转角度确定点数显示顺序
            const pips = (domino.rotation === 180 || domino.rotation === 270)
                ? [domino.pips[1], domino.pips[0]]  // 旋转180°或270°时交换点数顺序
                : domino.pips
            // 将骨牌的两个单元格分别映射到对应的点数和位置信息
            map[`${domino.placement[0].y},${domino.placement[0].x}`] = { domino, pip: pips[0], isFirstHalf: true }
            map[`${domino.placement[1].y},${domino.placement[1].x}`] = { domino, pip: pips[1], isFirstHalf: false }
        }
    })
    return map
})

const cellToRegionMap = computed(() => {
    // 创建单元格坐标到区域的映射
    const map = {}
    puzzleData.value.regions.forEach(region => {
        region.coordinates.forEach(coord => {
            map[`${coord.y},${coord.x}`] = region
        })
    })
    return map
})

// 事件处理函数
const handleReset = async () => {
    const confirmed = await confirm('Are you sure you want to reset the entire puzzle?', 'Reset Confirmation')
    if (confirmed) {
        // 重置所有状态到初始值
        gridDims.value = { rows: 8, cols: 8 }
        puzzleData.value = {
            rows: Array(8).fill(0).map(() => Array(8).fill(0)),
            regions: [],
            dominoes: [],
        }
        appPhase.value = 'defineArea'
        selectedCells.value = new Set()
        highlightedRegion.value = null
        draggedDominoId.value = null
        dominoCountToGenerate.value = 10
        invalidCells.value = new Set()
        success('Puzzle has been reset successfully')
    }
}

const handleGridResize = async (dRow, dCol) => {
    // 计算新的行数，确保最小为4行
    const newRows = Math.max(4, gridDims.value.rows + dRow)
    const newCols = 8 // 固定列数为8

    // 如果行数没有变化，则不执行任何操作
    if (newRows === gridDims.value.rows) return

    // 调整网格大小会重置整个拼图，需要用户确认
    const confirmed = await confirm('Resizing the grid will reset the entire puzzle. Do you want to continue?', 'Grid Resize Confirmation')
    if (confirmed) {
        gridDims.value = { rows: newRows, cols: newCols }
        puzzleData.value = {
            rows: Array(newRows).fill(0).map(() => Array(newCols).fill(0)),
            regions: [],
            dominoes: [],
        }
        selectedCells.value = new Set()
        invalidCells.value = new Set()
        highlightedRegion.value = null
        success(`Grid resized to ${newRows} rows successfully`)
    }
}

const handleMouseDown = (y, x) => {
    // 如果当前处于定义区域阶段，则处理区域选择
    if (appPhase.value === 'defineRegions') {
        handleRegionSelection(y, x)
        return
    }
    // 如果不是在定义区域阶段，则不处理
    if (appPhase.value !== 'defineArea') return

    invalidCells.value = new Set() // 编辑时清除验证错误
    isMouseDown.value = true
    const currentActivation = puzzleData.value.rows[y][x]
    const newActivation = currentActivation === 1 ? 0 : 1  // 切换单元格状态
    activationDragState.value = newActivation

    // 创建新的行数组并更新单元格状态
    const newRows = puzzleData.value.rows.map(row => [...row])
    newRows[y][x] = newActivation
    puzzleData.value = { rows: newRows, regions: [], dominoes: [] } // 更改时重置
}

const handleMouseEnter = (y, x) => {
    // 只有在鼠标按下且处于定义区域阶段时才处理
    if (!isMouseDown.value || appPhase.value !== 'defineArea') return

    // 如果拖动状态为空或单元格已经是目标状态，则不处理
    if (activationDragState.value === null || puzzleData.value.rows[y][x] === activationDragState.value) return
    const newRows = puzzleData.value.rows.map(row => [...row])
    newRows[y][x] = activationDragState.value
    puzzleData.value = { ...puzzleData.value, rows: newRows }
}

const handleRegionSelection = (y, x) => {
    // 只有在定义区域阶段且单元格为激活状态时才处理
    if (appPhase.value !== 'defineRegions' || puzzleData.value.rows[y][x] !== 1) return
    const key = `${y},${x}`

    // 如果单元格已被选中，则取消选中
    if (selectedCells.value.has(key)) {
        const newSelectedCells = new Set(selectedCells.value)
        newSelectedCells.delete(key)
        selectedCells.value = newSelectedCells
        return
    }

    // 检查单元格是否已属于某个区域
    const existingRegion = cellToRegionMap.value[key]
    if (existingRegion) {
        // 如果有选中的单元格，则清空选择
        if (selectedCells.value.size > 0) selectedCells.value = new Set()
        // 切换区域高亮状态
        highlightedRegion.value = highlightedRegion.value === existingRegion ? null : existingRegion
        return
    }

    // 如果有高亮区域，则取消高亮
    if (highlightedRegion.value) highlightedRegion.value = null
    // 将单元格添加到选中集合
    const newSelectedCells = new Set(selectedCells.value)
    newSelectedCells.add(key)
    selectedCells.value = newSelectedCells
}

const handleGenerateDominoes = async () => {
    // 验证骨牌数量是否在有效范围内
    if (dominoCountToGenerate.value <= 0 || dominoCountToGenerate.value > 28) {
        error("Please enter a domino count between 1 and 28.", "Invalid Input")
        return
    }

    // 检查激活单元格是否足够放置所有骨牌
    if (activeCellCount.value < dominoCountToGenerate.value * 2) {
        const confirmed = await confirm(
            `You are generating ${dominoCountToGenerate.value} dominoes, which requires ${dominoCountToGenerate.value * 2} cells, but only ${activeCellCount.value} cells are active. This may make the puzzle unsolvable. Do you want to continue?`,
            'Insufficient Active Cells'
        )
        if (!confirmed) {
            return
        }
    }

    // 生成新的骨牌集合并更新状态
    const newDominoes = generateUniqueDominoes(dominoCountToGenerate.value)
    puzzleData.value = {
        ...puzzleData.value,
        dominoes: newDominoes.map((d, i) => ({ ...d, id: i }))  // 为每个骨牌添加唯一ID
    }
    success(`Successfully generated ${dominoCountToGenerate.value} dominoes`)
}

const handleRegenerateDominoes = () => {
    handleGenerateDominoes()
}

// 处理从网格拖动骨牌
const handleGridDragStart = (e, y, x) => {
    const dominoInfo = cellToDominoMap.value[`${y},${x}`]
    if (!dominoInfo) return

    e.stopPropagation()

    const { domino, isFirstHalf } = dominoInfo
    const grabOffset = isFirstHalf ? 0 : 1

    // 创建一个临时的拖动图像元素
    const dragImage = document.createElement('div')
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    dragImage.style.left = '-1000px'

    const isHorizontal = domino.rotation % 180 === 0
    const cellSize = 56 // 约14*4 (md:w-14 md:h-14)

    if (isHorizontal) {
        dragImage.style.width = `${cellSize * 2}px`
        dragImage.style.height = `${cellSize}px`
    } else {
        dragImage.style.width = `${cellSize}px`
        dragImage.style.height = `${cellSize * 2}px`
    }

    dragImage.style.display = 'flex'
    dragImage.style.flexDirection = isHorizontal ? 'row' : 'column'
    dragImage.style.gap = '0'
    dragImage.style.backgroundColor = '#e7e5e4'
    dragImage.style.border = '3px solid #57534e'
    dragImage.style.borderRadius = '6px'
    dragImage.style.padding = '4px'

    // 获取骨牌的点数
    const pips = (domino.rotation === 180 || domino.rotation === 270)
        ? [domino.pips[1], domino.pips[0]]
        : domino.pips

    // 创建两个半部分
    for (let i = 0; i < 2; i++) {
        const half = document.createElement('div')
        half.style.flex = '1'
        half.style.display = 'flex'
        half.style.alignItems = 'center'
        half.style.justifyContent = 'center'
        half.style.backgroundColor = 'white'
        half.style.borderRadius = '4px'
        half.style.margin = '2px'
        half.style.border = '1px solid #d6d3d1'
        half.style.fontSize = '24px'
        half.style.fontWeight = 'bold'
        half.style.color = '#1f2937'
        half.textContent = pips[i]
        dragImage.appendChild(half)
    }

    document.body.appendChild(dragImage)

    // 计算拖动图像的热点位置
    let offsetX, offsetY
    if (isHorizontal) {
        offsetX = isFirstHalf ? cellSize / 2 : cellSize * 1.5
        offsetY = cellSize / 2
    } else {
        offsetX = cellSize / 2
        offsetY = isFirstHalf ? cellSize / 2 : cellSize * 1.5
    }

    e.dataTransfer.setDragImage(dragImage, offsetX, offsetY)

    // 延迟移除临时元素
    setTimeout(() => {
        document.body.removeChild(dragImage)
    }, 0)

    handleDominoDragStart(domino.id, grabOffset)
}

// 处理骨牌拖动开始
const handleDominoDragStart = (id, grabOffset = 0) => {
    draggedDominoId.value = id
    draggedDominoGrabOffset.value = grabOffset
}

// 处理网格拖动悬停
const handleGridDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }

const handleGridDrop = (e, y, x) => {
    e.preventDefault()
    // 如果没有拖动的骨牌，则不处理
    if (draggedDominoId.value === null) return
    const domino = puzzleData.value.dominoes.find(d => d.id === draggedDominoId.value)
    if (!domino) return

    // 创建更新后的骨牌数组，将当前拖动的骨牌位置设为null
    const updatedDominoes = puzzleData.value.dominoes.map(d =>
        d.id === draggedDominoId.value ? { ...d, placement: null } : d
    )

    // 检查其他骨牌是否已占用目标位置
    const otherCellsOccupied = (coords) => {
        const currentCellMap = new Map()
        updatedDominoes.forEach(d => {
            if (d.placement) {
                currentCellMap.set(`${d.placement[0].y},${d.placement[0].x}`, d.id)
                currentCellMap.set(`${d.placement[1].y},${d.placement[1].x}`, d.id)
            }
        })
        return coords.some(c => currentCellMap.has(`${c.y},${c.x}`))
    }

    // 根据骨牌旋转角度确定形状（水平或垂直）
    const isHorizontal = (domino.rotation % 180 === 0)

    // 计算骨牌应该放置的位置
    // grabOffset: 0 表示抓取的是第一个单元格，1 表示第二个单元格
    let p1X = x
    let p1Y = y

    // 如果抓取的是第二个单元格，需要调整第一个单元格的位置
    if (draggedDominoGrabOffset.value === 1) {
        if (isHorizontal) {
            p1X = x - 1  // 水平骨牌：第一个单元格在左边
        } else {
            p1Y = y - 1  // 垂直骨牌：第一个单元格在上边
        }
    }

    // 计算第二个单元格的位置
    const p2X = isHorizontal ? p1X + 1 : p1X
    const p2Y = isHorizontal ? p1Y : p1Y + 1

    // 构建新的placement
    const newPlacement = [
        { y: p1Y, x: p1X },
        { y: p2Y, x: p2X }
    ]

    // 验证两个单元格都在网格范围内
    const inBounds =
        p1X >= 0 && p1X < gridDims.value.cols &&
        p1Y >= 0 && p1Y < gridDims.value.rows &&
        p2X >= 0 && p2X < gridDims.value.cols &&
        p2Y >= 0 && p2Y < gridDims.value.rows

    if (!inBounds) {
        draggedDominoId.value = null
        draggedDominoGrabOffset.value = null
        return
    }

    // 验证两个单元格都是激活状态且没有被其他骨牌占用
    const isValid =
        puzzleData.value.rows[p1Y][p1X] === 1 &&
        puzzleData.value.rows[p2Y][p2X] === 1 &&
        !otherCellsOccupied(newPlacement)

    // 如果放置有效，则更新骨牌位置
    if (isValid) {
        puzzleData.value = {
            ...puzzleData.value,
            dominoes: puzzleData.value.dominoes.map(d =>
                d.id === draggedDominoId.value ? { ...d, placement: newPlacement } : d
            )
        }
    }

    // 重置拖动状态
    draggedDominoId.value = null
    draggedDominoGrabOffset.value = null
}

const handlePaletteDrop = () => {
    // 将骨牌放回调色板（取消放置）
    if (draggedDominoId.value === null) return
    puzzleData.value = {
        ...puzzleData.value,
        dominoes: puzzleData.value.dominoes.map(d => d.id === draggedDominoId.value ? { ...d, placement: null } : d)
    }
    draggedDominoId.value = null
    draggedDominoGrabOffset.value = null
}

const handleDominoRotate = (id) => {
    // 旋转未放置的骨牌
    puzzleData.value = {
        ...puzzleData.value,
        dominoes: puzzleData.value.dominoes.map(d => {
            if (d.id === id && d.placement === null) {
                return { ...d, rotation: (d.rotation + 90) % 360 }  // 每次旋转90度
            }
            return d
        })
    }
}

const handleDominoClick = (y, x) => {
    // 单击将已放置的骨牌还原到调色板
    if (appPhase.value !== 'placeDominoes') return
    const info = cellToDominoMap.value[`${y},${x}`]
    if (!info) return

    const { domino } = info
    // 将骨牌的placement设置为null，使其回到调色板
    puzzleData.value = {
        ...puzzleData.value,
        dominoes: puzzleData.value.dominoes.map(d =>
            d.id === domino.id ? { ...d, placement: null } : d
        )
    }
}

const handleCreateRegion = (computedValue) => {
    if (selectedCells.value.size === 0) return

    // 检查选择的区域是否连通
    if (!isSelectedCellsConnected()) {
        error('The selected region must be connected. Please ensure all selected cells are adjacent to each other.', 'Invalid Region')
        return
    }

    // 根据 computedValue 自动选择颜色
    const color = getColorByComputedValue(computedValue)

    const newRegion = {
        color, computedValue,
        coordinates: Array.from(selectedCells.value).map(key => {
            const [y, x] = key.split(',').map(Number)
            return { y, x }
        }),
    }
    // 添加新区域到区域列表
    puzzleData.value = { ...puzzleData.value, regions: [...puzzleData.value.regions, newRegion] }
    selectedCells.value = new Set()
    highlightedRegion.value = null
    success(`Region with value ${computedValue} created successfully`)
}

// 检查选择的单元格是否连通
const isSelectedCellsConnected = () => {
    if (selectedCells.value.size <= 1) return true

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    const visited = new Set()
    const cells = Array.from(selectedCells.value).map(key => key.split(',').map(Number))

    // 从第一个单元格开始进行广度优先搜索
    const queue = [cells[0]]
    visited.add(`${cells[0][0]},${cells[0][1]}`)

    while (queue.length > 0) {
        const [y, x] = queue.shift()

        // 检查四个方向的相邻单元格
        for (const [dy, dx] of directions) {
            const ny = y + dy
            const nx = x + dx
            const key = `${ny},${nx}`

            // 如果相邻单元格在选中集合中且未访问过，则加入队列
            if (selectedCells.value.has(key) && !visited.has(key)) {
                visited.add(key)
                queue.push([ny, nx])
            }
        }
    }

    // 如果访问过的单元格数量等于选中的单元格数量，则所有单元格都是连通的
    return visited.size === selectedCells.value.size
}

const handleDeleteRegion = async () => {
    if (!highlightedRegion.value) return
    const confirmed = await confirm('Are you sure you want to delete this region?', 'Delete Region')
    if (confirmed) {
        // 从regions数组中移除高亮的区域
        puzzleData.value = {
            ...puzzleData.value,
            regions: puzzleData.value.regions.filter(r => r !== highlightedRegion.value)
        }
        highlightedRegion.value = null
        selectedCells.value = new Set()
        success('Region deleted successfully')
    }
}


const validateArea = () => {
    const newInvalidCells = new Set();
    const { rows } = puzzleData.value;
    const { rows: numRows, cols: numCols } = gridDims.value;
    const errorMessages = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    // --- 辅助函数 ---

    // 1. 找到所有连通区域 (保持不变)
    const getConnectedRegions = () => {
        const visited = new Set();
        const regions = [];
        for (let y = 0; y < numRows; y++) {
            for (let x = 0; x < numCols; x++) {
                if (rows[y][x] === 1 && !visited.has(`${y},${x}`)) {
                    const region = [];
                    const queue = [[y, x]];
                    visited.add(`${y},${x}`);
                    while (queue.length > 0) {
                        const [cY, cX] = queue.shift();
                        region.push([cY, cX]);
                        for (const [dy, dx] of directions) {
                            const nY = cY + dy, nX = cX + dx;
                            const key = `${nY},${nX}`;
                            if (nY >= 0 && nY < numRows && nX >= 0 && nX < numCols && rows[nY][nX] === 1 && !visited.has(key)) {
                                visited.add(key);
                                queue.push([nY, nX]);
                            }
                        }
                    }
                    regions.push(region);
                }
            }
        }
        return regions;
    };

    // 2. 找到所有被'1'完全包围的空洞
    const findHoles = () => {
        const visitedZeros = new Set();
        const holes = [];
        // 首先，通过洪水填充找到所有与外界连通的'0'
        const queue = [];
        for (let y = 0; y < numRows; y++) {
            for (let x = 0; x < numCols; x++) {
                if (rows[y][x] === 0 && (y === 0 || y === numRows - 1 || x === 0 || x === numCols - 1)) {
                    const key = `${y},${x}`;
                    if (!visitedZeros.has(key)) {
                        visitedZeros.add(key);
                        queue.push([y, x]);
                    }
                }
            }
        }
        let head = 0;
        while (head < queue.length) {
            const [y, x] = queue[head++];
            for (const [dy, dx] of directions) {
                const nY = y + dy, nX = x + dx;
                const key = `${nY},${nX}`;
                if (nY >= 0 && nY < numRows && nX >= 0 && nX < numCols && rows[nY][nX] === 0 && !visitedZeros.has(key)) {
                    visitedZeros.add(key);
                    queue.push([nY, nX]);
                }
            }
        }

        // 任何没有被访问到的'0'都属于一个内部空洞
        for (let y = 0; y < numRows; y++) {
            for (let x = 0; x < numCols; x++) {
                if (rows[y][x] === 0 && !visitedZeros.has(`${y},${x}`)) {
                    const hole = [];
                    const holeQueue = [[y, x]];
                    visitedZeros.add(`${y},${x}`);
                    while (holeQueue.length > 0) {
                        const [cY, cX] = holeQueue.shift();
                        hole.push([cY, cX]);
                        for (const [dy, dx] of directions) {
                            const nY = cY + dy, nX = cX + dx;
                            const key = `${nY},${nX}`;
                            if (nY >= 0 && nY < numRows && nX >= 0 && nX < numCols && rows[nY][nX] === 0 && !visitedZeros.has(key)) {
                                visitedZeros.add(key);
                                holeQueue.push([nY, nX]);
                            }
                        }
                    }
                    holes.push(hole);
                }
            }
        }
        return holes;
    };


    // --- 验证流程 ---

    const regions = getConnectedRegions();
    const holes = findHoles();

    // 当没有任何连通的激活区域时，也应触发“区域大小”错误
    if (regions.length === 0) {
        if (!errorMessages.includes("区域大小")) errorMessages.push("区域大小");
    }

    // 验证规则 1：检查区域大小
    for (const region of regions) {
        if (region.length < 2 || region.length % 2 !== 0) {
            if (!errorMessages.includes("区域大小")) errorMessages.push("区域大小");
            region.forEach(([y, x]) => newInvalidCells.add(`${y},${x}`));
        }
    }

    // 验证规则 2：检查所有空洞的墙壁是否存在“死胡同”
    if (holes.length > 0) {
        const allOnes = new Set();
        regions.forEach(region => region.forEach(([y, x]) => allOnes.add(`${y},${x}`)));

        for (const hole of holes) {
            const boundaryOnes = new Set();
            // 找到构成这个空洞墙壁的所有'1'
            for (const [y, x] of hole) {
                for (const [dy, dx] of directions) {
                    const nY = y + dy, nX = x + dx;
                    const key = `${nY},${nX}`;
                    if (allOnes.has(key)) {
                        boundaryOnes.add(key);
                    }
                }
            }

            // 检查墙壁上的每个'1'是否是死胡同
            for (const oneKey of boundaryOnes) {
                const [y, x] = oneKey.split(',').map(Number);
                let oneNeighbors = 0;
                for (const [dy, dx] of directions) {
                    const nY = y + dy, nX = x + dx;
                    if (allOnes.has(`${nY},${nX}`)) {
                        oneNeighbors++;
                    }
                }

                // 如果墙壁上的某个'1'只有一个'1'邻居，它就是死胡同
                if (oneNeighbors < 2) {
                    if (!errorMessages.includes("区域未封闭")) errorMessages.push("区域未封闭");
                    newInvalidCells.add(oneKey);
                }
            }
        }
    }


    // --- 最终结果 ---
    invalidCells.value = newInvalidCells;
    if (newInvalidCells.size > 0 || regions.length === 0) {
        let errorMessage = `
          <p class="m-0 mb-4">Found ${newInvalidCells.size} invalid cells</p>
          <ul>
            ${errorMessages.includes("区域大小") ? '<li>Region Size: Each region must contain at least 2 cells, and the number of cells must be even</li>' : ''}
            ${errorMessages.includes("区域未封闭") ? '<li>Unclosed Region: Internal boundaries of regions cannot have gaps or dead ends</li>' : ''}
          </ul>`;
        error(errorMessage, "Area Validation Failed");
        return false;
    }

    return true;
}


const handleNextStep = async () => {
    if (appPhase.value === 'defineArea') {
        if (validateArea()) {
            dominoCountToGenerate.value = activeCellCount.value / 2
            appPhase.value = 'placeDominoes'
            success('Area validation passed! You can now place dominoes.')
        }
    } else if (appPhase.value === 'placeDominoes') {
        appPhase.value = 'defineRegions'
        success('Moved to region definition step')
    } else if (appPhase.value === 'defineRegions') {
        // 生成JSON数据
        const jsonData = generatePuzzleJSON()
        // 检查Regions是否正确
        const checkResult = checkRegions(jsonData)
        if (!checkResult) {
            error('Region validation failed! Please check your regions.', 'Region Validation Failed')
            return
        }
        // 显示JSON数据
        console.log('Generated Puzzle JSON:', jsonData)
        // 提交数据到数据库
        await savePuzzleToDatabase(jsonData)
    }
}

const checkRegions = (jsonData) => {
    // 如果没有区域定义，返回 false
    if (!jsonData.regions || jsonData.regions.length === 0) {
        return false
    }

    // 验证每个区域
    return jsonData.regions.every(region => {
        // 检查区域是否有坐标
        if (!region.coordinates || region.coordinates.length === 0) {
            return false
        }

        // 检查区域是否有计算值
        if (!region.computedValue) {
            return false
        }

        // 获取区域内所有坐标上的骨牌值
        const coordinateValues = []
        region.coordinates.forEach(coord => {
            // 查找该坐标上的骨牌
            const dominoInfo = cellToDominoMap.value[`${coord.y},${coord.x}`]
            if (dominoInfo) {
                coordinateValues.push(dominoInfo.pip)
            }
        })

        // 如果区域内有坐标没有对应的骨牌值，则验证失败
        if (coordinateValues.length !== region.coordinates.length) {
            return false
        }

        // 计算区域内所有骨牌值的总和
        const totalValue = coordinateValues.reduce((sum, value) => sum + value, 0)

        // 根据不同类型的计算值进行验证
        if (region.computedValue === "=") {
            // 所有值必须相等
            return coordinateValues.every(value => value === coordinateValues[0])
        } else if (region.computedValue === "≠") {
            // 所有值必须不相等
            const uniqueValues = new Set(coordinateValues)
            return uniqueValues.size === coordinateValues.length
        } else if (region.computedValue.indexOf(">") === 0) {
            // 总和必须大于指定值
            const numValue = Number(region.computedValue.substring(1))
            return !isNaN(numValue) && totalValue > numValue
        } else if (region.computedValue.indexOf("<") === 0) {
            // 总和必须小于指定值
            const numValue = Number(region.computedValue.substring(1))
            return !isNaN(numValue) && totalValue < numValue
        } else {
            // 总和必须等于指定值
            const numValue = Number(region.computedValue)
            return !isNaN(numValue) && totalValue === numValue
        }
    })
}

const handlePrevStep = async () => {
    if (appPhase.value === 'placeDominoes') {
        if (puzzleData.value.dominoes.length > 0) {
            const confirmed = await confirm('Going back will clear all generated dominoes. Continue?', 'Clear Dominoes')
            if (!confirmed) return
        }
        puzzleData.value = { ...puzzleData.value, dominoes: [] }
        appPhase.value = 'defineArea'
        success('Returned to area definition step')
    } else if (appPhase.value === 'defineRegions') {
        appPhase.value = 'placeDominoes'
        success('Returned to domino placement step')
    }
}

const getCellClassName = (y, x) => {
    if (puzzleData.value.rows[y][x] === 0) return 'bg-gray-200'

    const dominoInfo = cellToDominoMap.value[`${y},${x}`]
    const region = cellToRegionMap.value[`${y},${x}`]
    const classes = []

    const isHighlighted = appPhase.value === 'defineRegions' && highlightedRegion?.value?.coordinates.some(c => c.x === x && c.y === y)
    const isSelected = appPhase.value === 'defineRegions' && selectedCells.value.has(`${y},${x}`)
    const isInvalid = appPhase.value === 'defineArea' && invalidCells.value.has(`${y},${x}`)

    if (isInvalid) {
        classes.push('bg-red-200 border-red-500 z-10')
    } else if (isSelected) {
        // 选中的单元格使用默认的灰色高亮，因为还没有输入 computedValue
        classes.push('bg-gray-200', 'border-2', 'border-solid', 'border-indigo-400')
    } else if (region) {
        classes.push(COLOR_MAP[region.color].bg)
    } else {
        classes.push('bg-white')
    }

    if (dominoInfo) classes.push('cursor-grab')
    else classes.push('cursor-pointer')

    if (isHighlighted) {
        const colorInfo = COLOR_MAP[highlightedRegion.value.color]
        classes.push(`border-2`, colorInfo.border, `z-10`)
    } else if (isSelected) {
        // 选中的单元格使用默认的边框样式
        classes.push(`border-2`, 'border-indigo-500', `z-10`)
    } else if (dominoInfo) {
        classes.push('border-2', 'border-solid', 'border-black')
        if (dominoInfo.domino.rotation % 180 === 0) { // 水平方向
            classes.push(dominoInfo.isFirstHalf ? 'border-r-transparent' : 'border-l-transparent')
        } else { // 垂直方向
            classes.push(dominoInfo.isFirstHalf ? 'border-b-transparent' : 'border-t-transparent')
        }
    } else if (region) {
        // 检查相邻单元格是否属于同一区域，设置相应的边框
        const neighbors = {
            top: cellToRegionMap.value[`${y - 1},${x}`], bottom: cellToRegionMap.value[`${y + 1},${x}`],
            left: cellToRegionMap.value[`${y},${x - 1}`], right: cellToRegionMap.value[`${y},${x + 1}`],
        }
        // 每条边独立设置：如果与同区域相邻则透明，否则使用区域颜色
        classes.push(neighbors.top === region ? 'border-t-transparent border-t-4' : `border-t-${region.color}-border border-t-4`)
        classes.push(neighbors.bottom === region ? 'border-b-transparent border-b-4' : `border-b-${region.color}-border border-b-4`)
        classes.push(neighbors.left === region ? 'border-l-transparent border-l-4' : `border-l-${region.color}-border border-l-4`)
        classes.push(neighbors.right === region ? 'border-r-transparent border-r-4' : `border-r-${region.color}-border border-r-4`)
    } else {
        classes.push('border', 'border-dashed', 'border-gray-400')
        if (appPhase.value === 'defineArea') classes.push('hover:bg-green-100')
    }

    return classes.join(' ')
}

const PhaseContent = computed(() => {
    const phaseInfo = {
        defineArea: { title: 'Step 1: Define Background Area', instruction: 'Click and drag to activate/deactivate cells for the puzzle area. You can also resize the grid.' },
        placeDominoes: { title: 'Step 2: Create & Place Dominoes', instruction: 'Drag dominoes to the grid. Click dominoes in the palette to rotate. Click placed dominoes to return them to palette.' },
        defineRegions: { title: 'Step 3: Define Regions', instruction: 'Click on cells to select them for a new region. Fill out the form to create it.' },
    }
    return phaseInfo[appPhase.value]
})

// Global mouse up handler
const handleMouseUpGlobal = () => {
    isMouseDown.value = false
    activationDragState.value = null
}

onBeforeMount(() => {
    if (!loggedIn.value) {
        router.push('/')
    }
})

onMounted(() => {
    window.addEventListener('mouseup', handleMouseUpGlobal)
})

onUnmounted(() => {
    window.removeEventListener('mouseup', handleMouseUpGlobal)
})
</script>
