import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mockBooks } from '../data/mockData'

const API_URL = 'http://172.19.136.62:3000'

const getHeaders = () => {
  const token = localStorage.getItem('api_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const useBookStore = defineStore('book', () => {
  const books = ref([])
  const bookmarks = ref(JSON.parse(localStorage.getItem('bookmarks')) || {})
  const readingProgress = ref(JSON.parse(localStorage.getItem('progress')) || {})

 const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/buku`, { headers: getHeaders() })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const result = await res.json()
      
      // Ambil array datanya dari response backend
      const rawData = result.data || result
      
      // MAPPING DATA: Menyesuaikan nama kolom Database dengan yang dibaca Frontend
      books.value = rawData.map(b => {
        // Logika untuk menampilkan gambar (Menggabungkan IP Backend dengan Path Gambar)
        let imageUrl = 'https://via.placeholder.com/300x400?text=No+Cover'
        if (b.foto_buku) {
          // Jika backend mengembalikan link lengkap (http...), pakai langsung. 
          // Jika tidak, gabungkan dengan API_URL Anda.
          imageUrl = b.foto_buku.startsWith('http') ? b.foto_buku : `${API_URL}/${b.foto_buku}`
        }

        return {
          id: b.id, 
          // Ambil dari "nama_buku" sesuai Postman
          title: b.nama_buku || 'Judul Kosong', 
          author: b.penulis || 'Penulis Tidak Diketahui', // Ganti 'penulis' jika di DB namanya lain
          cover: imageUrl,
          // Ambil dari "jenis_buku" sesuai Postman
          category: b.jenis_buku || 'Umum', 
          type: 'physical', // Set default buku fisik karena ada data "stok" di DB
          // Ambil dari "stok" sesuai Postman
          stock: b.stok || 0, 
          description: b.deskripsi || 'Tidak ada deskripsi.', // Ganti 'deskripsi' jika di DB namanya lain
          pdfUrl: '',
          rating: 0,
          reviews: []
        }
      })
      
    } catch (e) { 
      console.warn('[API Offline] Gagal memuat GET /buku.', e.message)
      // Kalau API mati, fallback ke mockBooks
      // books.value = JSON.parse(JSON.stringify(mockBooks)) 
    }
  }
  
  const createBook = async (bookData) => {
    try {
      const res = await fetch(`${API_URL}/buku`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bookData)
      })
      if (!res.ok) throw new Error('Gagal tambah buku')
      await fetchBooks()
      return true
    } catch (e) { 
      console.warn('[API Offline] Gagal POST /buku. Menyimpan ke state lokal.')
      bookData.id = Date.now()
      books.value.push(bookData)
      return true
    }
  }

  const editBook = async (id, bookData) => {
    try {
      const res = await fetch(`${API_URL}/buku/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(bookData)
      })
      if (!res.ok) throw new Error('Gagal edit buku')
      await fetchBooks()
      return true
    } catch (e) { 
      console.warn('[API Offline] Gagal PUT /buku/:id. Mengedit di state lokal.')
      const idx = books.value.findIndex(b => b.id === id)
      if (idx !== -1) books.value[idx] = { ...books.value[idx], ...bookData }
      return true
    }
  }

  const removeBook = async (id) => {
    try {
      const res = await fetch(`${API_URL}/buku/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      })
      if (!res.ok) throw new Error('Gagal hapus buku')
      await fetchBooks()
      return true
    } catch (e) { 
      console.warn('[API Offline] Gagal DELETE /buku/:id. Menghapus dari state lokal.')
      books.value = books.value.filter(b => b.id !== id)
      return true
    }
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

  const updateStock = (bookId, change) => {
    const b = books.value.find(b => b.id === bookId)
    if (b && b.type === 'physical') { b.stock += change; }
  }

  const addReview = (bookId, user, rating, text) => {
    const book = books.value.find(b => b.id === bookId)
    if (book && user) {
      if (!book.reviews) book.reviews = []
      book.reviews.push({ user: user.name, rating, text, date: new Date().toISOString() })
    }
  }

  return { books, fetchBooks, createBook, editBook, removeBook, readingProgress, bookmarks, saveProgress, toggleBookmark, updateStock, addReview }
})
