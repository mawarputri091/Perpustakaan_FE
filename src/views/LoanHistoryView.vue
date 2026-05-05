<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useLoanStore } from '../stores/loanStore'
import { useBookStore } from '../stores/bookStore'
import Icon from '../components/Icon.vue'

const auth = useAuthStore()
const loanStore = useLoanStore()
const bookStore = useBookStore()

const activeTab = ref('loans')

const history = computed(() => {
  if (!auth.user) return []
  return loanStore.userLoans(auth.user.id).map(loan => ({
    ...loan,
    book: bookStore.books.find(b => b.id === loan.bookId)
  })).reverse()
})

const myBookmarks = computed(() => {
   if (!auth.user) return []
   const bks = bookStore.bookmarks[auth.user.id] || {}
   const results = []
   for(const bookId in bks) {
      if(bks[bookId].length > 0) {
         const book = bookStore.books.find(b => b.id === parseInt(bookId))
         if(book) results.push({ book, pages: bks[bookId] })
      }
   }
   return results
})

const formatDate = (ds) => {
  if (!ds) return '-';
  return new Date(ds).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="bg-slate-50 border-b border-slate-200 px-6 pt-6">
      <h2 class="text-2xl font-bold text-slate-800 mb-4">Riwayat Aktivitas</h2>
      <div class="flex gap-6 -mb-px">
         <button @click="activeTab = 'loans'" :class="activeTab === 'loans' ? 'border-teal-500 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" class="pb-3 border-b-2 transition">Peminjaman Fisik</button>
         <button @click="activeTab = 'reading'" :class="activeTab === 'reading' ? 'border-teal-500 text-teal-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" class="pb-3 border-b-2 transition">Bacaan & Bookmark</button>
      </div>
    </div>
    
    <div class="p-6">
      <!-- TAB LOANS -->
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
                  <img :src="loan.book?.cover" class="w-10 h-14 object-cover rounded shadow-sm">
                  {{ loan.book?.title }}
                </td>
                <td class="p-4 text-slate-600 text-sm">{{ formatDate(loan.borrowDate || loan.requestDate) }}</td>
                <td class="p-4 text-slate-600 text-sm">{{ formatDate(loan.dueDate) }}</td>
                <td class="p-4 text-right">
                  <span v-if="loan.status === 'pending'" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Menunggu Persetujuan</span>
                  <span v-else-if="loan.status === 'active'" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-700 border border-teal-200">Sedang Dipinjam</span>
                  <span v-else-if="loan.status === 'returned'" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Dikembalikan</span>
                  <span v-else-if="loan.status === 'rejected'" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Ditolak</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB READING -->
      <div v-if="activeTab === 'reading'">
         <div v-if="myBookmarks.length === 0" class="text-center py-10 text-slate-500">
            Anda belum menyimpan bookmark dari e-book manapun.
         </div>
         <div class="space-y-4" v-else>
            <div v-for="item in myBookmarks" :key="item.book.id" class="border border-slate-200 rounded-xl p-4 flex gap-4 items-center">
               <img :src="item.book.cover" class="w-12 h-16 object-cover rounded shadow-sm">
               <div class="flex-grow">
                  <h4 class="font-bold text-slate-800">{{ item.book.title }}</h4>
                  <div class="text-sm text-slate-500 mt-1 flex gap-2">
                     <span class="flex items-center gap-1"><Icon name="bookmark" size="14"/> Halaman disimpan:</span>
                     <span v-for="p in item.pages" :key="p" class="bg-teal-100 text-teal-700 px-1.5 rounded text-xs font-bold">{{ p }}</span>
                  </div>
               </div>
               <router-link :to="'/read/' + item.book.id" class="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700">Lanjutkan</router-link>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>