<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useBookStore } from '../stores/bookStore'
import { useLoanStore } from '../stores/loanStore'
import { useGemini } from '../composables/useGemini'
import Icon from '../components/Icon.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const bookStore = useBookStore()
const loanStore = useLoanStore()

const book = computed(() => bookStore.books.find(b => b.id === parseInt(route.params.id) || b.id === route.params.id))
const msg = ref('')

// 🔑 Cek apakah user memiliki akses penuh (premium, admin, atau GOD)
const hasFullAccess = computed(() => {
  return ['premium', 'admin', 'GOD'].includes(auth.user?.membership)
})

// 🛠️ Virtual Type Checker (Mengecek apakah buku digital atau fisik)
const isDigital = computed(() => {
  return book.value && ((book.value.pdf_buku && book.value.pdf_buku !== 'null' && book.value.pdf_buku !== '') || book.value.type === 'digital')
})

const isPending = computed(() => {
  return loanStore.loans.some(
    l =>
      String(l.siswa_id) === String(auth.user?.id) &&
      String(l.buku_id) === String(book.value?.id) &&
      l.status === 'pending'
  )
})

const isBorrowedActive = computed(() => {
  return loanStore.loans.some(
    l =>
      String(l.siswa_id) === String(auth.user?.id) &&
      String(l.buku_id) === String(book.value?.id) &&
      l.status === 'dipinjam'
  )
})

// AI Features
const { generateText, isGenerating } = useGemini()
const aiInsights = ref('')

const fetchInsights = async () => {
  if (!book.value) return
  
  if (isGenerating.value) return

  aiInsights.value = ''
  const title = book.value.nama_buku || book.value.title
  const author = book.value.penulis || book.value.author || 'Penulis Tidak Diketahui'
  const prompt = `Berikan ringkasan singkat, 3 poin penting yang dipelajari, dan alasan kenapa buku "${title}" karangan ${author} ini sangat menarik untuk dibaca. Jawab menggunakan bahasa Indonesia, buat paragraf yang natural. Gunakan **teks tebal** untuk poin penting.`
  const response = await generateText(prompt)
  
  if (response && !response.startsWith('Error:')) {
    aiInsights.value = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
  } else {
    aiInsights.value = response 
  }
}

const handleAction = async () => {
  if (!book.value) return
  
  if (isDigital.value) {
    router.push('/read/' + book.value.id)
  } else {
    const currentStock = book.value.stok !== undefined ? book.value.stok : book.value.stock
    
    if (currentStock <= 0) {
      msg.value = 'Gagal: Stok buku ini sudah habis.'
      setTimeout(() => msg.value = '', 4000)
      return
    }

    if (isPending.value || isBorrowedActive.value) {
      msg.value = 'Gagal: Kamu sedang mengajukan atau meminjam buku ini.'
      setTimeout(() => msg.value = '', 4000)
      return
    }

    const success = await loanStore.requestLoan(auth.user?.id, book.value.id)
    if (success) {
      msg.value = 'Permintaan berhasil dikirim. Menunggu persetujuan Admin.'
    } else {
      msg.value = 'Gagal: Permintaan tidak dapat diproses oleh sistem.'
    }
    setTimeout(() => msg.value = '', 4000)
  }
}

const downloadPDF = async () => {
  // Izinkan premium, admin, atau GOD melewati pembatasan upgrade
  if (!hasFullAccess.value) {
    router.push('/upgrade')
  } else {
    if (book.value?.pdf_buku) {
      try {
        const response = await fetch(book.value.pdf_buku)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const namaFile = book.value.nama_buku || book.value.title || 'Buku'
        link.setAttribute('download', `${namaFile}.pdf`)
        
        document.body.appendChild(link)
        link.click()
        
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error("Gagal mengunduh file secara otomatis:", error)
        window.open(book.value.pdf_buku, '_blank')
      }
    } else {
      alert("File PDF tidak ditemukan.")
    }
  }
}

const reviewText = ref('')
const reviewRating = ref(5)

const submitReview = () => {
  if (reviewText.value.trim() && book.value) {
    const success = bookStore.addReview(
      book.value.id, 
      auth.user?.name || auth.user?.username || 'gratis',
      reviewRating.value, 
      reviewText.value,
      new Date().toISOString()
    )
    
    if (success) {
      reviewText.value = ''
    }
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Baru-baru ini'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return 'Baru-baru ini'
  }
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div v-if="book" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="p-6 lg:p-8 flex flex-col md:flex-row gap-8">
      <div class="w-full md:w-1/3 lg:w-1/4 shrink-0">
        <img :src="book.foto_buku || book.cover" alt="Cover" class="w-full rounded-xl shadow-md border border-slate-100 aspect-[3/4] object-cover bg-slate-200">
        
        <div v-if="!isDigital" class="mt-4 p-4 rounded-xl text-center font-medium border" 
             :class="(book.stok !== undefined ? book.stok : book.stock) > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'">
          {{ (book.stok !== undefined ? book.stok : book.stock) > 0 ? 'Stok Tersedia: ' + (book.stok !== undefined ? book.stok : book.stock) : 'Stok Kosong' }}
        </div>
        
        <div class="flex flex-col gap-2 mt-4">
          <button v-if="isDigital" @click="handleAction" class="w-full py-3 px-4 rounded-xl font-bold text-white transition shadow-sm flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700">
            <Icon name="monitor" size="20" /> Baca Online PDF
          </button>

          <template v-else>
            <button v-if="isBorrowedActive" disabled class="w-full py-3 px-4 rounded-xl font-bold text-teal-700 transition shadow-sm flex items-center justify-center gap-2 bg-teal-100 cursor-not-allowed">
              <Icon name="bookmark" size="20" /> Sedang Dipinjam
            </button>
            <button v-else-if="isPending" disabled class="w-full py-3 px-4 rounded-xl font-bold text-amber-700 transition shadow-sm flex items-center justify-center gap-2 bg-amber-100 cursor-not-allowed">
              <Icon name="monitor" size="20" /> Menunggu Persetujuan
            </button>
            <button v-else @click="handleAction" :disabled="(book.stok !== undefined ? book.stok : book.stock) <= 0" 
                    class="w-full py-3 px-4 rounded-xl font-bold text-white transition shadow-sm flex items-center justify-center gap-2"
                    :class="(book.stok !== undefined ? book.stok : book.stock) > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'">
              <Icon name="book" size="20" /> Ajukan Peminjaman
            </button>
          </template>

          <button 
            v-if="isDigital" 
            @click="downloadPDF" 
            class="w-full py-3 px-4 rounded-xl font-bold transition shadow-sm border flex items-center justify-center gap-2" 
            :class="hasFullAccess 
              ? 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50 cursor-pointer' 
              : 'bg-slate-50 text-slate-400 border-slate-200'"
          >
             <Icon name="download" size="20" />
             {{ hasFullAccess ? 'Unduh PDF' : 'Unduh (Premium)' }}
          </button>
        </div>
        <div v-if="msg" class="mt-3 text-sm text-center font-medium px-2 py-1.5 rounded" :class="msg.includes('berhasil') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'">{{ msg }}</div>
      </div>
      
      <div class="flex-grow">
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">{{ book.jenis_buku || book.category }}</span>
          <span class="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider" :class="isDigital ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'">{{ isDigital ? 'E-Book' : 'Fisik' }}</span>
        </div>
        <h1 class="text-3xl font-bold text-slate-800 mb-1">{{ book.nama_buku || book.title }}</h1>
        <p class="text-lg text-slate-500 mb-6">oleh <span class="font-medium text-slate-700">{{ book.penulis || book.author || 'Penulis Tidak Diketahui' }}</span></p>
        
        <div class="flex items-center gap-1 text-amber-500 mb-6 bg-amber-50 w-max px-3 py-1.5 rounded-lg border border-amber-100">
          <Icon name="star" size="18" />
          <span class="font-bold">{{ book.rating || '0.0' }} / 5.0</span>
          <span class="text-amber-700/60 ml-1">({{ book.reviews?.length || 0 }} Ulasan)</span>
        </div>
        
        <h3 class="text-lg font-bold text-slate-800 mb-2">Sinopsis</h3>
        <p class="text-slate-600 leading-relaxed">{{ book.deskripsi || book.description || 'Tidak ada deskripsi.' }}</p>
        
        <div class="mt-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border border-teal-100 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-teal-800 flex items-center gap-2">✨ AI Teman Baca</h3>
            <button @click="fetchInsights" :disabled="isGenerating" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 disabled:opacity-50">
              <span v-if="isGenerating" class="animate-spin text-lg">⏳</span>
              {{ aiInsights ? 'Regenerate' : 'Generate Insights' }}
            </button>
          </div>
          <div v-if="aiInsights" class="text-slate-700 text-sm leading-relaxed" v-html="aiInsights"></div>
          <div v-else-if="isGenerating" class="text-teal-600 text-sm animate-pulse font-medium">✨ Meminta AI Teman Baca untuk menganalisis buku ini...</div>
          <div v-else class="text-slate-500 text-sm">Klik tombol di atas untuk mendapatkan ringkasan AI, poin pembelajaran, dan ulasan instan.</div>
        </div>
      </div>
    </div>

    <div class="border-t border-slate-100 bg-slate-50 p-6 lg:p-8">
      <h3 class="text-xl font-bold text-slate-800 mb-6">Ulasan Pembaca</h3>
      
      <div v-if="auth.user?.role === 'user'" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-8">
         <h4 class="font-bold text-slate-700 mb-3">Tulis ulasan Anda</h4>
         <textarea v-model="reviewText" rows="3" class="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none mb-3" placeholder="Bagaimana pendapat Anda tentang buku ini?"></textarea>
         <div class="flex justify-between items-center">
           <select v-model="reviewRating" class="border border-slate-300 rounded-lg p-2 text-sm bg-white outline-none">
              <option :value="5">⭐⭐⭐⭐⭐ (5/5 Sangat Bagus)</option>
              <option :value="4">⭐⭐⭐⭐ (4/5 Bagus)</option>
              <option :value="3">⭐⭐⭐ (3/5 Cukup)</option>
              <option :value="2">⭐⭐ (2/5 Kurang)</option>
              <option :value="1">⭐ (1/5 Buruk)</option>
           </select>
           <button @click="submitReview" :disabled="!reviewText" class="bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 disabled:opacity-50 transition">Kirim Ulasan</button>
         </div>
      </div>

      <div class="space-y-4">
        <div v-for="(rev, idx) in book.reviews" :key="idx" class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div class="flex items-center gap-2 mb-2">
             <div class="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm uppercase">{{ rev.user.charAt(0) }}</div>
             <div>
               <div class="font-bold text-slate-800 text-sm">{{ rev.user }}</div>
               <div class="flex text-amber-400 text-xs">
                  <span v-for="n in 5" :key="n" :class="n <= rev.rating ? 'text-amber-400' : 'text-slate-200'">★</span>
               </div>
             </div>
            <div class="ml-auto text-xs text-slate-400 font-medium">{{ formatDate(rev.created_at || rev.createdAt || rev.date) }}</div>
           </div>
           <p class="text-slate-600 text-sm pl-10">{{ rev.text }}</p>
        </div>
        <div v-if="!book.reviews || book.reviews.length === 0" class="text-slate-500 text-center py-6 text-sm">
           Belum ada ulasan untuk buku ini. Jadilah yang pertama!
        </div>
      </div>
    </div>
  </div>
</template>