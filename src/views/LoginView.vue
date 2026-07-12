<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()
const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const doLogin = async () => {
  isLoading.value = true
  error.value = ''
  const result = await auth.login(username.value, password.value)
  if (result.success) {
     router.push('/dashboard')
  } else {
     error.value = result.message || 'Username atau password salah'
  }
  isLoading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
      
      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-teal-500 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-800">EduLibrary</h1>
        <p class="text-sm text-slate-500 mt-1">Masuk untuk mengakses layanan perpustakaan</p>
      </div>

      <form @submit.prevent="doLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
          <input 
            v-model="username" 
            type="text" 
            class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none transition" 
            placeholder="Masukkan username Anda..." 
            required
          >
        </div>
        
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-sm font-medium text-slate-700">Password</label>
            <router-link to="/forgot-password" class="text-xs font-semibold text-teal-600 hover:text-teal-700 transition">
              Lupa Password?
            </router-link>
          </div>
          <input 
            v-model="password" 
            type="password" 
            class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none transition" 
            placeholder="••••••••" 
            required
          >
        </div>
        <div v-if="error" class="text-red-600 text-xs font-medium text-center bg-red-50 p-2.5 rounded-lg border border-red-100">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoading" 
          class="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition shadow-md shadow-teal-600/20 disabled:opacity-70 flex justify-center items-center gap-2"
        >
          <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isLoading ? 'MEMPROSES...' : 'LOGIN' }}</span>
        </button>
      </form>

      <div class="relative flex py-4 items-center">
        <div class="flex-grow border-t border-slate-200"></div>
        <span class="flex-shrink mx-4 text-slate-400 text-xs">Atau</span>
        <div class="flex-grow border-t border-slate-200"></div>
      </div>

      <div class="space-y-2.5 text-center text-sm">
        <p class="text-slate-600">
          Belum punya akun? 
          <router-link to="/register" class="font-bold text-teal-600 hover:text-teal-700 hover:underline transition">
            Daftar Sekarang
          </router-link>
        </p>
        <p>
          <router-link to="/forgot-username" class="text-xs text-slate-400 hover:text-teal-600 transition">
            Lupa Nama Akun / Username?
          </router-link>
        </p>
      </div>

    </div>
  </div>
</template>