<script setup>
import { useRouter } from 'vue-router'
import Icon from './Icon.vue'

const props = defineProps({
  book: Object
})
const router = useRouter()
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col h-full cursor-pointer" @click="router.push('/book/' + book.id)">
    <div class="h-48 overflow-hidden relative">
      <img :src="book.cover" alt="Cover" class="w-full h-full object-cover bg-slate-200">
      <div class="absolute top-2 right-2 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm"
           :class="book.type === 'digital' ? 'bg-teal-500/90 text-white' : 'bg-amber-500/90 text-white'">
        {{ book.type === 'digital' ? 'E-Book' : 'Buku Fisik' }}
      </div>
    </div>
    <div class="p-4 flex flex-col flex-grow">
      <div class="flex items-center gap-1 text-amber-500 mb-1">
        <Icon name="star" size="14" />
        <span class="text-xs font-bold">{{ book.rating || '0.0' }}</span>
        <span class="text-xs text-slate-400 ml-1">({{ book.reviews?.length || 0 }})</span>
      </div>
      <h3 class="font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{{ book.title }}</h3>
      <p class="text-xs text-slate-500 mb-3">{{ book.author }}</p>
      <div class="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
        <span class="text-slate-500 font-medium text-xs">{{ book.category }}</span>
        <span v-if="book.type === 'physical'" :class="book.stock > 0 ? 'text-emerald-600' : 'text-red-500'" class="font-semibold text-xs">
          {{ book.stock > 0 ? 'Stok: ' + book.stock : 'Stok Habis' }}
        </span>
      </div>
    </div>
  </div>
</template>
