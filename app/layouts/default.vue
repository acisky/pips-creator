<script setup>
const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession()

// Navigate to maker page
const navigateToMaker = () => {
  if (!loggedIn.value) {
    openInPopup('/api/auth/google')
    return
  } else {
    this.$router.push('/maker')
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <header class="bg-[#fbf9f5] border-0 border-b border-solid  border-[#dee2e6]">
      <div class="max-w-4xl mx-auto">
        <div
          class="flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 md:gap-0 p-5 text-center">
          <NuxtLink to="/" class="text-[#333333] text-2xl font-bold no-underline">
            Pips Puzzle Creator
          </NuxtLink>
          <div class="flex justify-center items-center">
            <NuxtLink to="/showcase"
              class="text-[#666666] text-md font-bold no-underline px-3 py-2 :hover:text-[#333333]">
              Showcase
            </NuxtLink>

            <div class="flex items-center gap-2 justify-center" v-if="!loggedIn">
              <button @click="navigateToMaker"
                class="inline-flex items-center gap-2 justify-center border border-solid border-[#dee2e6] text-[#666666] text-sm font-bold no-underline px-3 py-2 rounded-lg hover:bg-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48"
                  class="w-5 h-5 flex-shrink-0">
                  <path fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z">
                  </path>
                  <path fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z">
                  </path>
                  <path fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z">
                  </path>
                  <path fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z">
                  </path>
                </svg>
                <span class="leading-none">Login With Google</span>
              </button>
            </div>
            <div class="flex items-center gap-2 justify-center" v-else>
              <div class="flex items-center justify-center">
                <img :src="user.picture" alt="user avatar"
                  class="w-8 h-8 border border-1 border-solid border-[#dee2e6] flex-shrink-0 rounded-full" />
                <NuxtLink to="/account"
                  class="text-[#666666] text-md font-bold no-underline px-3 py-2 :hover:text-[#333333]">{{ user.name }}
                </NuxtLink>
              </div>
              <button @click="clear"
                class="inline-flex items-center gap-2 justify-center text-[#666666] text-sm font-bold no-underline px-3 py-2 rounded-lg hover:bg-white cursor-pointer">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
    <main class="flex-grow">
      <slot />
    </main>
    <footer class="bg-[#fbf9f5] border-t border-t-solid border-[#dee2e6] mt-4">
      <div class="max-w-4xl mx-auto">
        <div class="text-center p-5">
          <p class="text-[#333333] text-md m-0">
            &copy; 2023 Pips Game. All rights reserved.
          </p>
          <p class="text-[#999999] text-sm m-0 mt-3">
            Pips-game.com is not affiliated with Pips Game by NYTimes in any way
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>