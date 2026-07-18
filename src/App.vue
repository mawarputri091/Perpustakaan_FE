<script setup>
import { onMounted, watch } from 'vue'
import { useAuthStore } from './stores/authStore'
import { useBookStore } from './stores/bookStore'
import { useLoanStore } from './stores/loanStore'

const auth = useAuthStore()
const bookStore = useBookStore()
const loanStore = useLoanStore()

onMounted(() => {
  // Katalog buku bersifat publik, boleh diambil kapan saja
  bookStore.fetchBooks()
})

// Data peminjaman butuh token — hanya di-fetch setelah user login.
// watch dengan immediate: true juga menangani kasus refresh saat sesi masih aktif.
watch(() => auth.user, (u) => {
  if (u) loanStore.fetchLoans()
}, { immediate: true })
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
