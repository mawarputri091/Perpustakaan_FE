import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBookStore } from './bookStore'

const API_URL = 'http://192.168.1.3:3000'

// Ambil token auth dengan aman
const getHeaders = () => {
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
      loans.value = result.data || result
    } catch (e) {
      // ✅ FIX: tidak lagi diam-diam fallback ke data lokal/localStorage.
      // Kalau fetch gagal, loans dikosongkan dan error dicatat — supaya tidak ada
      // data "hantu" yang sebenarnya tidak pernah tersimpan di server.
      console.error('[fetchLoans] Gagal mengambil data peminjaman dari server:', e)
      loans.value = []
    }
  }

  // 2. Request Pinjam Buku dari Sisi User/Siswa
  // ✅ FIX: status TIDAK dikirim dari FE — BE yang menentukan status awal ('menunggu'),
  // jangan override dari client supaya tidak bisa dimanipulasi.
  const requestLoan = async (userId, bookId) => {
    const payload = {
      siswa_id: userId,
      buku_id: bookId
    }

    try {
      const res = await fetch(`${API_URL}/peminjaman`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Respons error dari Backend:', errorData)
        throw new Error(errorData.message || 'Gagal request pinjam')
      }
      await fetchLoans()
      return true
    } catch (e) {
      console.error('Error POST /peminjaman:', e)
      return false
    }
  }

  // 3. Setujui Peminjaman oleh Admin
  const approveLoan = async (loanId) => {
    try {
      const response = await fetch(`${API_URL}/peminjaman/approve/${loanId}`, {
        method: 'POST',
        headers: getHeaders()
        // ✅ FIX: tidak perlu kirim body { status: 'approved' } — endpoint approve
        // di BE tidak membaca body sama sekali, status ditentukan otomatis jadi 'dipinjam'.
      })

      if (!response.ok) {
        const errResponse = await response.json().catch(() => ({}))
        console.error('Backend menolak persetujuan:', errResponse)
        throw new Error(errResponse.message || 'Gagal approve pinjam dari response backend')
      }

      await fetchLoans()
      try {
        await bookStore.fetchBooks()
      } catch (bookError) {
        console.error('Peringatan: Gagal memperbarui katalog buku, tapi status peminjaman sukses:', bookError)
      }
      return true

    } catch (e) {
      // ✅ FIX: fallback palsu yang mengubah state lokal ('dipinjam' + updateStock manual)
      // DIHAPUS. Kalau approve gagal di server, FE tidak boleh berpura-pura berhasil —
      // ini yang menyebabkan stok "kelihatan" berkurang padahal di database tidak berubah.
      console.error('Error saat melakukan approveLoan:', e)
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
      if (!res.ok) {
        const errResponse = await res.json().catch(() => ({}))
        throw new Error(errResponse.message || 'Gagal menolak peminjaman')
      }
      await fetchLoans()
      return true
    } catch (e) {
      // ✅ FIX: fallback palsu DIHAPUS, sama alasannya seperti approveLoan.
      console.error('Error saat melakukan rejectLoan:', e)
      return false
    }
  }

  // 5. Transaksi Peminjaman Langsung di Kasir (Offline)
  // ✅ DIUBAH: tidak perlu siswa_id sama sekali — pengunjung offline tidak punya akun.
  // Cukup kirim nama_peminjam (nama pengunjung) dan buku_id. BE akan simpan nama ini
  // langsung di kolom nama_peminjam_offline, tanpa terikat ke 1 ID yang dipakai bersama.
  const borrowBookOffline = async (borrowerName, bookId, durationDays) => {
    const payload = {
      nama_peminjam: borrowerName,
      buku_id: bookId
    }
    try {
      const res = await fetch(`${API_URL}/peminjaman/offline`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      const resJson = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error('Backend menolak peminjaman offline:', resJson)
        return { success: false, message: resJson.message || `Gagal pinjam offline (HTTP ${res.status})` }
      }

      await fetchLoans()
      await bookStore.fetchBooks()
      return { success: true, message: 'Peminjaman offline berhasil diproses' }
    } catch (e) {
      console.error('Error saat melakukan borrowBookOffline:', e)
      return { success: false, message: 'Tidak bisa terhubung ke server' }
    }
  }

  // 6. Verifikasi Pengembalian Buku
  const returnBook = async (loanId) => {
    try {
      const res = await fetch(`${API_URL}/peminjaman/${loanId}/return`, {
        method: 'PUT',
        headers: getHeaders()
      })
      if (!res.ok) {
        const errResponse = await res.json().catch(() => ({}))
        throw new Error(errResponse.message || 'Gagal mengembalikan buku')
      }
      await fetchLoans()
      await bookStore.fetchBooks()
      return true
    } catch (e) {
      // ✅ FIX: fallback palsu DIHAPUS.
      console.error('Error saat melakukan returnBook:', e)
      return false
    }
  }

  const userLoans = computed(() => (userId) => loans.value.filter(l => l.siswa_id === userId))

  return { loans, fetchLoans, requestLoan, approveLoan, rejectLoan, borrowBookOffline, returnBook, userLoans }
})
