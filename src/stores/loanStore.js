import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBookStore } from './bookStore'

const API_URL = 'http://192.168.1.11:3000'

// Ambil token auth dengan aman
const getHeaders = () => {
  // 🌟 PERBAIKAN: Selaraskan hanya menggunakan api_token sesuai authStore.js
  const token = localStorage.getItem('api_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const useLoanStore = defineStore('loan', () => {
  const loans = ref([])
  const bookStore = useBookStore()

  // 1. Ambil data peminjaman untuk Admin maupun User
  const fetchLoans = async () => {
    try {
      const res = await fetch(`${API_URL}/peminjaman`, { headers: getHeaders() })
      if (!res.ok) throw new Error('Gagal fetch peminjaman')
      const result = await res.json()
      console.log('DATA PEMINJAMAN API:', result)
      // Mengantisipasi jika backend membungkus datanya di dalam 'data' atau langsung array
      loans.value = result.data || result
    } catch (e) {
      console.warn('[API Offline] Gagal GET /peminjaman. Tarik dari LocalStorage.')
      loans.value = JSON.parse(localStorage.getItem('loans')) || []
    }
  }

  // 2. Request Pinjam Buku dari Sisi User/Siswa
  const requestLoan = async (userId, bookId) => {
    // 🌟 PERBAIKAN: Mengubah nama properti sesuai dengan response database di Postman Anda
    const payload = {
  siswa_id: userId,
  buku_id: bookId,
  status: 'pending'
}

    try {
      const res = await fetch(`${API_URL}/peminjaman`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Respons error dari Backend:', errorData)
        throw new Error('Gagal request pinjam')
      }
      await fetchLoans()
      return true
    } catch (e) {
  console.error('Error POST /peminjaman:', e)
  return false
}
  }

  // 3. Setujui Peminjaman oleh Admin
// 3. Setujui Peminjaman oleh Admin
  const approveLoan = async (loanId) => {
     try {
        // 🌟 PERBAIKAN: Gunakan API_URL & sertakan getHeaders() agar token admin terkirim
        const response = await fetch(`${API_URL}/peminjaman/approve/${loanId}`, {
          method: 'POST',
          headers: getHeaders(), // <-- Menggunakan headers terpusat yang ada tokennya
          body: JSON.stringify({ status: 'approved' })
        })

        // Karena fetch tidak otomatis masuk ke catch jika status 400/500, kita handle manual
        if (!response.ok) {
           const errResponse = await response.json().catch(() => ({}))
           console.error('Backend menolak persetujuan:', errResponse)
           throw new Error('Gagal approve pinjam dari response backend')
        }

        // 🌟 PERBAIKAN: Ambil data peminjaman terlebih dahulu agar list UI TIDAK HILANG
        await fetchLoans()
        // 🌟 PERBAIKAN: Bungkus fetchBooks dengan try-catch terpisah 
      // Supaya kalau backend /buku error 500, list peminjaman di atas tetap aman ter-render!
      try {
         await bookStore.fetchBooks()
      } catch (bookError) {
         console.error('Peringatan: Gagal memperbarui katalog buku, tapi status peminjaman sukses:', bookError)
      }
      return true

     } catch (e) {
        console.error('Error saat melakukan approveLoan:', e)
        
        // Fallback lokal tetap dipertahankan jika server benar-benar mati
        const loan = loans.value.find(l => l.id === loanId)
        if (loan && loan.status === 'pending') {
           loan.status = 'dipinjam'
           loan.tanggal_pinjam = new Date().toISOString()
           bookStore.updateStock(loan.buku_id, -1)
           localStorage.setItem('loans', JSON.stringify(loans.value))
           return true
        }
        return false
     }
  }
  
  // 4. Tolak Peminjaman oleh Admin
  const rejectLoan = async (loanId) => {
     try {
        const res = await fetch(`${API_URL}/peminjaman/${loanId}/reject`, {
          method: 'PUT',
          headers: getHeaders()
        })
        if (res.ok) await fetchLoans()
     } catch (e) {
        console.error(e)
        const loan = loans.value.find(l => l.id === loanId)
        if (loan && loan.status === 'pending') {
           loan.status = 'rejected'
           localStorage.setItem('loans', JSON.stringify(loans.value))
        }
     }
  }

  // 5. Transaksi Peminjaman Langsung di Kasir (Offline)
  const borrowBookOffline = async (borrowerName, bookId, durationDays) => {
    // 🌟 PERBAIKAN: Menyesuaikan properti offline ke snake_case database
    const payload = { 
      siswa_id: 'offline', 
      nama_siswa: borrowerName, 
      buku_id: bookId, 
      status: 'pending', 
      tanggal_pinjam: new Date().toISOString() // Tambahkan ini jika kolom DB membutuhkannya
    }
    try {
      const res = await fetch(`${API_URL}/peminjaman/offline`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Gagal pinjam offline')
      await fetchLoans()
      await bookStore.fetchBooks()
      return true
    } catch (e) {
      loans.value.push({ id: Date.now(), ...payload })
      bookStore.updateStock(bookId, -1)
      localStorage.setItem('loans', JSON.stringify(loans.value))
      return true
    }
  }

  // 6. Verifikasi Pengembalian Buku
  const returnBook = async (loanId) => {
    try {
      const res = await fetch(`${API_URL}/peminjaman/${loanId}/return`, {
        method: 'PUT',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Gagal mengembalikan buku')
      await fetchLoans()
      await bookStore.fetchBooks()
    } catch (e) {
      console.error(e)
      const loan = loans.value.find(l => l.id === loanId)
      // 🌟 PERBAIKAN: Menyesuaikan status lokal menjadi 'dikembalikan'
      if (loan && loan.status === 'dipinjam') {
        loan.status = 'dikembalikan'
        bookStore.updateStock(loan.buku_id, 1)
        localStorage.setItem('loans', JSON.stringify(loans.value))
      }
    }
  }

  // 🌟 PERBAIKAN: Menyesuaikan pencarian id siswa berdasarkan properti baru (siswa_id)
  const userLoans = computed(() => (userId) => loans.value.filter(l => l.siswa_id === userId))
  
  return { loans, fetchLoans, requestLoan, approveLoan, rejectLoan, borrowBookOffline, returnBook, userLoans }
})