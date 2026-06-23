import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_URL = 'http://192.168.1.3:3000'

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
  const localReviews = ref(JSON.parse(localStorage.getItem('local_reviews')) || {})

  // GET: Menarik data dari Database Backend
  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/buku`, { headers: getHeaders() })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const result = await res.json()
      
      const rawData = result.data || result
      
      books.value = rawData.map(b => {
        const rawCover = b.foto_buku || b.cover;
        let imageUrl = 'https://via.placeholder.com/300x400?text=No+Cover'

        if (rawCover) {
          if (rawCover.includes('localhost:3000')) {
            const namaFileSaja = rawCover.split('/').pop();
            imageUrl = `${API_URL}/uploads/${namaFileSaja}`;
          } else if (rawCover.startsWith('http')) {
            imageUrl = rawCover;
          } else {
            imageUrl = `${API_URL}/uploads/${rawCover}`;
          }
        }

        const bookIdString = String(b.id);
        const bookReviews = localReviews.value[bookIdString] || []
        
        const totalRating = bookReviews.reduce((sum, rev) => sum + (Number(rev.rating) || 0), 0)
        const averageRating = bookReviews.length > 0 ? Number((totalRating / bookReviews.length).toFixed(1)) : 0.0

        return {
          id: b.id, 
          title: b.nama_buku || 'Judul Kosong', 
          nama_buku: b.nama_buku || 'Judul Kosong', 
          author: b.penulis || 'Penulis Tidak Diketahui',
          cover: imageUrl,
          category: b.jenis_buku || 'Umum', 
          pdf_buku: b.pdf_buku || null,
          type: (b.pdf_buku && b.pdf_buku !== 'null' && b.pdf_buku !== '') ? 'digital' : 'physical', 
          harga: b.harga_buku ? Number(b.harga_buku) : 0, 
          stock: b.stok !== undefined ? Number(b.stok) : 0,
          stok: b.stok !== undefined ? Number(b.stok) : 0,
          description: b.deskripsi || 'Tidak ada deskripsi.',
          pdfUrl: b.pdf_buku || '',
          rating: averageRating,
          reviews: bookReviews
        }
      })
      
    } catch (e) { 
      console.warn('[API Offline] Gagal memuat GET /buku.', e.message)
    }
  }

  // POST: Menambah buku ke Database
  const createBook = async (bookData) => {
    try {
      const token = localStorage.getItem('api_token');
      const formData = new FormData();
      formData.append('nama_buku', bookData.title);
      formData.append('jenis_buku', bookData.category);
      formData.append('penulis', bookData.author || 'Admin');
      formData.append('deskripsi', bookData.description || '');
      formData.append('stok', Number(bookData.stock) || 0);
      formData.append('harga_buku', Number(bookData.harga) || 0);

      if (bookData.file) {
        formData.append('foto_buku', bookData.file); 
      } else {
        formData.append('foto_buku', bookData.cover || '');
      }

      if (bookData.isDigital && bookData.pdfFile) {
        formData.append('pdf_buku', bookData.pdfFile);
      }

      const res = await fetch(`${API_URL}/buku`, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: formData
      })
      
      if (!res.ok) throw new Error('Gagal tambah buku')
      await fetchBooks()
      return true
    } catch (e) { 
      console.error('[API Error] Gagal POST /buku:', e.message)
      return false
    }
  }

// PUT: Update buku di Database
  const editBook = async (id, bookData) => {
    try {
      const token = localStorage.getItem('api_token');
      const formData = new FormData();
      
      // Kirim data teks utama
      formData.append('nama_buku', bookData.title || '');
      formData.append('jenis_buku', bookData.category || '');
      formData.append('penulis', bookData.author || 'Admin');
      formData.append('deskripsi', bookData.description || '');
      
      // Pastikan stok dikonversi ke Number/Integer agar ORM backend tidak error 500
      formData.append('stok', Number(bookData.stock ?? 0));
      formData.append('harga_buku', Number(bookData.harga || 0));

      // Jika admin mengunggah berkas cover gambar baru
      if (bookData.file) {
        formData.append('foto_buku', bookData.file); 
      }

      // Sesuai dengan payload Vue yang menggunakan nama 'pdfUrl' atau 'pdfFile'
      if (bookData.pdfFile) {
        formData.append('pdf_buku', bookData.pdfFile);
      } else if (bookData.pdfUrl) {
        formData.append('pdf_buku', bookData.pdfUrl);
      }

      const res = await fetch(`${API_URL}/buku/${id}`, {
        method: 'PUT',
        headers: { 
          // JANGAN cantumkan 'Content-Type': 'application/json' di sini 
          // agar browser otomatis menyusun boundary multipart/form-data
          ...(token ? { Authorization: `Bearer ${token}` } : {}) 
        },
        body: formData
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.message || `Server merespon ${res.status}`);
      }

      await fetchBooks();
      return true;
    } catch (e) {
      console.error('[Frontend Error] Terjadi kegagalan di editBook:', e.message);
      return false;
    }
  }

  // DELETE: Hapus buku
  const removeBook = async (id) => {
    try {
      const res = await fetch(`${API_URL}/buku/${id}`, { method: 'DELETE', headers: getHeaders() })
      if (!res.ok) throw new Error('Gagal hapus buku')
      await fetchBooks()
      return true
    } catch (e) { 
      console.error('[API Error] Gagal DELETE /buku:', e.message)
      return false
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

  const addReview = (bookId, username, rating, text) => {
    try {
      const idKey = String(bookId);
      if (!localReviews.value[idKey]) {
        localReviews.value[idKey] = []
      }

      const newReview = {
        id: Date.now(),
        user: username || 'Anonim', 
        rating: Number(rating),
        text: text,
        date: new Date().toLocaleDateString('id-ID')
      }

      localReviews.value[idKey].push(newReview)
      localStorage.setItem('local_reviews', JSON.stringify(localReviews.value))

      const targetBook = books.value.find(b => String(b.id) === idKey)
      if (targetBook) {
        targetBook.reviews = localReviews.value[idKey]
        const totalRating = targetBook.reviews.reduce((sum, rev) => sum + rev.rating, 0)
        targetBook.rating = Number((totalRating / targetBook.reviews.length).toFixed(1))
      }

      return true
    } catch (e) {
      console.error('Gagal ulasan lokal:', e.message)
      return false
    }
  }

  return { books, fetchBooks, createBook, editBook, removeBook, readingProgress, bookmarks, saveProgress, toggleBookmark, updateStock, addReview }
})