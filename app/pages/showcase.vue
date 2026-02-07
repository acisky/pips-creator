<script setup>
import PuzzleCanvas from '~/components/PuzzleCanvas.vue'
import { ref, computed, watch } from 'vue'

const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession()
const router = useRouter()

// custom title and description
useHead({
    title: 'Showcase - Pips Puzzle Creator',
    meta: [
        { name: 'description', content: 'Create unique pips puzzles with flexible grid design, smart pips placement, and region rule definition.' }
    ]
})

const userLikedPuzzles = ref(new Set()) // 存储用户已点赞的拼图ID
const currentPage = ref(0)
const pageSize = ref(20)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))
const visiblePages = computed(() => {
    const pages = []
    const total = totalPages.value
    const current = currentPage.value + 1

    if (total <= 5) {
        for (let i = 1; i <= total; i++) {
            pages.push(i)
        }
    } else {
        if (current <= 3) {
            for (let i = 1; i <= 5; i++) {
                pages.push(i)
            }
        } else if (current >= total - 2) {
            for (let i = total - 4; i <= total; i++) {
                pages.push(i)
            }
        } else {
            for (let i = current - 2; i <= current + 2; i++) {
                pages.push(i)
            }
        }
    }
    return pages
})

// 使用 useFetch 预获取拼图数据
const { data: puzzlesResult, refresh } = useFetch('/api/get_puzzles', {
    query: {
        limit: pageSize,
        offset: computed(() => currentPage.value * pageSize.value),
        user_id: computed(() => user.value?.id)
    }
})

const puzzleList = computed(() => puzzlesResult.value?.data || [])

// 刷新数据的函数，用于后续可能的分页加载
const refreshPuzzlesWithPage = async (page = 0) => {
    try {
        const response = await $fetch('/api/get_puzzles', {
            query: {
                limit: pageSize.value,
                offset: page * pageSize.value,
                user_id: user.value?.id
            }
        })

        updateUserLikedPuzzles(response.data)
        return response.data
    } catch (error) {
        console.error('Failed to fetch puzzles:', error)
        throw error
    }
}

// 更新用户已点赞的拼图集合
const updateUserLikedPuzzles = (puzzles) => {
    userLikedPuzzles.value.clear()
    // 从拼图数据中提取已点赞的拼图ID
    for (const puzzle of puzzles) {
        if (puzzle.hasLiked) {
            userLikedPuzzles.value.add(puzzle.puzzle_id)
        }
    }
}

const likePuzzle = async (puzzleId) => {
    if (loggedIn.value) {
        try {
            const response = await $fetch('/api/update_like', {
                method: 'POST',
                body: {
                    puzzleId: puzzleId,
                    action: 'toggle',
                    user_id: user.value?.id
                }
            })

            // 更新前端数据
            const updatedPuzzle = response.data
            const puzzleIndex = puzzleList.value?.findIndex(p => p.puzzle_id === puzzleId)

            if (puzzleIndex !== -1) {
                // 更新拼图的点赞数
                puzzleList.value[puzzleIndex].likes = updatedPuzzle.likes

                // 更新用户点赞状态
                if (updatedPuzzle.action === 'liked') {
                    userLikedPuzzles.value.add(puzzleId)
                    puzzleList.value[puzzleIndex].hasLiked = true
                } else if (updatedPuzzle.action === 'unliked') {
                    userLikedPuzzles.value.delete(puzzleId)
                    puzzleList.value[puzzleIndex].hasLiked = false
                }
            }

            return response.data
        } catch (error) {
            console.error('Failed to like puzzle:', error)
            throw error
        }
    } else {
        openInPopup('/api/auth/google')
    }
}

const toPuzzle = (puzzleId) => {
    window.open(`https://pips-game.com/?customId=${puzzleId}`, '_blank')
}

// 分页导航函数
const navigateToPage = (page) => {
    if (page >= 0 && page < totalPages.value) {
        currentPage.value = page
        refresh()
    }
}

const goToPreviousPage = () => {
    if (currentPage.value > 0) {
        currentPage.value--
        refresh()
    }
}

const goToNextPage = () => {
    if (currentPage.value < totalPages.value - 1) {
        currentPage.value++
        refresh()
    }
}

watch(puzzlesResult, (newResult) => {
    if (newResult) {
        totalItems.value = newResult.total || 0
        updateUserLikedPuzzles(newResult.data || [])
    }
}, { immediate: true })
</script>

<template>
    <div>
        <div class="max-w-6xl mx-auto px-5 py-10">
            <h2 class="text-3xl font-bold text-center text-[#333333] m-0 mb-12">Showcase</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div v-for="puzzle in puzzleList" :key="puzzle.puzzle_id"
                    class="bg-white border border-solid border-[#dee2e6] rounded-lg p-4">
                    <div class="rounded-lg overflow-hidden position-relative relative group">
                        <PuzzleCanvas :rowData="puzzle.row_data" :regions="puzzle.regions_data" :width="560"
                            :height="560" class="border rounded w-full" />
                        <div
                            class="absolute top-2 right-2 flex items-center justify-center bg-white/80 backdrop-blur-[1px] px-2 py-1 rounded-full shadow-sm">
                            <svg width="16" height="16" viewBox="0 0 12 12" class="mr-1 text-red-500"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M8.5,1C7.5206299,1,6.6352539,1.4022217,6,2.0504761C5.3648071,1.4022827,4.4793701,1,3.5,1  C1.5670166,1,0,2.5670166,0,4.5S2,8,6,11c4-3,6-4.5670166,6-6.5S10.4329834,1,8.5,1z"
                                    fill="currentColor" />
                            </svg>
                            <span class="font-medium text-gray-800">{{ puzzle.likes || 0 }}</span>
                        </div>
                        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                   bg-white/70 backdrop-blur-[2px]
                                   pointer-events-none group-hover:pointer-events-auto">
                            <div class="flex flex-col items-center justify-center h-full" @click.stop>
                                <div class="flex items-center justify-center gap-3">
                                    <!-- Like -->
                                    <button type="button" @click.stop="likePuzzle(puzzle.puzzle_id)" aria-label="Like"
                                        class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-700 shadow-sm ring-1 ring-black/5 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md transition-colors duration-150 cursor-pointer">
                                        <svg width="24px" height="24px" viewBox="0 0 12 12"
                                            enable-background="new 0 0 12 12" id="Слой_1" version="1.1"
                                            xml:space="preserve" xmlns="http://www.w3.org/2000/svg"
                                            xmlns:xlink="http://www.w3.org/1999/xlink">
                                            <path
                                                d="M8.5,1C7.5206299,1,6.6352539,1.4022217,6,2.0504761C5.3648071,1.4022827,4.4793701,1,3.5,1  C1.5670166,1,0,2.5670166,0,4.5S2,8,6,11c4-3,6-4.5670166,6-6.5S10.4329834,1,8.5,1z"
                                                fill="#FF4136" />
                                        </svg>
                                    </button>
                                    <!-- View -->
                                    <button type="button" @click.stop="toPuzzle(puzzle.puzzle_id)" aria-label="View"
                                        class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-700 shadow-sm ring-1 ring-black/5 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md transition-colors duration-150 cursor-pointer">
                                        <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" clip-rule="evenodd"
                                                d="M12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9ZM11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12Z"
                                                fill="#000000" />
                                            <path fill-rule="evenodd" clip-rule="evenodd"
                                                d="M21.83 11.2807C19.542 7.15186 15.8122 5 12 5C8.18777 5 4.45796 7.15186 2.17003 11.2807C1.94637 11.6844 1.94361 12.1821 2.16029 12.5876C4.41183 16.8013 8.1628 19 12 19C15.8372 19 19.5882 16.8013 21.8397 12.5876C22.0564 12.1821 22.0536 11.6844 21.83 11.2807ZM12 17C9.06097 17 6.04052 15.3724 4.09173 11.9487C6.06862 8.59614 9.07319 7 12 7C14.9268 7 17.9314 8.59614 19.9083 11.9487C17.9595 15.3724 14.939 17 12 17Z"
                                                fill="#000000" />
                                        </svg>
                                    </button>
                                </div>
                                <p class="text-center text-sm text-gray-600 m-0 mt-4">Created by <strong>{{
                                    puzzle.creator_name
                                        }}</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-center mt-12 gap-3" v-if="totalPages > 1">
                <button @click="goToPreviousPage" :disabled="currentPage === 0" aria-label="Previous"
                    class="w-10 h-10 flex items-center justify-center border border-solid border-[#dee2e6] bg-white text-[#333333] rounded-full hover:bg-[#333333] hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#333333] cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 19L8 12L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </button>

                <button v-for="page in visiblePages" :key="page" @click="navigateToPage(page - 1)" :class="[
                    'w-10 h-10 flex items-center justify-center border border-solid rounded-full text-sm font-semibold transition-colors duration-200 cursor-pointer',
                    page - 1 === currentPage
                        ? 'bg-[#333333] text-white border-[#333333]'
                        : 'bg-white text-[#333333] border-[#dee2e6] hover:bg-[#333333] hover:text-white'
                ]">
                    {{ page }}
                </button>

                <button @click="goToNextPage" :disabled="currentPage >= totalPages - 1" aria-label="Next"
                    class="w-10 h-10 flex items-center justify-center border border-solid border-[#dee2e6] bg-white text-[#333333] rounded-full hover:bg-[#333333] hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#333333] cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>