<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useBookStore } from '../stores/bookStore'
import { useLoanStore } from '../stores/loanStore'
import { useAuthStore } from '../stores/authStore'
import { mockUsers, DEFAULT_PDF } from '../data/mockData'
import Icon from '../components/Icon.vue'
import Swal from 'sweetalert2'

const bookStore = useBookStore()
const loanStore = useLoanStore()
const authStore = useAuthStore()

const selectedBookId = ref('')
const loanDuration = ref(7) 
const borrowerName = ref('') 

// ==========================================
// 👥 STATE & CRUD AKSI MANAJEMEN USER BARU
// ==========================================
const showUserModal = ref(false)
const editingUser = reactive({ id: null, name: '', email: '', phone: '', membership: 'Gratis' })
const isProcessingUser = ref(false)

// Fungsi membuka modal edit user
const openEditUserModal = (user) => {
  Object.assign(editingUser, {
    id: user.id,
    name: user.name || user.username,
    email: user.email || '',
    phone: user.phone && user.phone !== '-' ? user.phone : (user.no_telp && user.no_telp !== '-' ? user.no_telp : ''),
    membership: user.membership || 'Gratis'
  })
  showUserModal.value = true
}

// Fungsi menyimpan perubahan user ke Backend
const saveUserChanges = async () => {
  if (!editingUser.name.trim()) {
    return Swal.fire({ title: 'Peringatan!', text: 'Nama pengguna tidak boleh kosong!', icon: 'warning', confirmButtonColor: '#0d9488' })
  }

  isProcessingUser.value = true
  
  const payload = {
    username: editingUser.name,
    email: editingUser.email,
    phone: editingUser.phone, 
    membership: editingUser.membership
  }

  try {
    const success = await authStore.updateUser(editingUser.id, payload)
    if (success) {
      Swal.fire({ title: 'Berhasil!', text: 'Data pengguna berhasil diperbarui!', icon: 'success', confirmButtonColor: '#0d9488', timer: 2000, timerProgressBar: true })
      showUserModal.value = false
      await fetchAdminUsers() 
    } else {
      Swal.fire({ title: 'Gagal!', text: 'Gagal memperbarui data pengguna.', icon: 'error', confirmButtonColor: '#ef4444' })
    }
  } catch (error) {
    console.error(error)
  } finally {
    isProcessingUser.value = false
  }
}

// Fungsi menghapus user dari Backend
const deleteUser = async (id) => {
  const result = await Swal.fire({
    title: 'Hapus Pengguna?',
    text: "Akun pengguna ini akan dihapus secara permanen dari database!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus Akun!',
    cancelButtonText: 'Batal'
  })

  if (result.isConfirmed) {
    const success = await authStore.removeUser(id)
    if (success) {
      Swal.fire({ title: 'Dihapus!', text: 'Akun pengguna berhasil dihapus.', icon: 'success', confirmButtonColor: '#64748b', timer: 2000, timerProgressBar: true })
      await fetchAdminUsers() 
    } else {
      Swal.fire({ title: 'Gagal!', text: 'Gagal menghapus pengguna.', icon: 'error', confirmButtonColor: '#ef4444' })
    }
  }
}

// 🔍 STATE BARU: Filter Katalog Admin Buku
const searchQuery = ref('')
const selectedType = ref('Semua Mode')
const selectedCategory = ref('Semua Kategori')

// 👥 STATE BARU: Pencarian & Filter Akun Pengguna
const userSearchQuery = ref('')
const selectedMembershipFilter = ref('Semua Akun')
const adminUsersList = ref([]) 

// 🌟 Persetujuan & Filter Peminjaman (Match status BE 'menunggu')
const pendingLoans = computed(() => {
  if (!loanStore.loans || !Array.isArray(loanStore.loans)) return []
  return loanStore.loans.filter(l => l.status === 'menunggu')
})

const activeLoans = computed(() => {
  if (!loanStore.loans || !Array.isArray(loanStore.loans)) return []
  return loanStore.loans.filter(l => l.status === 'dipinjam')
})

const physicalBooksAvailable = computed(() => {
  if (!bookStore.books || !Array.isArray(bookStore.books)) return []
  return bookStore.books.filter(b => b.type === 'physical' && b.stock > 0)
})

// 👥 COMPUTED: Menyaring Daftar Pengguna
const filteredUsers = computed(() => {
  const allUsers = adminUsersList.value || []
  return allUsers.filter(user => {
    const nameToSearch = user.name || user.username || ''
    const emailToSearch = user.email || ''
    
    const matchesSearch = nameToSearch.toLowerCase().includes(userSearchQuery.value.toLowerCase()) || 
                          emailToSearch.toLowerCase().includes(userSearchQuery.value.toLowerCase())
    
    const matchesMembership = 
      selectedMembershipFilter.value === 'Semua Akun' ||
      (selectedMembershipFilter.value === 'Premium' && user.membership === 'Premium') ||
      (selectedMembershipFilter.value === 'Gratis / Regular' && (user.membership === 'Gratis' || user.membership === 'free' || !user.membership))

    return matchesSearch && matchesMembership
  })
})

const filteredBooks = computed(() => {
  const allBooks = bookStore.books || []
  const q = searchQuery.value.toLowerCase().trim()
  return allBooks.filter(book => {
    const matchesSearch =
      book.title?.toLowerCase().includes(q) ||
      book.author?.toLowerCase().includes(q)
    const matchesType = 
      selectedType.value === 'Semua Mode' || 
      (selectedType.value === 'E-Book' && book.type === 'digital') ||
      (selectedType.value === 'Fisik' && book.type === 'physical')
    const matchesCategory = 
      selectedCategory.value === 'Semua Kategori' || 
      book.category === selectedCategory.value

    return matchesSearch && matchesType && matchesCategory
  })
})

const uniqueCategories = computed(() => {
  if (!bookStore.books || !Array.isArray(bookStore.books)) return ['Semua Kategori']
  const categories = bookStore.books.map(b => b.category).filter(Boolean)
  return ['Semua Kategori', ...new Set(categories)]
})

// Fungsi Fetch data user dari Backend API
const fetchAdminUsers = async () => {
  const res = await authStore.fetchAllUsers()
  if (res) {
    adminUsersList.value = res
  } else {
    adminUsersList.value = [
      { id: 1, name: 'M. Fariz Rizki (Offline Cache)', email: 'fariz@gmail.com', membership: 'Premium' }
    ]
  }
}

onMounted(async () => {
  await bookStore.fetchBooks()
  await loanStore.fetchLoans()
  await fetchAdminUsers() 
})

const handleApprove = async (id) => {
  const success = await loanStore.approveLoan(id)
  if (success) {
    Swal.fire({ title: 'Disetujui!', text: 'Permintaan peminjaman disetujui. Stok buku berhasil dikurangi.', icon: 'success', confirmButtonColor: '#0d9488', timer: 2000, timerProgressBar: true })
  } else {
    Swal.fire({ title: 'Gagal!', text: 'Gagal menyetujui peminjaman.', icon: 'error', confirmButtonColor: '#ef4444' })
  }
}

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
    const success = await loanStore.rejectLoan(id)
    if (success) {
      Swal.fire({ title: 'Ditolak!', text: 'Permintaan peminjaman telah ditolak.', icon: 'info', confirmButtonColor: '#64748b', timer: 2000, timerProgressBar: true })
    }
  }
}

const handleReturnBook = async (loanId) => {
  const success = await loanStore.returnBook(loanId)
  if (success) {
    Swal.fire({ title: 'Berhasil Kembali!', text: 'Buku berhasil dikembalikan. Stok bertambah.', icon: 'success', confirmButtonColor: '#10b981', timer: 2000, timerProgressBar: true })
  }
}

// CRUD API Buku State
const showAddModal = ref(false)
const isEditMode = ref(false)
const editingBookId = ref(null)

const newBook = reactive({ title: '', author: '', type: 'physical', category: '', stock: 1, harga: 0, description: '', cover: '' })
const isProcessing = ref(false)
const selectedFile = ref(null)
const selectedPdfFile = ref(null) 

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0] || null
}

const handlePdfChange = (event) => {
  selectedPdfFile.value = event.target.files[0] || null
}

const openAddModal = () => {
  isEditMode.value = false
  editingBookId.value = null
  selectedFile.value = null
  selectedPdfFile.value = null 
  Object.assign(newBook, { title: '', author: 'Admin', type: 'physical', category: 'Novel', stock: 1, harga: 0, description: '', cover: '' })
  showAddModal.value = true
}

const openEditModal = (book) => {
  isEditMode.value = true
  editingBookId.value = book.id
  selectedFile.value = null
  selectedPdfFile.value = null 
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
    return Swal.fire({ title: 'Peringatan!', text: 'Judul buku wajib diisi!', icon: 'warning', confirmButtonColor: '#0d9488' })
  }
  
  isProcessing.value = true
  
  const payload = { 
    title: newBook.title,
    author: newBook.author,
    category: newBook.category,
    type: newBook.type,
    stock: newBook.type === 'digital' ? 0 : newBook.stock, 
    harga: newBook.harga,
    description: newBook.description,
    cover: newBook.cover,
    file: selectedFile.value, 
    file_pdf: selectedPdfFile.value, 
    pdfUrl: DEFAULT_PDF, 
    rating: 0, 
    reviews: [] 
  }
  
  if (isEditMode.value) {
    const success = await bookStore.editBook(editingBookId.value, payload)
    if(success) {
      Swal.fire({ title: 'Berhasil!', text: 'Data buku berhasil diperbarui!', icon: 'success', confirmButtonColor: '#0d9488', timer: 2000, timerProgressBar: true })
      showAddModal.value = false
    }
  } else {
    const success = await bookStore.createBook(payload)
    if(success) {
      Swal.fire({ title: 'Sukses Tambah!', text: 'Buku berhasil ditambahkan!', icon: 'success', confirmButtonColor: '#0d9488', timer: 2000, timerProgressBar: true })
      showAddModal.value = false
    }
  }
  isProcessing.value = false
}

const deleteBook = async (id) => {
  const result = await Swal.fire({
    title: 'Hapus Buku?',
    text: "Data buku akan dihapus secara permanen!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus!'
  })

  if (result.isConfirmed) {
    await bookStore.removeBook(id)
  }
}

const processOfflineLoan = async () => {
  if (!borrowerName.value.trim() || !selectedBookId.value || !loanDuration.value) {
    return Swal.fire({ title: 'Lengkapi Data!', text: 'Lengkapi data peminjaman terlebih dahulu!', icon: 'warning', confirmButtonColor: '#0d9488' })
  }

  const result = await loanStore.borrowBookOffline(borrowerName.value, selectedBookId.value, parseInt(loanDuration.value))
  if (result.success) {
    Swal.fire({ title: 'Peminjaman Berhasil!', text: 'Peminjaman offline berhasil diproses!', icon: 'success', confirmButtonColor: '#0d9488', timer: 2000, timerProgressBar: true })
    borrowerName.value = ''
    selectedBookId.value = ''
    loanDuration.value = 7
  }
}
</script>

<template>
  <div class="space-y-8">
    
    <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl p-6 text-white border border-slate-700">
      <div class="flex items-center gap-3 mb-6">
        <div class="p-2.5 bg-teal-600 rounded-xl text-white">
          <Icon name="search" size="22" />
        </div>
        <div>
          <h2 class="text-xl font-bold tracking-tight">Manajemen Akun Pengguna</h2>
          <p class="text-xs text-slate-400">Monitoring status keanggotaan pengguna (Akun Gratis vs Premium)</p>
        </div>
      </div>

      <div class="mb-5 flex flex-col md:flex-row gap-4 items-center">
        <div class="relative w-full md:flex-1">
          <input 
            v-model="userSearchQuery"
            type="text" 
            placeholder="Cari nama anggota atau email..." 
            class="w-full pl-4 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-white text-sm transition"
          />
        </div>
        <div class="w-full md:w-auto">
          <select 
            v-model="selectedMembershipFilter"
            class="w-full md:w-48 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-200 text-sm transition"
          >
            <option value="Semua Akun">Semua Akun</option>
            <option value="Premium">Premium ⭐</option>
            <option value="Gratis / Regular">Gratis / Regular</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/40">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-800/60 text-slate-300 border-b border-slate-700 font-medium">
              <th class="p-3">Nama Pengguna</th>
              <th class="p-3">Email</th>
              <th class="p-3">No. WhatsApp</th>
              <th class="p-3 text-center">Status Membership</th>
              <th class="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 text-slate-300">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-slate-800/40 transition">
              <td class="p-3 font-semibold text-white">{{ user.name || user.username }}</td>
              <td class="p-3 text-slate-400">{{ user.email }}</td>
              <td class="p-3 text-slate-400">{{ user.phone || user.no_telp || '-' }}</td>
              <td class="p-3 text-center">
                <span v-if="user.membership === 'GOD'" class="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">GOD 👑</span>
                <span v-else-if="user.membership === 'Premium'" class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Premium ⭐</span>
                <span v-else class="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">Gratis</span>
              </td>
              <td class="p-3 text-center flex justify-center gap-2">
                <button @click="openEditUserModal(user)" class="text-blue-400 hover:text-blue-300 font-medium text-xs px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded transition">Edit</button>
                <button @click="deleteUser(user.id)" class="text-red-400 hover:text-red-300 font-medium text-xs px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded transition">Hapus</button>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="5" class="text-center py-6 text-slate-500">Tidak ada pengguna yang sesuai filter.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-amber-100 rounded-lg text-amber-700">
          <Icon name="bookmark" size="20" />
        </div>
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
                {{ loan.nama_siswa || loan.nama_peminjam_offline || 'Pengunjung' }}
                <span v-if="loan.siswa_id" class="text-xs text-slate-500 block">ID: {{ loan.siswa_id }}</span>
                <span v-else class="text-xs text-slate-500 block">Transaksi Offline</span>
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
        <button @click="openAddModal" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-teal-700 flex items-center gap-2">
          <Icon name="plus" size="16"/> Tambah Buku via API
        </button>
      </div>

      <div class="mb-6 flex flex-col md:flex-row gap-3 items-stretch bg-slate-50/70 border border-slate-200 rounded-2xl p-3 shadow-sm">
        <div class="relative w-full md:flex-1">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon name="search" size="18" />
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari judul atau penulis..."
            class="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/60 focus:border-teal-400 text-slate-700 text-sm placeholder-slate-400 transition"
          />
        </div>
        <select
          v-model="selectedType"
          class="w-full md:w-44 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/60 focus:border-teal-400 text-slate-700 text-sm transition cursor-pointer"
        >
          <option value="Semua Mode">Semua Mode</option>
          <option value="E-Book">E-Book</option>
          <option value="Fisik">Fisik</option>
        </select>
        <select
          v-model="selectedCategory"
          class="w-full md:w-52 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/60 focus:border-teal-400 text-slate-700 text-sm transition cursor-pointer"
        >
          <option v-for="cat in uniqueCategories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
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
            <tr v-for="book in filteredBooks" :key="book.id" class="hover:bg-slate-50 transition">
              <td class="p-3 font-medium text-slate-800">{{ book.title }}</td>
              <td class="p-3 text-slate-600">{{ book.category }}</td>
              <td class="p-3 text-right text-slate-600">Rp {{ book.harga?.toLocaleString('id-ID') || '0' }}</td>
              <td class="p-3 text-right font-medium" :class="book.stock === 0 ? 'text-red-500' : 'text-slate-700'">
                {{ book.type === 'physical' ? book.stock : '∞' }}
              </td>
              <td class="p-3 text-center flex justify-center gap-2">
                <button @click="openEditModal(book)" class="text-blue-500 hover:text-blue-700 font-medium text-xs px-2 py-1 bg-blue-50 rounded transition">Edit</button>
                <button @click="deleteBook(book.id)" class="text-red-500 hover:text-red-700 font-medium text-xs px-2 py-1 bg-red-50 rounded transition">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredBooks.length === 0" class="text-center py-6 text-slate-500 bg-slate-50">
          Database buku Anda kosong atau tidak cocok dengan filter. Silakan tambah buku baru.
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 👥 MODAL EDIT AKUN PENGGUNA                 -->
    <!-- ========================================== -->
    <div
      v-if="showUserModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      @click.self="showUserModal = false"
    >
      <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-800">Edit Akun Pengguna</h3>
          <button @click="showUserModal = false" class="text-slate-400 hover:text-slate-600 transition">
            <Icon name="x" size="20" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Pengguna</label>
            <input v-model="editingUser.name" type="text" placeholder="Nama..." class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input v-model="editingUser.email" type="email" placeholder="Email..." class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp</label>
            <input v-model="editingUser.phone" type="text" placeholder="08..." class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Status Membership</label>
            <select v-model="editingUser.membership" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm bg-white cursor-pointer">
              <option value="Gratis">Gratis</option>
              <option value="Premium">Premium ⭐</option>
              <option value="GOD">GOD 👑</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button @click="showUserModal = false" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition">Batal</button>
          <button @click="saveUserChanges" :disabled="isProcessingUser" class="px-4 py-2 rounded-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
            {{ isProcessingUser ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 📚 MODAL TAMBAH / EDIT BUKU                 -->
    <!-- ========================================== -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      @click.self="showAddModal = false"
    >
      <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-800">{{ isEditMode ? 'Edit Buku' : 'Tambah Buku Baru' }}</h3>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600 transition">
            <Icon name="x" size="20" />
          </button>
        </div>
        <div class="p-6 space-y-4 overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Judul Buku</label>
            <input v-model="newBook.title" type="text" placeholder="Judul buku..." class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Penulis</label>
              <input v-model="newBook.author" type="text" placeholder="Penulis..." class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
              <input v-model="newBook.category" type="text" placeholder="Kategori..." class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
              <select v-model="newBook.type" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm bg-white cursor-pointer">
                <option value="physical">Fisik</option>
                <option value="digital">E-Book</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Stok</label>
              <input v-model.number="newBook.stock" type="number" min="0" :disabled="newBook.type === 'digital'" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm disabled:bg-slate-100 disabled:text-slate-400">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Harga (Rp)</label>
              <input v-model.number="newBook.harga" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
            <textarea v-model="newBook.description" rows="3" placeholder="Deskripsi singkat..." class="w-full border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/40 text-sm resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Cover Buku (gambar)</label>
            <input @change="handleFileChange" type="file" accept="image/*" class="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer">
          </div>
          <div v-if="newBook.type === 'digital'">
            <label class="block text-sm font-medium text-slate-700 mb-1">File PDF (E-Book)</label>
            <input @change="handlePdfChange" type="file" accept="application/pdf" class="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer">
          </div>
        </div>
        <div class="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button @click="showAddModal = false" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition">Batal</button>
          <button @click="saveBook" :disabled="isProcessing" class="px-4 py-2 rounded-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
            {{ isProcessing ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Buku') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>