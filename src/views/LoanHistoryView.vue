<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useLoanStore } from '../stores/loanStore'
import { useBookStore } from '../stores/bookStore'
import Icon from '../components/Icon.vue'

const auth = useAuthStore()
const loanStore = useLoanStore()
const bookStore = useBookStore()

const activeTab = ref('loans')

// Menggunakan satu state gabungan untuk semua aktivitas e-book
const combinedReadingData = ref([])

// Key localStorage dipisah per user supaya riwayat baca & bookmark
// tidak tercampur antar akun di browser yang sama
const bookmarkKey = computed(() => `book_bookmarks_${auth.user?.id || 'guest'}`)
const historyKey = computed(() => `book_history_${auth.user?.id || 'guest'}`)

const history = computed(() => {
  if (!auth.user) return []

  return loanStore.userLoans(auth.user.id)
    .map(loan => ({
      ...loan,
      book: bookStore.books.find(
        b => String(b.id) === String(loan.buku_id)
      )
    }))
    .reverse()
})

// Fungsi memuat & menggabungkan data riwayat membaca dan bookmark
const loadReadingActivity = () => {
  const bookmarks = JSON.parse(localStorage.getItem(bookmarkKey.value) || '[]')
  const historyList = JSON.parse(localStorage.getItem(historyKey.value) || '[]')

  // Buat Map untuk menggabungkan data duplikat berdasarkan ID buku
  const mergedMap = new Map()

  // 1. Masukkan data riwayat membaca terlebih dahulu
  historyList.forEach(item => {
    mergedMap.set(item.id, {
      ...item,
      isBookmarked: false,
      halaman_terakhir: item.halaman_terakhir || 1,
      tipe_label: 'Sedang Dibaca'
    })
  })

  // 2. Masukkan data bookmark (jika sudah ada di riwayat, timpa status atau tandai sebagai bookmark)
  bookmarks.forEach(item => {
    if (mergedMap.has(item.id)) {
      const existing = mergedMap.get(item.id)
      mergedMap.set(item.id, {
        ...existing,
        isBookmarked: true,
        tipe_label: 'Bookmark'
      })
    } else {
      mergedMap.set(item.id, {
        ...item,
        isBookmarked: true,
        halaman_terakhir: 1,
        tipe_label: 'Bookmark'
      })
    }
  })

  // Ubah kembali Map menjadi array untuk UI
  combinedReadingData.value = Array.from(mergedMap.values())
}

// Fungsi menghapus item dari list (baik hapus bookmark atau hapus dari riwayat)
const removeActivity = (id) => {
  // Hapus dari data bookmark
  let bookmarks = JSON.parse(localStorage.getItem(bookmarkKey.value) || '[]')
  bookmarks = bookmarks.filter(b => b.id !== id)
  localStorage.setItem(bookmarkKey.value, JSON.stringify(bookmarks))

  // Hapus dari data riwayat membaca
  let historyList = JSON.parse(localStorage.getItem(historyKey.value) || '[]')
  historyList = historyList.filter(b => b.id !== id)
  localStorage.setItem(historyKey.value, JSON.stringify(historyList))

  loadReadingActivity() // Segarkan UI langsung
}

onMounted(() => {
  loadReadingActivity()
})

const formatDate = (ds) => {
  if (!ds) return '-'
  return new Date(ds).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="bg-slate-50 border-b border-slate-200 px-6 pt-6">
      <h2 class="text-2xl font-bold text-slate-800 mb-4">Riwayat Aktivitas</h2>
      <div class="flex gap-6 -mb-px">
         <button @click="activeTab = 'loans'" :class="activeTab === 'loans' ? 'border-teal-500 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" class="pb-3 border-b-2 transition">Peminjaman Fisik</button>
         <button @click="activeTab = 'reading'; loadReadingActivity()" :class="activeTab === 'reading' ? 'border-teal-500 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" class="pb-3 border-b-2 transition">Bacaan & Bookmark</button>
      </div>
    </div>
    
    <div class="p-6">
      <div v-if="activeTab === 'loans'">
        <div v-if="history.length === 0" class="text-center py-10 text-slate-500">
          Belum ada riwayat permintaan atau peminjaman buku fisik.
        </div>
        <div class="overflow-x-auto" v-else>
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th class="p-4 font-medium rounded-tl-lg">Judul Buku</th>
                <th class="p-4 font-medium">Tgl Pengajuan/Pinjam</th>
                <th class="p-4 font-medium">Tenggat Waktu</th>
                <th class="p-4 font-medium text-right rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="loan in history" :key="loan.id" class="hover:bg-slate-50 transition">
                <td class="p-4 font-medium text-slate-800 flex items-center gap-3">
                  <img :src="loan.book?.cover || loan.book?.cover_buku" class="w-10 h-14 object-cover rounded shadow-sm bg-slate-200">
                  {{ loan.book?.title || loan.book?.nama_buku || loan.nama_buku || 'Buku Telah Dihapus' }}
                </td>
                <td class="p-4 text-slate-600 text-sm">{{ formatDate(loan.tanggal_pinjam) }}</td>
                <td class="p-4 text-slate-600 text-sm">{{ formatDate(loan.tanggal_kembali) }}</td>
                <td class="p-4 text-right">
                  <span v-if="loan.status === 'menunggu'" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Menunggu Persetujuan</span>
                  <span v-else-if="loan.status === 'dipinjam'" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-700 border border-teal-200">Sedang Dipinjam</span>
                  <span v-else-if="loan.status === 'dikembalikan'" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Dikembalikan</span>
                  <span v-else-if="loan.status === 'ditolak'" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Ditolak</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeTab === 'reading'">
         <div v-if="combinedReadingData.length === 0" class="text-center py-10 text-slate-500">
           Anda belum memiliki aktivitas membaca atau menyimpan bookmark e-book.
         </div>
         <div class="space-y-4" v-else>
            <div v-for="item in combinedReadingData" :key="item.id" class="border border-slate-200 rounded-xl p-4 flex gap-4 items-center bg-white shadow-sm hover:shadow-md transition">
               <img :src="item.cover_buku || item.cover" class="w-12 h-16 object-cover rounded shadow-sm bg-slate-200">
               <div class="flex-grow">
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-slate-800 text-sm md:text-base">{{ item.nama_buku || item.title }}</h4>
                    <span :class="item.isBookmarked ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-teal-100 text-teal-700 border-teal-200'" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">
                      {{ item.tipe_label }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">oleh {{ item.penulis || 'Penulis Tidak Diketahui' }}</p>
                  <div class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                     <span>📖 Progress: Terakhir dibaca sampai Halaman {{ item.halaman_terakhir }}</span>
                  </div>
               </div>
               <div class="flex items-center gap-2">
                 <router-link :to="'/read/' + item.id" class="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition">
                   Lanjutkan
                 </router-link>
                 <button @click="removeActivity(item.id)" class="p-2 border border-rose-100 hover:bg-rose-50 text-rose-500 rounded-lg transition" title="Hapus dari Aktivitas">
                   🗑️
                 </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>