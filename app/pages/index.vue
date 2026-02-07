<script setup>
import PuzzleCanvas from '~/components/PuzzleCanvas.vue'
const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession()
const router = useRouter()

// custom title and description
useHead({
  title: 'Pips Puzzle Creator',
  meta: [
    { name: 'description', content: 'Create unique pips puzzles with flexible grid design, smart pips placement, and region rule definition.' }
  ],
  link: [
    { rel: 'canonical', href: 'https://creator.pips-game.com' }
  ]
})

const currentPage = ref(0)
const pageSize = ref(4)
// 使用 useFetch 预获取拼图数据
const { data: puzzleList, refresh } = useFetch('/api/get_puzzles', {
  query: {
    limit: pageSize,
    offset: computed(() => currentPage.value * pageSize.value),
  },
  transform: (response) => {
    return response.data || []
  }
})

const toPuzzle = (puzzleId) => {
  window.open(`https://pips-game.com/?customId=${puzzleId}`, '_blank')
}

// Navigate to maker page
const navigateToMaker = () => {
  if (!loggedIn.value) {
    openInPopup('/api/auth/google')
    return
  } else {
    router.push('/maker')
  }
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <div class="max-w-4xl mx-auto px-5 py-12">
      <!-- Main Title Area -->
      <div class="text-center">
        <h1 class="text-4xl font-bold text-[#333333] mb-4">
          Pips Puzzle Creator
        </h1>
        <p class="text-md text-[#666666] leading-6 mb-5 max-w-3xl mx-auto">
          Create your own domino puzzle! Design unique puzzle areas, place dominoes, and define region rules through
          three simple steps to craft challenging puzzle games.
        </p>
        <button @click="navigateToMaker"
          class="px-8 py-3 border border-solid border-[#dee2e6] bg-white text-[#333333] text-lg font-semibold rounded-full hover:bg-[#333333] hover:text-white cursor-pointer">
          Start Creating →
        </button>
      </div>
    </div>

    <!-- Feature Highlights -->
    <div class="max-w-6xl mx-auto p-5">
      <h2 class="text-3xl font-bold text-center text-[#333333] m-0 mb-12">Key Features</h2>

      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white border border-solid border-[#dee2e6] p-6 rounded-lg duration-300">
          <h3 class="text-xl font-semibold text-[#333333] m-0 mb-3">Flexible Grid Design</h3>
          <p class="text-[#666666] leading-6 m-0">Freely define puzzle areas with adjustable grid sizes to create
            various
            puzzle shapes
            and backgrounds.</p>
        </div>

        <div class="bg-white border border-solid border-[#dee2e6] p-6 rounded-lg duration-300">
          <h3 class="text-xl font-semibold text-[#333333]  m-0 mb-3">Smart Domino System</h3>
          <p class="text-[#666666] leading-6 m-0">Auto-generate standard dominoes (0-6 pips) with drag-and-drop
            placement, rotation,
            and intelligent snapping.</p>
        </div>

        <div class="bg-white border border-solid border-[#dee2e6] p-6 rounded-lg duration-300">
          <h3 class="text-xl font-semibold text-[#333333]  m-0 mb-3">Region Rule Definition</h3>
          <p class="text-[#666666] leading-6 m-0">Create colored regions and set numerical rules to add logical
            challenges and solving
            fun to your puzzles.</p>
        </div>
      </div>
    </div>

    <!-- ShowCase -->
    <div class="bg-[#fbf9f5] py-8">
      <div class="max-w-6xl mx-auto px-5">
        <h2 class="text-3xl font-bold text-center text-[#333333] m-0 mb-12">Recent Puzzles</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="puzzle in puzzleList" :key="puzzle.puzzle_id"
            class="bg-white border border-solid border-[#dee2e6] rounded-lg p-4">
            <div class="rounded-lg overflow-hidden position-relative relative group">
              <PuzzleCanvas :rowData="puzzle.row_data" :regions="puzzle.regions_data" :width="560" :height="560"
                class="border rounded w-full" />
              <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                   bg-white/70 backdrop-blur-[2px]
                                   pointer-events-none group-hover:pointer-events-auto">
                <div class="flex flex-col items-center justify-center h-full" @click.stop>
                  <div class="flex items-center justify-center gap-3">
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
      </div>
    </div>

    <!-- Creation Steps -->
    <div class="max-w-6xl mx-auto px-5 py-8">
      <h2 class="text-3xl font-bold text-center text-[#333333] m-0 mb-12">Create Your Puzzle in Three Steps</h2>

      <div class="grid md:grid-cols-3 gap-8">
        <!-- Step 1 -->
        <div class="text-center">
          <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-indigo-600">1</span>
          </div>
          <h3 class="text-xl font-semibold text-[#333333] mb-3">Define Background Area</h3>
          <p class="text-[#666666] leading-6 mb-0">Click and drag to activate grid cells, creating your desired puzzle
            shape.
            Adjust grid size to fit different design needs.</p>
        </div>

        <!-- Step 2 -->
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-green-600">2</span>
          </div>
          <h3 class="text-xl font-semibold text-[#333333] mb-3">Create & Place Dominoes</h3>
          <p class="text-[#666666] leading-6 mb-0">Generate random dominoes and drag them to the grid. Click to rotate
            dominoes,
            click placed dominoes to return them to the palette.</p>
        </div>

        <!-- Step 3 -->
        <div class="text-center">
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-bold text-purple-600">3</span>
          </div>
          <h3 class="text-xl font-semibold text-[#333333] mb-3">Define Regions</h3>
          <p class="text-[#666666] leading-6 mb-0">Select cells to create colored regions and set numerical rules for
            each.
            Export your completed puzzle and share with your friends!</p>
        </div>
      </div>
    </div>
    <!-- CTA Section -->
    <div class="max-w-4xl mx-auto p-5">
      <div class="bg-[#fbf9f5] rounded-lg text-center p-12">
        <h2 class="text-3xl font-bold text-[#333333] mb-4">Ready to Create Your First Puzzle?</h2>
        <p class="text-md text-[#666666] mb-8">
          No registration required - start designing your domino puzzle right away!
        </p>
        <button @click="navigateToMaker"
          class="px-10 py-4 bg-white border border-solid border-[#dee2e6] text-[#333333] text-lg font-bold rounded-full hover:bg-[#333333] hover:text-white cursor-pointer">
          Start Creating Now
        </button>
      </div>
    </div>
  </div>
</template>