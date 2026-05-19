import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBookStore } from './bookStore'

const API_URL = 'http://172.19.136.62:3000'

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

  const fetchLoans = async () => {
    try {
      const res = await fetch(`${API_URL}/peminjaman`, { headers: getHeaders() })
      if (!res.ok) throw new Error('Gagal fetch peminjaman')
      const result = await res.json()
      loans.value = result.data || result
    } catch (e) {
      console.warn('[API Offline] Gagal GET /peminjaman. Tarik dari LocalStorage.')
      loans.value = JSON.parse(localStorage.getItem('loans')) || []
    }
  }

  const requestLoan = async (userId, bookId) => {
    const payload = { userId, bookId, requestDate: new Date().toISOString(), status: 'pending' }
    try {
      const res = await fetch(`${API_URL}/peminjaman`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Gagal request pinjam')
      await fetchLoans()
      return true
    } catch (e) {
      loans.value.push({ id: Date.now(), ...payload })
      localStorage.setItem('loans', JSON.stringify(loans.value))
      return true
    }
  }

  const approveLoan = async (loanId) => {
     const payload = { status: 'active', borrowDate: new Date().toISOString() }
     try {
        const res = await fetch(`${API_URL}/peminjaman/${loanId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Gagal approve pinjam')
        await fetchLoans()
        bookStore.fetchBooks()
        return true
     } catch (e) {
        const loan = loans.value.find(l => l.id === loanId)
        if (loan && loan.status === 'pending') {
           loan.status = 'active'; loan.borrowDate = payload.borrowDate
           bookStore.updateStock(loan.bookId, -1)
           localStorage.setItem('loans', JSON.stringify(loans.value))
           return true
        }
        return false
     }
  }
  
  const rejectLoan = async (loanId) => {
     const payload = { status: 'rejected', rejectDate: new Date().toISOString() }
     try {
        const res = await fetch(`${API_URL}/peminjaman/${loanId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        })
        if (res.ok) await fetchLoans()
     } catch (e) {
        const loan = loans.value.find(l => l.id === loanId)
        if (loan && loan.status === 'pending') {
           loan.status = 'rejected'; loan.rejectDate = payload.rejectDate
           localStorage.setItem('loans', JSON.stringify(loans.value))
        }
     }
  }

  const borrowBookOffline = async (borrowerName, bookId, durationDays) => {
    const payload = { 
      userId: 'offline', borrowerName, bookId, status: 'active', 
      borrowDate: new Date().toISOString(), 
      dueDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString() 
    }
    try {
      const res = await fetch(`${API_URL}/peminjaman`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Gagal pinjam offline')
      await fetchLoans()
      bookStore.fetchBooks()
      return true
    } catch (e) {
      loans.value.push({ id: Date.now(), ...payload })
      bookStore.updateStock(bookId, -1)
      localStorage.setItem('loans', JSON.stringify(loans.value))
      return true
    }
  }

  const returnBook = async (loanId) => {
    const payload = { status: 'returned', returnDate: new Date().toISOString() }
    try {
      const res = await fetch(`${API_URL}/peminjaman/${loanId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Gagal mengembalikan buku')
      await fetchLoans()
      bookStore.fetchBooks()
    } catch (e) {
      const loan = loans.value.find(l => l.id === loanId)
      if (loan && loan.status === 'active') {
        loan.status = 'returned'; loan.returnDate = payload.returnDate
        bookStore.updateStock(loan.bookId, 1)
        localStorage.setItem('loans', JSON.stringify(loans.value))
      }
    }
  }

  const userLoans = computed(() => (userId) => loans.value.filter(l => l.userId === userId))
  
  return { loans, fetchLoans, requestLoan, approveLoan, rejectLoan, borrowBookOffline, returnBook, userLoans }
})
