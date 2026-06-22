<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useBookStore } from '../stores/bookStore'
import { useLoanStore } from '../stores/loanStore'
import { mockUsers, DEFAULT_PDF } from '../data/mockData'
import Icon from '../components/Icon.vue'
import Swal from 'sweetalert2'

const bookStore = useBookStore()
const loanStore = useLoanStore()

const selectedBookId = ref('')
const loanDuration = ref(7) // default 7 hari misalnya
const borrowerName = ref('') 

// 🌟 PERBAIKAN 1: Saring status 'pending' untuk antrean persetujuan kotak kuning
const pendingLoans = computed(() => {
  if (!loanStore.loans || !Array.isArray(loanStore.loans)) return []
  return loanStore.loans.filter(l => l.status === 'pending')
})

// 🌟 PERBAIKAN 2: Saring status 'dipinjam' untuk daftar peminjaman aktif yang dibawa siswa
const activeLoans = computed(() => {
  if (!loanStore.loans || !Array.isArray(loanStore.loans)) return []
  return loanStore.loans.filter(l => l.status === 'dipinjam')
})

// Filter buku fisik yang tersedia untuk kasir offline
const physicalBooksAvailable = computed(() => {
  return bookStore.books.filter(b => b.type === 'physical' && b.stock > 0)
})

onMounted(async () => {
  await bookStore.fetchBooks()
  await loanStore.fetchLoans()
})

// 🛠️ Mengubah Alert Persetujuan Pinjam
const handleApprove = async (id) => {
  console.log("Menyetujui Transaksi ID:", id);
  const success = await loanStore.approveLoan(id)
  if (success) {
    Swal.fire({
      title: 'Disetujui!',
      text: 'Permintaan peminjaman disetujui. Stok buku berhasil dikurangi.',
      icon: 'success',
      confirmButtonColor: '#0d9488',
      timer: 2000,
      timerProgressBar: true
    })
  } else {
    Swal.fire({
      title: 'Gagal!',
      text: 'Gagal menyetujui peminjaman. Periksa kembali ID Transaksi database.',
      icon: 'error',
      confirmButtonColor: '#ef4444'
    })
  }
}

// 🛠️ Mengubah Confirm & Alert Tolak Pinjam
const handleReject = async (id) => {
  const result = await Swal.fire({
    title: 'Apakah Anda yakin?',
    text: "Permintaan peminjaman ini akan ditolak!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Tolak!',
    cancelButtonText: 'Batal'
  })

  if (result.isConfirmed) {
    await loanStore.rejectLoan(id)
    Swal.fire({
      title: 'Ditolak!',
      text: 'Permintaan peminjaman telah ditolak.',
      icon: 'info',
      confirmButtonColor: '#64748b',
      timer: 2000,
      timerProgressBar: true
    })
  }
}

// 🛠️ Mengubah Alert Verifikasi Pengembalian Buku
const handleReturnBook = async (loanId) => {
  await loanStore.returnBook(loanId)
  Swal.fire({
    title: 'Berhasil Kembali!',
    text: 'Buku berhasil dikembalikan. Stok bertambah.',
    icon: 'success',
    confirmButtonColor: '#10b981',
    timer: 2000,
    timerProgressBar: true
  })
}

// CRUD API Buku
const showAddModal = ref(false)
const isEditMode = ref(false)
const editingBookId = ref(null)

const newBook = reactive({ title: '', author: '', type: 'physical', category: '', stock: 1, harga: 0, description: '', cover: '' })
const isProcessing = ref(false)
const selectedFile = ref(null)

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0] || null
}

const openAddModal = () => {
  isEditMode.value = false
  editingBookId.value = null
  selectedFile.value = null
  Object.assign(newBook, { title: '', author: 'Admin', type: 'physical', category: 'Novel', stock: 1, harga: 0, description: '', cover: '' })
  showAddModal.value = true
}

const openEditModal = (book) => {
  isEditMode.value = true
  editingBookId.value = book.id
  selectedFile.value = null
  Object.assign(newBook, {
    title: book.title, 
    author: book.author, 
    type: book.type, 
    category: book.category,
    stock: book.stock || 0, 
    harga: book.harga || 0,
    description: book.description || '', 
    cover: book.rawCover || book.cover || ''
  })
  showAddModal.value = true
}

const saveBook = async () => {
  if (!newBook.title.trim()) {
    return Swal.fire({
      title: 'Peringatan!',
      text: 'Judul buku wajib diisi!',
      icon: 'warning',
      confirmButtonColor: '#0d9488'
    })
  }
  
  isProcessing.value = true
  
  const payload = { 
    title: newBook.title,
    author: newBook.author,
    category: newBook.category,
    type: newBook.type,
    stock: newBook.stock,
    harga: newBook.harga,
    description: newBook.description,
    cover: newBook.cover,
    file: selectedFile.value,
    pdfUrl: DEFAULT_PDF, 
    rating: 0, 
    reviews: [] 
  }
  
  if (isEditMode.value) {
    const success = await bookStore.editBook(editingBookId.value, payload)
    if(success) {
      Swal.fire({
        title: 'Berhasil!',
        text: 'Data buku berhasil diperbarui ke Database API!',
        icon: 'success',
        confirmButtonColor: '#0d9488',
        timer: 2000,
        timerProgressBar: true
      })
      showAddModal.value = false
    } else {
      Swal.fire({
        title: 'Gagal Update!',
        text: 'Gagal memperbarui buku ke Database. Periksa log server.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      })
    }
  } else {
    const success = await bookStore.createBook(payload)
    if(success) {
      Swal.fire({
        title: 'Sukses Tambah!',
        text: 'Buku berhasil ditambahkan ke Database API!',
        icon: 'success',
        confirmButtonColor: '#0d9488',
        timer: 2000,
        timerProgressBar: true
      })
      showAddModal.value = false
    } else {
      Swal.fire({
        title: 'Gagal Tambah!',
        text: 'Gagal menambahkan buku ke Database. Cek kesesuaian kolom API.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      })
    }
  }
  isProcessing.value = false
}

const deleteBook = async (id) => {
  const result = await Swal.fire({
    title: 'Hapus Buku?',
    text: "Data buku akan dihapus secara permanen dari Database!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  })

  if (result.isConfirmed) {
    const success = await bookStore.removeBook(id)
    if(success) {
      Swal.fire({
        title: 'Terhapus!',
        text: 'Buku terhapus dari Database!',
        icon: 'success',
        confirmButtonColor: '#0d9488',
        timer: 1500,
        timerProgressBar: true
      })
    } else {
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal menghapus buku.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      })
    }
  }
}

const processOfflineLoan = async () => {
  if (!borrowerName.value.trim() || !selectedBookId.value || !loanDuration.value) {
    return Swal.fire({
      title: 'Lengkapi Data!',
      text: 'Lengkapi data peminjaman terlebih dahulu!',
      icon: 'warning',
      confirmButtonColor: '#0d9488'
    })
  }

  const success = await loanStore.borrowBookOffline(borrowerName.value, selectedBookId.value, parseInt(loanDuration.value))
  if (success) {
    Swal.fire({
      title: 'Peminjaman Berhasil!',
      text: 'Peminjaman offline berhasil diproses secara manual!',
      icon: 'success',
      confirmButtonColor: '#0d9488',
      timer: 2000,
      timerProgressBar: true
    })
    borrowerName.value = ''
    selectedBookId.value = ''
    loanDuration.value = 7
  } else {
    Swal.fire({
      title: 'Stok Kosong!',
      text: 'Gagal memproses peminjaman. Stok mungkin habis.',
      icon: 'error',
      confirmButtonColor: '#ef4444'
    })
  }
}
</script>

<template>
  <div class="space-y-8">
    
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
              <th class="p-3 font-medium">Anggota ID / Nama</th>
              <th class="p-3 font-medium">Buku Fisik</th>
              <th class="p-3 font-medium text-center">Tgl Pengajuan</th>
              <th class="p-3 font-medium text-center">Persetujuan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-amber-50">
            <tr v-for="loan in pendingLoans" :key="loan.id" class="hover:bg-amber-50/30 transition">
              <td class="p-3 font-medium text-slate-800">
                {{ loan.nama_siswa || 'Siswa' }} 
                <span class="text-xs text-slate-500 block">ID: {{ loan.siswa_id }}</span>
              </td>
              <td class="p-3 font-medium">
                {{ loan.nama_buku || 'Judul Buku' }} 
                <span class="text-xs font-normal text-slate-500 block">
                  Sisa Stok: {{ bookStore.books.find(b => String(b.id) === String(loan.buku_id))?.stock || 0 }}
                </span>
              </td>
              <td class="p-3 text-center text-slate-500">
                {{ loan.tanggal_pinjam ? new Date(loan.tanggal_pinjam).toLocaleDateString('id-ID') : 'Menunggu' }}
              </td>
              <td class="p-3 flex justify-center gap-2">
                <button @click="handleApprove(loan.id)" class="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">Setujui</button>
                <button @click="handleReject(loan.id)" class="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200 text-xs transition">Tolak</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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
              <th class="p-3 font-medium">Peminjam</th>
              <th class="p-3 font-medium">Buku</th>
              <th class="p-3 font-medium text-center">Tgl Pinjam</th>
              <th class="p-3 font-medium text-center">Stok Buku</th>
              <th class="p-3 font-medium text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="loan in activeLoans" :key="loan.id" class="hover:bg-slate-50 transition">
              <td class="p-3 font-medium text-slate-800">
                {{ loan.nama_siswa || 'Siswa' }} 
                <span class="text-xs text-slate-500 block">ID: {{ loan.siswa_id }}</span>
              </td>
              <td class="p-3 font-medium">{{ loan.nama_buku || 'Judul Buku' }}</td>
              <td class="p-3 text-center text-slate-500">
                {{ loan.tanggal_pinjam ? new Date(loan.tanggal_pinjam).toLocaleDateString('id-ID') : '-' }}
              </td>
              <td class="p-3 text-center text-slate-600 font-medium">
                {{ bookStore.books.find(b => String(b.id) === String(loan.buku_id))?.stock || 0 }}
              </td>
              <td class="p-3 text-center">
                <button @click="handleReturnBook(loan.id)" class="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-200 text-xs shadow-sm transition">Verifikasi Kembali</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
           <h2 class="text-xl font-bold text-slate-800">Katalog Buku (Admin)</h2>
           <p class="text-sm text-slate-500">Data ini ditarik langsung dari Backend API Anda (Database)</p>
        </div>
        <button @click="openAddModal" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-teal-700 flex items-center gap-2"><Icon name="plus" size="16"/> Tambah Buku via API</button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-600 border-b border-slate-200">
              <th class="p-3 font-medium rounded-tl-lg">Judul</th>
              <th class="p-3 font-medium">Kategori</th>
              <th class="p-3 font-medium text-right">Harga</th>
              <th class="p-3 font-medium text-right">Stok</th>
              <th class="p-3 font-medium text-center rounded-tr-lg">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="book in bookStore.books" :key="book.id" class="hover:bg-slate-50 transition">
              <td class="p-3 font-medium text-slate-800">{{ book.title }}</td>
              <td class="p-3 text-slate-600">{{ book.category }}</td>
              <td class="p-3 text-right text-slate-600">Rp {{ book.harga?.toLocaleString('id-ID') || '0' }}</td>
              <td class="p-3 text-right font-medium" :class="book.stock === 0 ? 'text-red-500' : 'text-slate-700'">{{ book.type === 'physical' ? book.stock : '∞' }}</td>
              <td class="p-3 text-center flex justify-center gap-2">
                <button @click="openEditModal(book)" class="text-blue-500 hover:text-blue-700 font-medium text-xs px-2 py-1 bg-blue-50 rounded transition">Edit</button>
                <button @click="deleteBook(book.id)" class="text-red-500 hover:text-red-700 font-medium text-xs px-2 py-1 bg-red-50 rounded transition">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="bookStore.books.length === 0" class="text-center py-6 text-slate-500 bg-slate-50">
          Database buku Anda kosong. Silakan tambah buku baru.
        </div>
      </div>

      <div v-if="showAddModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div class="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
           <h3 class="text-xl font-bold text-slate-800 mb-4">{{ isEditMode ? 'Edit Buku (API)' : 'Tambah Buku Baru (API)' }}</h3>
           <form @submit.prevent="saveBook" class="space-y-4">
             <div>
               <label class="block text-sm font-medium text-slate-700 mb-1">Judul Buku</label>
               <input v-model="newBook.title" type="text" required class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
             </div>
             
             <div class="flex gap-4">
               <div class="w-1/2">
                 <label class="block text-sm font-medium text-slate-700 mb-1">Kategori / Jenis</label>
                 <input v-model="newBook.category" type="text" placeholder="Cth: Novel, Religy" required class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
               </div>
               <div class="w-1/2">
                 <label class="block text-sm font-medium text-slate-700 mb-1">Harga (Rp)</label>
                 <input v-model.number="newBook.harga" type="number" min="0" required class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
               </div>
             </div>

             <div class="flex gap-4">
               <div class="w-1/2">
                 <label class="block text-sm font-medium text-slate-700 mb-1">Penulis (Opsional)</label>
                 <input v-model="newBook.author" type="text" class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
               </div>
               <div class="w-1/2">
                 <label class="block text-sm font-medium text-slate-700 mb-1">Tipe Fisik / Digital</label>
                 <select v-model="newBook.type" class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500 bg-white">
                    <option value="physical">Buku Fisik</option>
                    <option value="digital">E-Book (Digital)</option>
                 </select>
               </div>
             </div>

             <div class="flex gap-4">
               <div class="w-1/2">
                 <label class="block text-sm font-medium text-slate-700 mb-1">Upload Cover (Gambar)</label>
                 <input type="file" accept="image/*" @change="handleFileChange" class="w-full border border-slate-300 rounded-lg px-2 py-1.5 outline-none focus:border-teal-500 bg-white text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100">
                 <p v-if="isEditMode && newBook.cover" class="text-[10px] text-slate-500 mt-1">Abaikan jika tidak ingin mengubah gambar.</p>
               </div>
               <div class="w-1/2" v-if="newBook.type === 'physical'">
                 <label class="block text-sm font-medium text-slate-700 mb-1">Stok Awal</label>
                 <input v-model.number="newBook.stock" type="number" min="0" required class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
               </div>
             </div>

             <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
               <button type="button" @click="showAddModal = false" :disabled="isProcessing" class="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50">Batal</button>
               <button type="submit" :disabled="isProcessing" class="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50">
                  {{ isProcessing ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan ke Database') }}
               </button>
             </div>
           </form>
         </div>
      </div>
    </div>
  </div>
</template>