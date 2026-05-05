<script setup>
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'
import Icon from './Icon.vue' // Pastikan file Icon.vue dibuat

const auth = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col fixed left-0 top-0 z-40">
    <div class="p-6">
      <div class="flex items-center gap-2 text-white font-bold text-xl mb-8">
        <Icon name="library" class="text-teal-400" />
        <span>EduLibrary</span>
      </div>
      
      <div class="space-y-1 mb-8">
        <p class="text-xs uppercase font-bold text-slate-500 mb-2 px-3">Menu Utama</p>
        <router-link to="/dashboard" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition" active-class="bg-teal-600/20 text-teal-400">
          <Icon name="monitor" size="18" /> Beranda
        </router-link>
        <router-link to="/catalog" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition" active-class="bg-teal-600/20 text-teal-400">
          <Icon name="search" size="18" /> Katalog
        </router-link>
      </div>

      <div v-if="auth.user?.role === 'user'" class="space-y-1 mb-8">
        <p class="text-xs uppercase font-bold text-slate-500 mb-2 px-3">Aktivitas Saya</p>
        <router-link to="/history" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition" active-class="bg-teal-600/20 text-teal-400">
          <Icon name="bookmark" size="18" /> Riwayat
        </router-link>
        <router-link to="/upgrade" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition" active-class="bg-amber-500/20 text-amber-400">
          <Icon name="crown" size="18" /> Membership
        </router-link>
      </div>

      <div v-if="auth.user?.role === 'admin'" class="space-y-1 mb-8">
        <p class="text-xs uppercase font-bold text-slate-500 mb-2 px-3">Panel Admin</p>
        <router-link to="/admin/books" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition" active-class="bg-teal-600/20 text-teal-400">
          <Icon name="book" size="18" /> Dashboard Admin
        </router-link>
      </div>
    </div>
    
    <div class="mt-auto p-4 border-t border-slate-800">
      <div class="bg-slate-800 rounded-lg p-3 mb-3" v-if="auth.user">
        <div class="text-sm text-white font-medium truncate">{{ auth.user.name }}</div>
        <div class="flex items-center justify-between mt-1">
          <span class="text-xs text-slate-400 uppercase">{{ auth.user.role }}</span>
          <span v-if="auth.user.membership === 'premium'" class="text-[10px] bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
            <Icon name="crown" size="10"/> Premium
          </span>
          <span v-else class="text-[10px] bg-slate-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
            Free
          </span>
        </div>
      </div>
      <button @click="handleLogout" class="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition w-full px-2 py-1">
        <Icon name="log-out" size="16" /> Logout
      </button>
    </div>
  </aside>
</template>