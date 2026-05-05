import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBookStore } from './bookStore'

export const useLoanStore = defineStore('loan', () => {
  const loans = ref(JSON.parse(localStorage.getItem('loans')) || [])
  const bookStore = useBookStore()

  const requestLoan = (userId, bookId) => {
    const book = bookStore.books.find(b => b.id === bookId)
    if (book && book.stock > 0) {
      loans.value.push({
        id: Date.now(), userId, bookId,
        requestDate: new Date().toISOString(),
        status: 'pending'
      })
      localStorage.setItem('loans', JSON.stringify(loans.value))
      return true
    }
    return false
  }

  const approveLoan = (loanId) => {
     const loan = loans.value.find(l => l.id === loanId)
     if (loan && loan.status === 'pending') {
        loan.status = 'active'
        loan.borrowDate = new Date().toISOString()
        loan.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        bookStore.updateStock(loan.bookId, -1)
        localStorage.setItem('loans', JSON.stringify(loans.value))
        return true
     }
     return false
  }

  const returnBook = (loanId) => {
    const loan = loans.value.find(l => l.id === loanId)
    if (loan && loan.status === 'active') {
      loan.status = 'returned'
      loan.returnDate = new Date().toISOString()
      bookStore.updateStock(loan.bookId, 1)
      localStorage.setItem('loans', JSON.stringify(loans.value))
    }
  }

  const userLoans = computed(() => (userId) => loans.value.filter(l => l.userId === userId))
  
  return { loans, requestLoan, approveLoan, returnBook, userLoans }
})
