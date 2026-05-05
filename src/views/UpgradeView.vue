<script setup>
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'

const auth = useAuthStore()
const router = useRouter()

const upgrade = () => {
  auth.upgradeMembership()
  alert('Berhasil! Anda sekarang adalah Member Premium.')
  router.push('/dashboard')
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-8 text-center">
    <h1 class="text-4xl font-extrabold text-slate-800 mb-10">Tingkatkan Pengalaman Membacamu</h1>
    <div class="bg-teal-600 p-8 rounded-2xl text-white max-w-md mx-auto">
      <h3 class="text-xl font-bold mb-2">Member Premium</h3>
      <div class="text-3xl font-bold mb-6">Rp 49.000 / bulan</div>
      <button v-if="auth.user?.membership !== 'premium'" @click="upgrade" class="w-full bg-white text-teal-700 font-bold py-3 rounded-xl">Upgrade Sekarang</button>
      <button v-else disabled class="w-full py-3 bg-teal-800 text-teal-200 rounded-xl font-bold">Anda sudah Premium!</button>
    </div>
  </div>
</template>
