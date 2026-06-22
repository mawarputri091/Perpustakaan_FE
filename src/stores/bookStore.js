import { defineStore } from 'pinia'
import { ref } from 'vue'

// Sesuaikan IP Backend Anda
const API_URL = 'http://192.168.1.11:3000'

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

  // GET: Menarik data dari Database
  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/buku`, { headers: getHeaders() })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const result = await res.json()
      
      const rawData = result.data || result
      
      // Mapping dari Database Backend ke Frontend Vue
books.value = rawData.map(b => {
  // Ganti baris pengecekan namaFile lama kamu dengan logika pembersihan ini:
const rawCover = b.foto_buku || b.cover;
let imageUrl = 'https://via.placeholder.com/300x400?text=No+Cover'

if (rawCover) {
  // 🌟 JIKA DATABASE TERLANJUR BERISI 'localhost:3000', KITA POTONG DAN AMBIL NAMA FILE-NYA SAJA
  if (rawCover.includes('localhost:3000')) {
    const namaFileSaja = rawCover.split('/').pop(); // Mengambil nama file paling belakang
    imageUrl = `${API_URL}/uploads/${namaFileSaja}`;
  } 
  // Jika dari DB sudah berupa URL IP yang benar
  else if (rawCover.startsWith('http')) {
    imageUrl = rawCover;
  } 
  // Jika hanya nama file saja
  else {
    imageUrl = `${API_URL}/uploads/${rawCover}`;
  }
}

  return {
    id: b.id, 
    title: b.nama_buku || 'Judul Kosong', // Menggunakan nama_buku sesuai JSON Postman
    author: b.penulis || 'Penulis Tidak Diketahui',
    cover: imageUrl,
    category: b.jenis_buku || 'Umum', 
    type: 'physical', 
    
    // 📝 PERBAIKAN PEMETAAN DI SINI:
    // Gunakan parseFloat atau Number karena di Postman harganya berupa string "1000.00"
    harga: b.harga_buku ? Number(b.harga_buku) : 0, 
    stock: b.stok !== undefined ? Number(b.stok) : 0,
    
    description: b.deskripsi || 'Tidak ada deskripsi.',
    pdfUrl: '',
    rating: 0,
    reviews: []
  }
})
      
    } catch (e) { 
      console.warn('[API Offline] Gagal memuat GET /buku.', e.message)
    }
  }

// POST: Menambah buku ke Database (Mendukung Upload File Gambar)
  const createBook = async (bookData) => {
    try {
      const token = localStorage.getItem('api_token');
      
      // Menggunakan FormData agar file gambar bisa terkirim ke BE
      const formData = new FormData();
      formData.append('nama_buku', bookData.title);
      formData.append('jenis_buku', bookData.category);
      formData.append('penulis', bookData.author || 'Admin');
      formData.append('deskripsi', bookData.description || '');
      formData.append('stok', Number(bookData.stock));
      formData.append('harga_buku', Number(bookData.harga) || 0);

      // Jika user mengupload gambar baru, masukkan filenya
      if (bookData.file) {
        formData.append('foto_buku', bookData.file); // Menyesuaikan nama kolom upload file di BE
      } else {
        formData.append('foto_buku', bookData.cover || '');
      }

      const res = await fetch(`${API_URL}/buku`, {
        method: 'POST',
        headers: {
          // JANGAN gunakan 'Content-Type': 'application/json' jika mengirim FormData
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData // Kirim sebagai formData
      })
      
      if (!res.ok) throw new Error('Gagal tambah buku ke API')
      
      await fetchBooks() // Refresh katalog
      return true
    } catch (e) { 
      console.error('[API Error] Gagal POST /buku:', e.message)
      return false
    }
  }

const editBook = async (id, bookData) => {
  try {
    const token = localStorage.getItem('api_token');
    const formData = new FormData();
    
    // Sesuaikan mapping key dengan req.body yang dibaca di buku.service.js
    formData.append('nama_buku', bookData.title || bookData.nama_buku);
    formData.append('jenis_buku', bookData.category || bookData.jenis_buku);
    formData.append('stok', String(bookData.stock ?? bookData.stok ?? 0));
    formData.append('harga_buku', String(bookData.harga || bookData.harga_buku || 0));

    if (bookData.file) {
      formData.append('foto_buku', bookData.file);
    } else if (bookData.cover || bookData.foto_buku) {
      const currentCover = bookData.cover || bookData.foto_buku;
      const namaFileLama = currentCover.includes('/') ? currentCover.split('/').pop() : currentCover;
      formData.append('foto_buku', namaFileLama);
    }

    const res = await fetch(`${API_URL}/buku/${id}`, {
      method: 'PUT',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Gagal menyimpan');
    
    await fetchBooks();
    return true;
  } catch (e) {
    console.error('[Frontend Error]', e.message);
    alert(`Gagal Update: ${e.message}`); // Biar memunculkan alert pesan asli dari BE (seperti INVALID_TOKEN)
    return false;
  }
}

  // DELETE: Menghapus buku dari Database
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
      console.error('[API Error] Gagal DELETE /buku:', e.message)
      return false
    }
  }

  // --- Fungsi Tambahan ---
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