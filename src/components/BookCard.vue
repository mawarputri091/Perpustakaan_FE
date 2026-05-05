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
      <img :src="book.cover" alt="Cover" class="w-full h-full object-cover">
      <div class="absolute top-2 right-2 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm"
            :class="book.type === 'digital' ? 'bg-teal-500/90 text-white' : 'bg-amber-500/90 text-white'">
        {{ book.type === 'digital' ? 'E-Book' : 'Buku Fisik' }}
      </div>
    </div>
    <div class="p-4 flex flex-col flex-grow">
      <h3 class="font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{{ book.title }}</h3>
      <p class="text-xs text-slate-500 mb-3">{{ book.author }}</p>
    </div>
  </div>
</template>
