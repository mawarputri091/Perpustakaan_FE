<script setup>
import { useRouter } from 'vue-router'
import Icon from './Icon.vue'
import { useBookStore } from '../stores/bookStore'

const props = defineProps({
  book: Object
})

const router = useRouter()
const bookStore = useBookStore()

// 💵 Fungsi helper untuk mengubah nominal angka menjadi format Rupiah (Rp xx.xxx)
const formatRupiah = (angka) => {
  // Antisipasi jika data harga bertipe string, null, atau undefined dari API
  const nominal = angka ? parseInt(angka, 10) : 0;
  if (nominal === 0) return 'Gratis / TBD';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(nominal);
}
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col h-full cursor-pointer"
    @click="router.push('/book/' + book.id)"
  >
    <div class="h-48 overflow-hidden relative">
      <!-- 🛠️ FIX 1: Dukung properti foto_buku dari API MySQL -->
      <img
        :src="book.foto_buku || book.cover"
        alt="Cover"
        class="w-full h-full object-cover bg-slate-200"
      >

      <!-- 🛠️ FIX 2: Badge Tipe Buku Dinamis tanpa mengubah database -->
      <!-- Jika field pdf_buku terisi string URL valid, otomatis dianggap E-Book -->
      <div
        class="absolute top-2 right-2 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm"
        :class="(book.pdf_buku && book.pdf_buku !== 'null') || book.type === 'digital'
          ? 'bg-teal-500/90 text-white'
          : 'bg-amber-500/90 text-white'"
      >
        {{ (book.pdf_buku && book.pdf_buku !== 'null') || book.type === 'digital' ? 'E-Book' : 'Buku Fisik' }}
      </div>
    </div>

    <div class="p-4 flex flex-col flex-grow">
      <div class="min-h-[110px] flex flex-col">
        <div class="flex items-center gap-1 text-amber-500 mb-1">
          <Icon name="star" size="14" />
          <span class="text-xs font-bold">{{ book.rating || '0.0' }}</span>
          <span class="text-xs text-slate-400 ml-1">
            ({{ book.reviews?.length || 0 }})
          </span>
        </div>

        <!-- 🛠️ FIX 3: Dukung properti nama_buku dari API MySQL -->
        <h3 class="font-bold text-slate-800 leading-tight mb-1 line-clamp-2">
          {{ book.nama_buku || book.title }}
        </h3>

        <!-- 🛠️ FIX 4: Dukung properti penulis dari API MySQL -->
        <p class="text-xs text-slate-500 mb-2">
          {{ book.penulis || book.author || 'Penulis Tidak Diketahui' }}
        </p>
      </div>

      <!-- Format rupiah sudah aman karena fungsi helper Anda mendukung book.harga_buku -->
      <p class="text-sm font-bold text-emerald-600 mb-3 mt-1">
        {{ formatRupiah(book.harga || book.harga_buku) }}
      </p>

      <div
        class="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center text-sm"
      >
        <!-- 🛠️ FIX 5: Dukung properti jenis_buku dari API MySQL -->
        <span class="text-slate-500 font-medium text-xs">
          {{ book.jenis_buku || book.category }}
        </span>

        <!-- 🛠️ FIX 6: Sembunyikan Info Stok jika buku tersebut adalah E-Book -->
        <!-- Dan gunakan properti 'stok' dari API MySQL jika merupakan Buku Fisik -->
        <span
          v-if="!(book.pdf_buku && book.pdf_buku !== 'null') && book.type !== 'digital'"
          :class="(book.stok !== undefined ? book.stok : book.stock) > 0 ? 'text-emerald-600' : 'text-red-500'"
          class="font-semibold text-xs"
        >
          {{ (book.stok !== undefined ? book.stok : book.stock) > 0 ? 'Stok: ' + (book.stok !== undefined ? book.stok : book.stock) : 'Stok Habis' }}
        </span>
        <span v-else class="text-teal-600 font-semibold text-xs">
          Tersedia Digital
        </span>
      </div>
    </div>
  </div>
</template>