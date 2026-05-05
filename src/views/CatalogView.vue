<script setup>
import { ref, computed } from 'vue'
import { useBookStore } from '../stores/bookStore'
import BookCard from '../components/BookCard.vue'
import Icon from '../components/Icon.vue'

const bookStore = useBookStore()

const searchQuery = ref('')
const filterMode = ref('all')
const filterCategory = ref('all')

const categories = computed(() => ['all', ...new Set(bookStore.books.map(b => b.category))])

const filteredBooks = computed(() => {
  return bookStore.books.filter(b => {
      const matchSearch = b.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchMode = filterMode.value === 'all' || b.type === filterMode.value
      const matchCat = filterCategory.value === 'all' || b.category === filterCategory.value
      return matchSearch && matchMode && matchCat
  })
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-800 mb-2">Katalog Buku</h1>
    <p class="text-slate-500 mb-6">Temukan bahan bacaan favorit Anda melalui pencarian dan filter di bawah.</p>
    
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
      <div class="relative flex-grow w-full">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Icon name="search" size="18"/>
        </div>
        <input v-model="searchQuery" type="text" placeholder="Cari judul atau penulis..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none">
      </div>
      <div class="flex gap-4 w-full md:w-auto">
        <div class="flex-1 md:flex-none">
          <select v-model="filterMode" class="w-full py-2.5 px-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none bg-white">
            <option value="all">Semua Mode</option>
            <option value="digital">Digital (E-Book)</option>
            <option value="physical">Buku Fisik</option>
          </select>
        </div>
        <div class="flex-1 md:flex-none">
          <select v-model="filterCategory" class="w-full py-2.5 px-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none bg-white">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat === 'all' ? 'Semua Kategori' : cat }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="filteredBooks.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <BookCard v-for="book in filteredBooks" :key="book.id" :book="book" />
    </div>
    <div v-else class="text-center py-12 text-slate-500">
      <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Icon name="search" size="24" />
      </div>
      <p>Buku yang Anda cari tidak ditemukan.</p>
    </div>
  </div>
</template>
