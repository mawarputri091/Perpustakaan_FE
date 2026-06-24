<script setup>
import { ref, computed, onMounted, shallowRef, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useBookStore } from '../stores/bookStore'
import { useGemini } from '../composables/useGemini'
import Icon from '../components/Icon.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const bookStore = useBookStore()

const book = computed(() => bookStore.books.find(b => b.id === parseInt(route.params.id) || b.id === route.params.id))
const pagesContainerRef = ref(null)
const pdfDoc = shallowRef(null)

// AI Chat State
const { generateText, isGenerating: isChatting } = useGemini()
const showAiChat = ref(false)
const chatInput = ref('')
const chatMessages = ref([])
const chatContainer = ref(null)

const initChat = () => {
  if (!book.value) return
  if (chatMessages.value.length === 0) {
    chatMessages.value.push({ role: 'assistant', text: `Halo! Saya adalah ✨ AI Teman Baca. Ada yang ingin kamu tanyakan atau diskusikan dari buku "${book.value.title}"?` })
  }
  showAiChat.value = !showAiChat.value
}

const sendChatMessage = async () => {
  if(!chatInput.value.trim() || !book.value) return
  const userText = chatInput.value
  chatMessages.value.push({ role: 'user', text: userText })
  chatInput.value = ''
  setTimeout(() => { if(chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight }, 50)

  const prompt = `Sebagai AI tutor membaca untuk buku berjudul "${book.value.title}". Pengguna bertanya: "${userText}". Berikan jawaban yang bersahabat, mendidik, dan singkat (maksimal 3-4 kalimat). Gunakan bahasa Indonesia. Gunakan **teks tebal** untuk menekankan kata kunci.`
  const response = await generateText(prompt)
  
  chatMessages.value.push({ role: 'assistant', text: response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') })
  setTimeout(() => { if(chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight }, 50)
}

// State Reader
const pageNum = ref(1)
const scale = ref(1.5) // Diperbesar standarnya agar pas memenuhi layar/full-width
const showUpgradeModal = ref(false)
const error = ref('')
const isBookmarked = ref(false)

const checkBookmarkStatus = () => {
  if (!book.value) return
  const savedBookmarks = JSON.parse(localStorage.getItem('book_bookmarks') || '[]')
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

  // Batasi jumlah render jika user bukan premium (Hanya render sampai halaman 3)
  const totalPagesToRender = auth.user?.membership === 'premium' 
    ? pdfDoc.value.numPages 
    : Math.min(pdfDoc.value.numPages, 3)

  await nextTick()
  const container = pagesContainerRef.value
  if (!container) return

  // Bersihkan container sebelum render
  container.innerHTML = ''

  // Setup IntersectionObserver untuk mendeteksi halaman mana yang sedang aktif saat di-scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activePage = parseInt(entry.target.dataset.page)
        pageNum.value = activePage

        // Simpan progress otomatis jika premium
        if (auth.user?.membership === 'premium') {
          bookStore.saveProgress(auth.user?.id, book.value.id, activePage)
        }

        // Simpan Riwayat Membaca
        saveReadingHistory(activePage)
      }
    })
  }, {
    root: container.parentNode,
    threshold: 0.3 // Halaman dianggap aktif jika 30% areanya terlihat di layar
  })

  // Loop dan render setiap halaman ke canvasnya masing-masing
  for (let num = 1; num <= totalPagesToRender; num++) {
    try {
      const page = await pdfDoc.value.getPage(num)
      
      // Hitung viewport dinamis agar canvas memenuhi lebar container utama (Full-Width)
      const containerWidth = container.clientWidth - 32 // dikurangi padding p-4
      const unscaledViewport = page.getViewport({ scale: 1 })
      const dynamicScale = containerWidth / unscaledViewport.width
      const viewport = page.getViewport({ scale: dynamicScale })

      // Membuat element wrapper untuk styling per halaman buku
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

      // Start observing element ini untuk fitur tracking nomor halaman
      observer.observe(pageWrapper)

      // Render konten PDF ke dalam Canvas
      await page.render({ canvasContext: ctx, viewport: viewport }).promise
    } catch (err) {
      console.error(`Gagal merender halaman ${num}:`, err)
    }
  }

  // Jika user free dan dokumen aslinya lebih dari 3 halaman, tambahkan tirai premium di bawah halaman 3
  if (pdfDoc.value.numPages > 3 && auth.user?.membership !== 'premium') {
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
  let readingHistory = JSON.parse(localStorage.getItem('book_history') || '[]')
  readingHistory = readingHistory.filter(item => item.id !== book.value.id)
  readingHistory.unshift({
    id: book.value.id,
    nama_buku: book.value.nama_buku || book.value.title,
    cover_buku: book.value.foto_buku || book.value.cover,
    penulis: book.value.penulis || book.value.author || 'Penulis Tidak Diketahui',
    terakhir_dibaca: new Date().toISOString(),
    halaman_terakhir: num
  })
  localStorage.setItem('book_history', JSON.stringify(readingHistory))
}

// Fitur scroll otomatis lompat ke halaman tertentu saat klik tombol navigasi topbar
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
  if (auth.user?.membership !== 'premium') return showUpgradeModal.value = true
  if (!book.value) return

  let savedBookmarks = JSON.parse(localStorage.getItem('book_bookmarks') || '[]')
  
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
  
  localStorage.setItem('book_bookmarks', JSON.stringify(savedBookmarks))
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
      
      <button @click="initChat" v-if="!showAiChat" class="fixed bottom-6 right-6 bg-teal-600 text-white px-5 py-3 rounded-full shadow-2xl hover:bg-teal-700 transition z-40 flex items-center gap-2 border border-teal-400/20">
         <span class="text-lg">✨</span> <span class="font-bold text-sm">Tanya AI</span>
      </button>

      <div v-if="showAiChat" class="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-40 animate-in slide-in-from-bottom-5" style="height: 480px; max-height: 75vh;">
         <div class="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white flex justify-between items-center shrink-0">
           <div class="font-bold flex items-center gap-2"><span class="text-xl">✨</span> AI Teman Baca</div>
           <button @click="showAiChat = false" class="hover:text-teal-200 transition text-2xl leading-none">&times;</button>
         </div>
         <div ref="chatContainer" class="flex-grow p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
           <div v-for="(msg, i) in chatMessages" :key="i" :class="msg.role === 'user' ? 'self-end bg-teal-600 text-white rounded-br-none' : 'self-start bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'" class="px-4 py-2.5 rounded-2xl text-sm max-w-[85%] leading-relaxed" v-html="msg.text">
           </div>
           <div v-if="isChatting" class="self-start bg-white border border-slate-200 text-slate-500 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm text-sm italic animate-pulse flex gap-1">
              <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
              <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
           </div>
         </div>
         <div class="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
           <input v-model="chatInput" @keyup.enter="sendChatMessage" placeholder="Tanyakan tentang isi buku..." class="flex-grow px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition">
           <button @click="sendChatMessage" :disabled="isChatting || !chatInput.trim()" class="bg-teal-600 text-white w-9 h-9 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center font-bold">➤</button>
         </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Percantik Scrollbar Panel PDF agar Sinkron Dengan Tema Gelap Slate */
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