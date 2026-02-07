<script setup>
import PuzzleCanvas from '~/components/PuzzleCanvas.vue'
import { ref, computed, watch } from 'vue'

const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession()
const { success, error, warning, info, confirm } = inject('toast')
const router = useRouter()

// custom title and description
useHead({
    title: 'Pips Puzzle Creator',
    meta: [
        { name: 'description', content: 'Create unique pips puzzles with flexible grid design, smart pips placement, and region rule definition.' }
    ]
})

onBeforeMount(() => {
    if (!loggedIn.value) {
        router.push('/')
    }
})

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

const { data: puzzlesResult, refresh } = useFetch('/api/user_puzzles', {
    query: {
        user_id: computed(() => user.value?.id),
        limit: pageSize,
        offset: computed(() => currentPage.value * pageSize.value)
    }
})

const puzzleList = computed(() => puzzlesResult.value?.data || [])

watch(puzzlesResult, (newResult) => {
    if (newResult) {
        totalItems.value = newResult.total || 0
    }
}, { immediate: true })

const deletePuzzle = async (puzzleId) => {
    const confirmed = await confirm('Are you sure you want to delete the puzzle?', 'Delete Puzzle')
    if (confirmed) {
        try {
            await $fetch('/api/delete_puzzle', {
                method: 'POST',
                body: {
                    puzzleId: puzzleId
                }
            })
            // 删除成功后刷新列表
            refresh()
        } catch (error) {
            console.error('Failed to delete puzzle:', error)
            throw error
        }
    }
}

const toPuzzle = (puzzleId) => {
    window.open(`https://pips-game.com/?customId=${puzzleId}`, '_blank')
}

const navigateToMaker = () => {
    router.push('/maker')
}

// 分页导航函数
const navigateToPage = (page) => {
    if (page >= 0 && page < totalPages.value) {
        currentPage.value = page
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
}

const goToPreviousPage = () => {
    if (currentPage.value > 0) {
        currentPage.value--
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
}

const goToNextPage = () => {
    if (currentPage.value < totalPages.value - 1) {
        currentPage.value++
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
}
</script>

<template>
    <div>
        <div class="max-w-6xl mx-auto px-5 py-10">
            <h2 class="text-3xl font-bold text-center text-[#333333] m-0 mb-12">My Puzzles</h2>

            <template v-if="puzzleList.length > 0">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div v-for="puzzle in puzzleList" :key="puzzle.puzzle_id"
                        class="bg-white border border-solid border-[#dee2e6] rounded-lg p-4">
                        <div class="rounded-lg overflow-hidden position-relative relative group">
                            <PuzzleCanvas :rowData="puzzle.row_data" :regions="puzzle.regions_data" :width="560"
                                :height="560" class="border rounded w-full" />
                            <!-- 覆盖层：悬停时淡入，完全遮挡 PuzzleCanvas，按钮居中 -->
                            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                   bg-white/70 backdrop-blur-[2px]
                                   pointer-events-none group-hover:pointer-events-auto
                                   flex items-center justify-center">
                                <div class="flex flex-col items-center justify-center h-full" @click.stop>
                                    <div class="flex items-center justify-center gap-3">
                                        <!-- Like
                                <button
                                    type="button"
                                    aria-label="Like"
                                    class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-700 shadow-sm ring-1 ring-black/5 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md transition-colors duration-150"
                                >
                                    <svg width="800px" height="800px" viewBox="0 0 12 12" enable-background="new 0 0 12 12" id="Слой_1" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M8.5,1C7.5206299,1,6.6352539,1.4022217,6,2.0504761C5.3648071,1.4022827,4.4793701,1,3.5,1  C1.5670166,1,0,2.5670166,0,4.5S2,8,6,11c4-3,6-4.5670166,6-6.5S10.4329834,1,8.5,1z" fill="#1D1D1B"/></svg>
                                </button> -->
                                        <!-- View -->
                                        <button type="button" @click="toPuzzle(puzzle.puzzle_id)" aria-label="View"
                                            class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-700 shadow-sm ring-1 ring-black/5 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md transition-colors duration-150 cursor-pointer">
                                            <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path fill-rule="evenodd" clip-rule="evenodd"
                                                    d="M12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9ZM11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12Z"
                                                    fill="#000000" />
                                                <path fill-rule="evenodd" clip-rule="evenodd"
                                                    d="M21.83 11.2807C19.542 7.15186 15.8122 5 12 5C8.18777 5 4.45796 7.15186 2.17003 11.2807C1.94637 11.6844 1.94361 12.1821 2.16029 12.5876C4.41183 16.8013 8.1628 19 12 19C15.8372 19 19.5882 16.8013 21.8397 12.5876C22.0564 12.1821 22.0536 11.6844 21.83 11.2807ZM12 17C9.06097 17 6.04052 15.3724 4.09173 11.9487C6.06862 8.59614 9.07319 7 12 7C14.9268 7 17.9314 8.59614 19.9083 11.9487C17.9595 15.3724 14.939 17 12 17Z"
                                                    fill="#000000" />
                                            </svg>
                                        </button>
                                        <!-- Delete -->
                                        <button type="button" @click="deletePuzzle(puzzle.puzzle_id)"
                                            aria-label="Delete"
                                            class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-red-500 shadow-sm ring-1 ring-black/5 hover:bg-red-50 hover:text-red-700 hover:shadow-md transition-colors duration-150 cursor-pointer">
                                            <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10 12V17" stroke="currentColor" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M14 12V17" stroke="currentColor" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M4 7H20" stroke="currentColor" stroke-width="2"
                                                    stroke-linecap="round" stroke-linejoin="round" />
                                                <path
                                                    d="M6 10V18C6 19.6569 7.34315 21 9 21H15C16.6569 21 18 19.6569 18 18V10"
                                                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                                    stroke-linejoin="round" />
                                                <path
                                                    d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
                                                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                                    stroke-linejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col items-center justify-center mt-12 gap-8">
                    <div class="flex items-center justify-center gap-3" v-if="totalPages > 1">
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

                    <button @click="navigateToMaker"
                        class="px-8 py-3 border border-solid border-[#dee2e6] bg-white text-[#333333] text-lg font-semibold rounded-full hover:bg-[#333333] hover:text-white cursor-pointer">
                        Start Creating →
                    </button>
                </div>
            </template>
            <template v-else>
                <div class="flex flex-col items-center justify-center py-10">
                    <p class="text-center text-sm text-gray-600 mb-5">No puzzles available. Create your first puzzle!
                    </p>
                    <button @click="navigateToMaker"
                        class="px-8 py-3 border border-solid border-[#dee2e6] bg-white text-[#333333] text-lg font-semibold rounded-full hover:bg-[#333333] hover:text-white cursor-pointer">
                        Start Creating →
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>