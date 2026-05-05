<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()
const router = useRouter()

const email = ref('budi@lib.com')
const password = ref('user')
const error = ref('')

const doLogin = () => {
  if (auth.login(email.value, password.value)) {
    router.push('/dashboard')
  } else {
    error.value = 'Email atau password salah'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-teal-500 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-800">EduLibrary</h1>
        <p class="text-sm text-slate-500 mt-1">Masuk untuk mengakses layanan perpustakaan</p>
      </div>
      <form @submit.prevent="doLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input v-model="email" type="email" class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input v-model="password" type="password" class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none" required>
        </div>
        <div v-if="error" class="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{{ error }}</div>
        <button type="submit" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg transition shadow-md shadow-teal-600/20">Masuk</button>
      </form>
      <div class="mt-6 text-xs text-slate-400 text-center space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <p>Admin: admin@lib.com / admin</p>
        <p>User (Free): budi@lib.com / user</p>
        <p>User (Premium): siti@lib.com / user</p>
      </div>
    </div>
  </div>
</template>