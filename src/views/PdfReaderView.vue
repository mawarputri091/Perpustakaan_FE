<script setup>
import { ref, computed, onMounted, shallowRef, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useBookStore } from '../stores/bookStore'
import Icon from '../components/Icon.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const bookStore = useBookStore()

// Cek apakah user memiliki akses penuh (premium, admin, atau GOD)
const hasFullAccess = computed(() => {
  return ['premium', 'admin', 'GOD'].includes(auth.user?.membership)
})

const book = computed(() => bookStore.books.find(b => b.id === parseInt(route.params.id) || b.id === route.params.id))
const pagesContainerRef = ref(null)
const pdfDoc = shallowRef(null)

// State Reader
const pageNum = ref(1)
const scale = ref(1.5) 
const showUpgradeModal = ref(false)
const error = ref('')
const isBookmarked = ref(false)

// Key localStorage dipisah per user supaya riwayat baca & bookmark
// tidak tercampur antar akun di browser yang sama
const bookmarkKey = computed(() => `book_bookmarks_${auth.user?.id || 'guest'}`)
const historyKey = computed(() => `book_history_${auth.user?.id || 'guest'}`)

const checkBookmarkStatus = () => {
  if (!book.value) return
  const savedBookmarks = JSON.parse(localStorage.getItem(bookmarkKey.value) || '[]')
  isBookmarked.value = savedBookmarks.some(b => b.id === book.value.id)
}

onMounted(() => {
  if (!book.value || book.value.type !== 'digital') return router.push('/dashboard')
  
  checkBookmarkStatus()

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    const targetPdfUrl = book.value.pdf_buku || book.value.pdfUrl

    if (!targetPdfUrl) {
      error.value = "URL file PDF tidak ditemukan pada data buku."
      return
    }

    window.pdfjsLib.getDocument(targetPdfUrl).promise.then(pdf => {
      pdfDoc.value = pdf
      renderAllPages()
    }).catch(err => {
      console.error(err)
      error.value = "Gagal memuat file PDF. Pastikan URL valid atau file tersedia."
    })
  }
})

// 🚀 LOGIKA UTAMA: Render semua halaman sekaligus ke bawah
const renderAllPages = async () => {
  if (!pdfDoc.value) return

  // Menggunakan computed property hasFullAccess.value
  const totalPagesToRender = hasFullAccess.value 
    ? pdfDoc.value.numPages 
    : Math.min(pdfDoc.value.numPages, 3)

  await nextTick()
  const container = pagesContainerRef.value
  if (!container) return

  container.innerHTML = ''

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activePage = parseInt(entry.target.dataset.page)
        pageNum.value = activePage

        // Simpan progress otomatis jika memiliki akses penuh (Premium/Admin/GOD)
        if (hasFullAccess.value) {
          bookStore.saveProgress(auth.user?.id, book.value.id, activePage)
        }

        saveReadingHistory(activePage)
      }
    })
  }, {
    root: container.parentNode,
    threshold: 0.3 
  })

  for (let num = 1; num <= totalPagesToRender; num++) {
    try {
      const page = await pdfDoc.value.getPage(num)
      
      const containerWidth = container.clientWidth - 32 
      const unscaledViewport = page.getViewport({ scale: 1 })
      const dynamicScale = containerWidth / unscaledViewport.width
      const viewport = page.getViewport({ scale: dynamicScale })

      const pageWrapper = document.createElement('div')
      pageWrapper.className = 'w-full flex justify-center mb-6 relative page-node'
      pageWrapper.dataset.page = num
      
      const canvas = document.createElement('canvas')
      canvas.className = 'shadow-2xl bg-white max-w-full h-auto transition-transform duration-200'
      canvas.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)'
      
      const ctx = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      pageWrapper.appendChild(canvas)
      container.appendChild(pageWrapper)

      observer.observe(pageWrapper)

      await page.render({ canvasContext: ctx, viewport: viewport }).promise
    } catch (err) {
      console.error(`Gagal merender halaman ${num}:`, err)
    }
  }

  // Tirai pengunci hanya muncul jika dokumen > 3 halaman DAN user TIDAK memiliki akses penuh
  if (pdfDoc.value.numPages > 3 && !hasFullAccess.value) {
    const overlay = document.createElement('div')
    overlay.className = 'w-full bg-slate-950/90 backdrop-blur-md p-10 text-center rounded-2xl border border-slate-800 my-4 shadow-xl flex flex-col items-center justify-center'
    overlay.innerHTML = `
      <div class="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 text-amber-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/></svg>
      </div>
      <h3 class="text-xl font-bold text-white mb-2">Halaman Terkunci</h3>
      <p class="text-slate-400 max-w-md text-sm mb-6">Kamu telah mencapai batas membaca akun Gratis. Upgrade ke Premium untuk membuka seluruh halaman buku, fitur simpan progres, dan unduh PDF.</p>
    `
    const btn = document.createElement('button')
    btn.className = 'px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition shadow-md'
    btn.innerText = 'Upgrade Ke Premium Now'
    btn.onclick = () => router.push('/upgrade')
    
    overlay.appendChild(btn)
    container.appendChild(overlay)
  }
}

const saveReadingHistory = (num) => {
  if (!book.value) return
  let readingHistory = JSON.parse(localStorage.getItem(historyKey.value) || '[]')
  readingHistory = readingHistory.filter(item => item.id !== book.value.id)
  readingHistory.unshift({
    id: book.value.id,
    nama_buku: book.value.nama_buku || book.value.title,
    cover_buku: book.value.foto_buku || book.value.cover,
    penulis: book.value.penulis || book.value.author || 'Penulis Tidak Diketahui',
    terakhir_dibaca: new Date().toISOString(),
    halaman_terakhir: num
  })
  localStorage.setItem(historyKey.value, JSON.stringify(readingHistory))
}

const scrollToPage = (targetPage) => {
  if (!pagesContainerRef.value) return
  const elements = pagesContainerRef.value.querySelectorAll('.page-node')
  const targetEl = Array.from(elements).find(el => parseInt(el.dataset.page) === targetPage)
  if (targetEl) {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const prevPage = () => { if (pageNum.value > 1) scrollToPage(pageNum.value - 1) }
const nextPage = () => { if (pdfDoc.value && pageNum.value < pdfDoc.value.numPages) scrollToPage(pageNum.value + 1) }

const toggleBookmark = () => {
  // Cegah modal upgrade muncul jika user adalah Premium/Admin/GOD
  if (!hasFullAccess.value) return showUpgradeModal.value = true
  if (!book.value) return

  let savedBookmarks = JSON.parse(localStorage.getItem(bookmarkKey.value) || '[]')
  
  if (isBookmarked.value) {
    savedBookmarks = savedBookmarks.filter(b => b.id !== book.value.id)
    isBookmarked.value = false
  } else {
    savedBookmarks.push({
      id: book.value.id,
      nama_buku: book.value.nama_buku || book.value.title,
      cover_buku: book.value.foto_buku || book.value.cover,
      penulis: book.value.penulis || book.value.author || 'Penulis Tidak Diketahui',
      bookmarkedAt: new Date().toISOString()
    })
    isBookmarked.value = true
  }
  
  localStorage.setItem(bookmarkKey.value, JSON.stringify(savedBookmarks))
  bookStore.toggleBookmark(auth.user?.id, book.value.id, pageNum.value)
}

const download = async () => {
  const targetPdfUrl = book.value?.pdf_buku || book.value?.pdfUrl
  if (!targetPdfUrl) return alert("File PDF tidak ditemukan atau URL tidak valid.")
  try {
    const response = await fetch(targetPdfUrl)
    if (!response.ok) throw new Error("Gagal mengambil file")
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${book.value?.nama_buku || 'Buku'}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    window.open(targetPdfUrl, '_blank')
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden" v-if="book">
    
    <div class="h-14 bg-slate-900 text-white flex items-center justify-between px-4 border-b border-slate-800 shrink-0 shadow-lg z-10">
      <div class="flex items-center gap-2">
        <button @click="router.back()" class="p-2 hover:bg-slate-800 rounded-lg transition" title="Kembali">
          <Icon name="chevron-left" />
        </button>
        <span class="font-semibold text-sm md:text-base truncate max-w-[150px] sm:max-w-xs text-slate-200">
          {{ book.nama_buku || book.title }}
        </span>
      </div>
      
      <div class="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700/50">
        <button @click="prevPage" :disabled="pageNum <= 1" class="p-1.5 hover:bg-slate-700 rounded-lg disabled:opacity-30 transition">
          <Icon name="chevron-left" size="16" />
        </button>
        <span class="text-xs font-medium px-2 min-w-[70px] text-center text-slate-300">
          Hal {{ pageNum }} <span v-if="pdfDoc">/ {{ pdfDoc.numPages }}</span>
        </span>
        <button @click="nextPage" :disabled="pdfDoc && pageNum >= pdfDoc.numPages" class="p-1.5 hover:bg-slate-700 rounded-lg disabled:opacity-30 transition">
          <Icon name="chevron-right" size="16" />
        </button>
      </div>
      
      <div class="flex items-center gap-1">
        <button @click="toggleBookmark" class="p-2 hover:bg-slate-800 rounded-lg transition" :class="isBookmarked ? 'text-amber-400' : 'text-slate-400'" title="Simpan Bookmark">
          <Icon name="bookmark" size="18" />
        </button>
        <button @click="download" class="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white" title="Unduh PDF">
          <Icon name="download" size="18" />
        </button>
      </div>
    </div>

    <div class="flex-grow overflow-y-auto bg-slate-900 px-2 py-4 sm:px-6 md:px-12 scroll-container">
      <div v-if="error" class="text-white mt-20 text-center max-w-md mx-auto">
        <p class="text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-sm mb-2">{{ error }}</p>
      </div>
      
      <div ref="pagesContainerRef" class="w-full mx-auto flex flex-col items-center max-w-4xl">
        <div class="text-slate-400 text-sm py-20 flex flex-col items-center gap-3">
          <div class="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          Memilah dokumen & memuat seluruh halaman...
        </div>
      </div>

      <div v-if="showUpgradeModal" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
            <Icon name="crown" size="32" />
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-2">Fitur Premium</h2>
          <p class="text-slate-600 mb-6">Membaca penuh & menyimpan bookmark memerlukan status akun Premium. Upgrade sekarang untuk mendapatkan benefit akses membaca tanpa batas!</p>
          <div class="flex gap-3 justify-center">
            <button @click="showUpgradeModal = false" class="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
            <button @click="router.push('/upgrade')" class="px-5 py-2.5 rounded-xl font-medium text-white bg-teal-600 hover:bg-teal-700 transition">Upgrade Sekarang</button>
          </div>
        </div>
      </div>
      
    </div>

  </div>
</template>

<style scoped>
.scroll-container::-webkit-scrollbar {
  width: 10px;
}
.scroll-container::-webkit-scrollbar-track {
  background: #0f172a;
}
.scroll-container::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 6px;
  border: 2px solid #0f172a;
}
.scroll-container::-webkit-scrollbar-thumb:hover {
  background: #0d9488;
}
</style>