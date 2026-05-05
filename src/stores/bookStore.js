import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mockBooks } from '../data/mockData'

export const useBookStore = defineStore('book', () => {
  const books = ref(JSON.parse(localStorage.getItem('books')) || mockBooks)
  const bookmarks = ref(JSON.parse(localStorage.getItem('bookmarks')) || {})
  const readingProgress = ref(JSON.parse(localStorage.getItem('progress')) || {})

  const saveStore = () => localStorage.setItem('books', JSON.stringify(books.value))

  const updateStock = (bookId, change) => {
    const b = books.value.find(b => b.id === bookId)
    if (b && b.type === 'physical') { b.stock += change; saveStore(); }
  }

  const saveProgress = (userId, bookId, page) => {
    if (!readingProgress.value[userId]) readingProgress.value[userId] = {}
    readingProgress.value[userId][bookId] = page
    localStorage.setItem('progress', JSON.stringify(readingProgress.value))
  }

  const toggleBookmark = (userId, bookId, page) => {
    if (!bookmarks.value[userId]) bookmarks.value[userId] = {}
    if (!bookmarks.value[userId][bookId]) bookmarks.value[userId][bookId] = []
    
    const idx = bookmarks.value[userId][bookId].indexOf(page)
    if (idx === -1) bookmarks.value[userId][bookId].push(page)
    else bookmarks.value[userId][bookId].splice(idx, 1)
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks.value))
  }

  const addReview = (bookId, user, rating, text) => {
    const book = books.value.find(b => b.id === bookId)
    if (book && user) {
      if (!book.reviews) book.reviews = []
      book.reviews.push({ user: user.name, rating, text, date: new Date().toISOString() })
      saveStore()
    }
  }

  return { books, updateStock, readingProgress, bookmarks, saveProgress, toggleBookmark, addReview, saveStore }
})
