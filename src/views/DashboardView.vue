<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useBookStore } from '../stores/bookStore'
import { useLoanStore } from '../stores/loanStore'
import { mockUsers } from '../data/mockData'
import Icon from '../components/Icon.vue'
import BookCard from '../components/BookCard.vue'

const auth = useAuthStore()
const bookStore = useBookStore()
const loanStore = useLoanStore()

const stats = computed(() => {
  if (auth.user?.role === 'admin') {
    return [
      { label: 'Total Buku', value: bookStore.books.length, icon: 'book', color: 'text-teal-600', bg: 'bg-teal-100' },
      { label: 'Peminjaman Aktif & Pending', value: loanStore.loans.filter(l => l.status === 'active' || l.status === 'pending').length, icon: 'bookmark', color: 'text-amber-600', bg: 'bg-amber-100' },
      { label: 'Total Member', value: mockUsers.length, icon: 'users', color: 'text-blue-600', bg: 'bg-blue-100' }
    ];
  } else if (auth.user) {
    const userL = loanStore.userLoans(auth.user.id);
    return [
      { label: 'Buku Dipinjam', value: userL.filter(l => l.status === 'active').length, icon: 'book', color: 'text-teal-600', bg: 'bg-teal-100' },
      { label: 'Menunggu Persetujuan', value: userL.filter(l => l.status === 'pending').length, icon: 'bookmark', color: 'text-amber-600', bg: 'bg-amber-100' },
      { label: 'Buku Dikembalikan', value: userL.filter(l => l.status === 'returned').length, icon: 'bookmark', color: 'text-blue-600', bg: 'bg-blue-100' }
    ];
  }
  return [];
});

const recentBooks = computed(() => [...bookStore.books].reverse().slice(0, 4));
</script>

<template>
  <div>
    <!-- Hero Section -->
    <div class="bg-teal-600 rounded-3xl p-8 md:p-10 text-white mb-8 shadow-lg shadow-teal-600/20 relative overflow-hidden">
      <div class="relative z-10 w-full md:w-2/3">
        <h1 class="text-3xl md:text-4xl font-bold mb-4">Selamat Datang di EduLibrary, {{ auth.user?.name.split(' ')[0] }}! 👋</h1>
        <p class="text-teal-100 mb-6 text-lg">Jelajahi ribuan buku digital berkualitas dan koleksi buku fisik langsung dari perpustakaan kami. Kembangkan pengetahuanmu hari ini.</p>
        <router-link to="/catalog" class="inline-block bg-white text-teal-700 font-bold px-6 py-3 rounded-xl hover:bg-teal-50 transition shadow-sm">Mulai Membaca</router-link>
      </div>
      <div class="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
        <Icon name="book" size="250" />
      </div>
    </div>

    <!-- Banner Upgrade -->
    <div v-if="auth.user?.role === 'user' && auth.user?.membership !== 'premium'" class="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-6 mb-8 text-white flex flex-col md:flex-row items-center justify-between shadow-md">
      <div>
        <h3 class="text-xl font-bold mb-1 flex items-center gap-2"><Icon name="crown" size="24" /> Upgrade ke Premium</h3>
        <p class="text-amber-50">Baca seluruh halaman buku digital, simpan progress bacaan, dan unduh PDF untuk dibaca offline.</p>
      </div>
      <router-link to="/upgrade" class="mt-4 md:mt-0 bg-white text-amber-600 font-bold px-6 py-2.5 rounded-lg hover:bg-amber-50 transition shrink-0 shadow-sm">Lihat Paket</router-link>
    </div>

    <!-- Info Mode -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4 items-start">
          <div class="p-3 bg-teal-100 text-teal-600 rounded-xl shrink-0"><Icon name="monitor" size="24"/></div>
          <div>
            <h3 class="font-bold text-slate-800 text-lg mb-1">Mode Online (E-Book)</h3>
            <p class="text-slate-500 text-sm">Baca buku digital langsung di browser Anda dengan PDF Reader interaktif.</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4 items-start">
          <div class="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0"><Icon name="book" size="24"/></div>
          <div>
            <h3 class="font-bold text-slate-800 text-lg mb-1">Mode Offline (Fisik)</h3>
            <p class="text-slate-500 text-sm">Ajukan permohonan buku fisik, ambil di perpustakaan setelah disetujui, dan pantau riwayat dengan mudah.</p>
          </div>
        </div>
    </div>

    <!-- Statistik -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div :class="[stat.bg, stat.color]" class="p-4 rounded-xl">
          <Icon :name="stat.icon" size="24" />
        </div>
        <div>
          <div class="text-2xl font-bold text-slate-800">{{ stat.value }}</div>
          <div class="text-sm font-medium text-slate-500">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- Buku Terbaru -->
    <div>
      <div class="flex justify-between items-end mb-4">
        <h2 class="text-xl font-bold text-slate-800">Buku Terbaru</h2>
        <router-link to="/catalog" class="text-sm text-teal-600 hover:text-teal-700 font-medium">Lihat semua</router-link>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <BookCard v-for="book in recentBooks" :key="book.id" :book="book" />
      </div>
    </div>
  </div>
</template>