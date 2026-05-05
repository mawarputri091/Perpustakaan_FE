<script setup>
import { ref, reactive, computed } from 'vue'
import { useBookStore } from '../stores/bookStore'
import { useLoanStore } from '../stores/loanStore'
import { mockUsers, DEFAULT_PDF } from '../data/mockData'
import Icon from '../components/Icon.vue'

const bookStore = useBookStore()
const loanStore = useLoanStore()

// Peminjaman Menunggu Persetujuan
const pendingLoans = computed(() => {
  return loanStore.loans.filter(l => l.status === 'pending').map(l => ({
    ...l, book: bookStore.books.find(b => b.id === l.bookId), user: mockUsers.find(u => u.id === l.userId)
  }))
})

const handleApprove = (id) => {
  if (loanStore.approveLoan(id)) alert('Permintaan peminjaman disetujui. Stok buku berhasil dikurangi.')
  else alert('Gagal menyetujui peminjaman. Stok buku fisik mungkin sudah habis.')
}

const handleReject = (id) => {
  if(confirm("Apakah Anda yakin ingin menolak permintaan peminjaman ini?")) {
     loanStore.rejectLoan(id)
     alert('Permintaan peminjaman ditolak.')
  }
}

const returnBook = (loanId) => {
  loanStore.returnBook(loanId)
  alert('Buku berhasil dikembalikan. Stok bertambah.')
}

const activeLoans = computed(() => {
  return loanStore.loans.filter(l => l.status === 'active').map(l => ({
    ...l, book: bookStore.books.find(b => b.id === l.bookId), user: mockUsers.find(u => u.id === l.userId) || { name: l.borrowerName, email: 'Peminjam Offline' }
  }))
})

// CRUD Setup
const showAddModal = ref(false)
const isEditMode = ref(false)
const editingBookId = ref(null)
const newBook = reactive({ title: '', author: '', type: 'digital', category: 'Pemrograman', stock: 1, description: '', cover: '' })

const openAddModal = () => {
  isEditMode.value = false; editingBookId.value = null;
  Object.assign(newBook, { title: '', author: '', type: 'digital', category: 'Pemrograman', stock: 1, description: '', cover: '' })
  showAddModal.value = true
}

const openEditModal = (book) => {
  isEditMode.value = true; editingBookId.value = book.id;
  Object.assign(newBook, { title: book.title, author: book.author, type: book.type, category: book.category, stock: book.stock || 0, description: book.description || '', cover: book.cover || '' })
  showAddModal.value = true
}

const saveBook = () => {
  const defaultCover = '[https://images.unsplash.com/photo-1456953180671-730de08edaa7?auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1456953180671-730de08edaa7?auto=format&fit=crop&w=300&q=80)';
  if (isEditMode.value) {
    const idx = bookStore.books.findIndex(b => b.id === editingBookId.value)
    if (idx !== -1) {
      bookStore.books[idx] = { ...bookStore.books[idx], ...newBook, cover: newBook.cover || defaultCover }
      alert('Data buku berhasil diperbarui!')
    }
  } else {
    bookStore.books.push({
      id: Date.now(),
      ...newBook,
      cover: newBook.cover || defaultCover,
      pdfUrl: DEFAULT_PDF,
      rating: 0,
      reviews: []
    })
    alert('Buku berhasil ditambahkan ke katalog!')
  }
  bookStore.saveStore()
  showAddModal.value = false
}

const deleteBook = (id) => {
  if(confirm('Hapus buku ini?')) {
    const idx = bookStore.books.findIndex(b => b.id === id)
    if(idx !== -1) { bookStore.books.splice(idx, 1); bookStore.saveStore(); }
  }
}

// Offline Loan Setup
const borrowerName = ref('')
const loanDuration = ref(7)
const selectedBookId = ref('')
const physicalBooksAvailable = computed(() => bookStore.books.filter(b => b.type === 'physical' && b.stock > 0))

const processOfflineLoan = () => {
  if (!borrowerName.value.trim() || !selectedBookId.value || !loanDuration.value) return alert('Lengkapi data peminjaman terlebih dahulu!')
  const success = loanStore.borrowBookOffline(borrowerName.value, parseInt(selectedBookId.value), parseInt(loanDuration.value))
  if (success) {
    alert('Peminjaman offline berhasil diproses secara manual!')
    borrowerName.value = ''
    selectedBookId.value = ''
    loanDuration.value = 7
  } else {
    alert('Gagal memproses peminjaman. Stok mungkin habis.')
  }
}
</script>

<template>
  <div class="space-y-8">
    
    <!-- Permintaan Peminjaman (Approval) -->
    <div class="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-6">
      <div class="flex items-center gap-3 mb-4">
         <div class="p-2 bg-amber-100 rounded-lg text-amber-700"><Icon name="bookmark" size="20" /></div>
         <div>
            <h2 class="text-xl font-bold text-amber-900 leading-tight">Permintaan Peminjaman</h2>
            <p class="text-sm text-amber-700/80">Menunggu persetujuan Anda sebelum stok buku dikurangi.</p>
         </div>
      </div>
      
      <div v-if="pendingLoans.length === 0" class="text-center py-6 text-amber-700/60 bg-white/50 rounded-xl border border-amber-100">
        Tidak ada permintaan peminjaman baru.
      </div>
      <div class="overflow-x-auto" v-else>
        <table class="w-full text-left text-sm border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
          <thead>
            <tr class="bg-amber-100/50 text-amber-800 border-b border-amber-100">
              <th class="p-3 font-medium">Anggota</th>
              <th class="p-3 font-medium">Buku Fisik</th>
              <th class="p-3 font-medium text-center">Tgl Pengajuan</th>
              <th class="p-3 font-medium text-center">Persetujuan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-amber-50">
            <tr v-for="loan in pendingLoans" :key="loan.id" class="hover:bg-amber-50/30 transition">
              <td class="p-3 font-medium text-slate-800">{{ loan.user?.name }}</td>
              <td class="p-3 font-medium">{{ loan.book?.title }} <span class="text-xs font-normal text-slate-500 block">Sisa Stok: {{ loan.book?.stock }}</span></td>
              <td class="p-3 text-center text-slate-500">{{ new Date(loan.requestDate).toLocaleDateString('id-ID') }}</td>
              <td class="p-3 flex justify-center gap-2">
                <button @click="handleApprove(loan.id)" class="bg-teal-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-teal-700 text-xs shadow-sm">Setujui</button>
                <button @click="handleReject(loan.id)" class="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200 text-xs">Tolak</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Transaksi Peminjaman Offline -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div>
         <h2 class="text-xl font-bold text-slate-800 mb-1">Transaksi Peminjaman Kasir (Offline)</h2>
         <p class="text-sm text-slate-500 mb-6">Sistem meja sirkulasi admin untuk memproses peminjaman buku fisik secara langsung di tempat.</p>
      </div>
      
      <form @submit.prevent="processOfflineLoan" class="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-5 rounded-xl border border-slate-100">
        <div class="w-full md:w-1/4">
          <label class="block text-sm font-medium text-slate-700 mb-1">Nama Peminjam</label>
          <input v-model="borrowerName" type="text" placeholder="Masukkan nama..." required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 bg-white text-sm">
        </div>
        <div class="w-full md:w-1/3">
          <label class="block text-sm font-medium text-slate-700 mb-1">Buku Fisik</label>
          <select v-model="selectedBookId" required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 bg-white text-sm">
            <option value="" disabled>-- Pilih Buku Fisik --</option>
            <option v-for="book in physicalBooksAvailable" :key="book.id" :value="book.id">{{ book.title }} (Sisa: {{ book.stock }})</option>
          </select>
        </div>
        <div class="w-full md:w-1/6">
          <label class="block text-sm font-medium text-slate-700 mb-1">Durasi (Hari)</label>
          <input v-model.number="loanDuration" type="number" min="1" required class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 bg-white text-sm">
        </div>
        <div class="w-full md:w-1/4">
          <button type="submit" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-lg transition shadow-sm text-sm">Proses Pinjam</button>
        </div>
      </form>
    </div>

    <!-- Manajemen Peminjaman Aktif -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div>
         <h2 class="text-xl font-bold text-slate-800 mb-1">Daftar Peminjaman Aktif</h2>
         <p class="text-sm text-slate-500 mb-6">Buku yang sedang dibawa oleh user. Verifikasi pengembalian di sini untuk menambah stok.</p>
      </div>
      <div v-if="activeLoans.length === 0" class="text-center py-6 text-slate-500">
        <Icon name="bookmark" size="32" class="mx-auto mb-2 opacity-50" />
        Tidak ada peminjaman buku fisik yang sedang aktif saat ini.
      </div>
      <div class="overflow-x-auto" v-else>
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th class="p-3 font-medium rounded-tl-lg">Peminjam</th>
              <th class="p-3 font-medium">Buku</th>
              <th class="p-3 font-medium text-center rounded-tr-lg">Aksi Pengembalian</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="loan in activeLoans" :key="loan.id" class="hover:bg-slate-50 transition">
              <td class="p-3 font-medium text-slate-800">{{ loan.user?.name }} <br><span class="text-xs text-slate-500 font-normal">{{ loan.user?.email }}</span></td>
              <td class="p-3 font-medium">{{ loan.book?.title }}</td>
              <td class="p-3 text-center">
                <button @click="returnBook(loan.id)" class="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 text-xs shadow-sm">Verifikasi Kembali</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Manajemen Buku -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
           <h2 class="text-xl font-bold text-slate-800">Katalog Buku (Admin)</h2>
           <p class="text-sm text-slate-500">Kelola ketersediaan buku digital dan fisik</p>
        </div>
        <button @click="openAddModal" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-teal-700 flex items-center gap-2"><Icon name="plus" size="16"/> Tambah Buku</button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th class="p-3 font-medium rounded-tl-lg">Judul</th>
              <th class="p-3 font-medium">Kategori</th>
              <th class="p-3 font-medium">Tipe</th>
              <th class="p-3 font-medium text-right">Stok</th>
              <th class="p-3 font-medium text-center rounded-tr-lg">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="book in bookStore.books" :key="book.id" class="hover:bg-slate-50 transition">
              <td class="p-3 font-medium text-slate-800">{{ book.title }}</td>
              <td class="p-3 text-slate-600">{{ book.category }}</td>
              <td class="p-3">
                <span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider" :class="book.type === 'digital' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'">{{ book.type }}</span>
              </td>
              <td class="p-3 text-right font-medium" :class="book.stock === 0 ? 'text-red-500' : 'text-slate-700'">{{ book.type === 'physical' ? book.stock : '∞' }}</td>
              <td class="p-3 text-center flex justify-center gap-2">
                <button @click="openEditModal(book)" class="text-blue-500 hover:text-blue-700 font-medium text-xs px-2 py-1 bg-blue-50 rounded">Edit</button>
                <button @click="deleteBook(book.id)" class="text-red-500 hover:text-red-700 font-medium text-xs px-2 py-1 bg-red-50 rounded">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Tambah Buku -->
      <div v-if="showAddModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
           <h3 class="text-xl font-bold text-slate-800 mb-4">{{ isEditMode ? 'Edit Buku' : 'Tambah Buku Baru' }}</h3>
           <form @submit.prevent="saveBook" class="space-y-4">
             <div>
               <label class="block text-sm font-medium text-slate-700 mb-1">Judul Buku</label>
               <input v-model="newBook.title" type="text" required class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
             </div>
             <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">URL Cover (Gambar)</label>
                <input v-model="newBook.cover" type="url" placeholder="https://..." class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
             </div>
             <div class="flex gap-4">
               <div class="w-1/2">
                 <label class="block text-sm font-medium text-slate-700 mb-1">Penulis</label>
                 <input v-model="newBook.author" type="text" required class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
               </div>
               <div class="w-1/2">
                 <label class="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                 <select v-model="newBook.category" class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500 bg-white">
                    <option>Pemrograman</option><option>Ilmu Komputer</option><option>Rekayasa Perangkat Lunak</option><option>Jaringan</option>
                 </select>
               </div>
             </div>
             <div class="flex gap-4">
               <div class="w-1/2">
                 <label class="block text-sm font-medium text-slate-700 mb-1">Tipe Buku</label>
                 <select v-model="newBook.type" class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500 bg-white">
                    <option value="digital">E-Book (Digital)</option><option value="physical">Buku Fisik</option>
                 </select>
               </div>
               <div class="w-1/2" v-if="newBook.type === 'physical'">
                 <label class="block text-sm font-medium text-slate-700 mb-1">Stok Awal</label>
                 <input v-model.number="newBook.stock" type="number" min="0" required class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
               </div>
               <div class="w-1/2" v-if="newBook.type === 'digital'">
                 <label class="block text-sm font-medium text-slate-700 mb-1">File PDF</label>
                 <input type="file" class="w-full text-sm mt-1 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-teal-50 file:text-teal-700">
               </div>
             </div>
             <div>
               <label class="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat</label>
               <textarea v-model="newBook.description" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500"></textarea>
             </div>
             <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
               <button type="button" @click="showAddModal = false" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
               <button type="submit" class="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg">{{ isEditMode ? 'Simpan Perubahan' : 'Simpan Buku' }}</button>
             </div>
           </form>
         </div>
      </div>
    </div>
  </div>
</template>