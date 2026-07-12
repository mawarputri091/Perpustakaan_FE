<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore' // 🌟 Impor authStore

const router = useRouter()
const authStore = useAuthStore() // 🌟 Inisialisasi store

// State Form
const email = ref('')

// State UI
const error = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const doRequestUsername = async () => {
  error.value = ''
  successMessage.value = ''
  isLoading.value = true

  // 🌟 Gunakan fetch terpusat dari authStore
  const result = await authStore.forgotUsername(email.value)
  isLoading.value = false

  if (result.success) {
    // Tampilkan pesan sukses kreatif beserta info username-nya langsung demi kebutuhan demo kelulusan tugas
    successMessage.value = `Permintaan berhasil! Username akun Anda adalah: [ ${result.username} ]`
    email.value = '' // Reset field input
  } else {
    error.value = result.message
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
      
      <div class="text-center mb-6">
        <div class="w-12 h-12 bg-teal-500 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-800">Lupa Username</h1>
        <p class="text-sm text-slate-500 mt-1">Masukkan email terdaftar untuk mendapatkan kembali nama pengguna Anda</p>
      </div>

      <form @submit.prevent="doRequestUsername" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Alamat Email Terdaftar</label>
          <input 
            v-model="email" 
            type="email" 
            class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm" 
            placeholder="contoh@email.com" 
            required
          >
        </div>

        <div v-if="error" class="text-red-600 text-xs font-medium text-center bg-red-50 p-2.5 rounded-lg border border-red-100">
          {{ error }}
        </div>

        <div v-if="successMessage" class="text-emerald-700 text-sm font-bold text-center bg-emerald-50 p-4 rounded-xl border-2 border-emerald-300 shadow-sm animate-pulse">
          {{ successMessage }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoading" 
          class="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition shadow-md shadow-teal-600/20 disabled:opacity-70 flex justify-center items-center gap-2 text-sm"
        >
          <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isLoading ? 'MENCARI AKUN...' : 'CARI USERNAME SAYA' }}</span>
        </button>
      </form>

      <div class="relative flex py-4 items-center">
        <div class="flex-grow border-t border-slate-200"></div>
        <span class="flex-shrink mx-4 text-slate-400 text-xs">Navigasi</span>
        <div class="flex-grow border-t border-slate-200"></div>
      </div>

      <div class="flex justify-between items-center text-xs font-semibold px-1">
        <router-link to="/login" class="text-teal-600 hover:text-teal-700 transition">
          ← Kembali ke Login
        </router-link>
        <router-link to="/register" class="text-slate-500 hover:text-teal-600 transition">
          Belum punya akun? Daftar
        </router-link>
      </div>

    </div>
  </div>
</template>