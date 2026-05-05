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

const book = computed(() => bookStore.books.find(b => b.id === parseInt(route.params.id)))
const msg = ref('')

const isPending = computed(() => {
  if (!book.value) return false;
  return loanStore.loans.some(l => l.userId === auth.user?.id && l.bookId === book.value.id && l.status === 'pending');
});

const isBorrowedActive = computed(() => {
  if (!book.value) return false;
  return loanStore.loans.some(l => l.userId === auth.user?.id && l.bookId === book.value.id && l.status === 'active');
});

const { generateText, isGenerating } = useGemini()
const aiInsights = ref('')

const fetchInsights = async () => {
  if (!book.value) return;
  aiInsights.value = '';
  const prompt = `Berikan ringkasan singkat, 3 poin penting yang dipelajari, dan alasan kenapa buku "${book.value.title}" karangan ${book.value.author} ini sangat menarik untuk dibaca. Jawab menggunakan bahasa Indonesia, buat paragraf yang natural. Gunakan **teks tebal** untuk poin penting.`;
  const response = await generateText(prompt);
  aiInsights.value = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

const handleAction = () => {
  if (!book.value) return;
  if (book.value.type === 'digital') {
    router.push('/read/' + book.value.id)
  } else {
    const success = loanStore.requestLoan(auth.user?.id, book.value.id)
    if (success) {
      msg.value = 'Permintaan berhasil dikirim. Menunggu persetujuan Admin.'
    } else {
      msg.value = 'Gagal: Stok tidak tersedia atau sedang diajukan.'
    }
    setTimeout(() => msg.value = '', 4000)
  }
}

const downloadPDF = () => {
  if (auth.user?.membership !== 'premium') router.push('/upgrade')
  else alert("Mengunduh PDF...")
}

const reviewText = ref('')
const reviewRating = ref(5)

const submitReview = () => {
  if(reviewText.value.trim() && book.value){
    bookStore.addReview(book.value.id, auth.user, reviewRating.value, reviewText.value)
    reviewText.value = ''
  }
}
</script>

<template>
  <div v-if="book" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="p-6 lg:p-8 flex flex-col md:flex-row gap-8">
      <div class="w-full md:w-1/3 lg:w-1/4 shrink-0">
        <img :src="book.cover" alt="Cover" class="w-full rounded-xl shadow-md border border-slate-100 aspect-[3/4] object-cover">
        
        <div v-if="book.type === 'physical'" class="mt-4 p-4 rounded-xl text-center font-medium border" :class="book.stock > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'">
          {{ book.stock > 0 ? 'Stok Tersedia: ' + book.stock : 'Stok Kosong' }}
        </div>
        
        <div class="flex flex-col gap-2 mt-4">
          <button v-if="book.type === 'digital'" @click="handleAction" class="w-full py-3 px-4 rounded-xl font-bold text-white transition shadow-sm flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700">
            <Icon name="monitor" size="20" /> Baca Online PDF
          </button>

          <template v-else-if="book.type === 'physical'">
            <button v-if="isBorrowedActive" disabled class="w-full py-3 px-4 rounded-xl font-bold text-teal-700 transition shadow-sm flex items-center justify-center gap-2 bg-teal-100 cursor-not-allowed">
              <Icon name="bookmark" size="20" /> Sedang Dipinjam
            </button>
            <button v-else-if="isPending" disabled class="w-full py-3 px-4 rounded-xl font-bold text-amber-700 transition shadow-sm flex items-center justify-center gap-2 bg-amber-100 cursor-not-allowed">
              <Icon name="monitor" size="20" /> Menunggu Persetujuan
            </button>
            <button v-else @click="handleAction" :disabled="book.stock <= 0" 
                    class="w-full py-3 px-4 rounded-xl font-bold text-white transition shadow-sm flex items-center justify-center gap-2"
                    :class="book.stock > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'">
              <Icon name="book" size="20" /> Ajukan Peminjaman
            </button>
          </template>

          <button v-if="book.type === 'digital'" @click="downloadPDF" class="w-full py-3 px-4 rounded-xl font-bold transition shadow-sm border flex items-center justify-center gap-2" :class="auth.user?.membership === 'premium' ? 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50' : 'bg-slate-50 text-slate-400 border-slate-200'">
             <Icon name="download" size="20" />
             {{ auth.user?.membership === 'premium' ? 'Unduh PDF' : 'Unduh (Premium)' }}
          </button>
        </div>
        <div v-if="msg" class="mt-3 text-sm text-center font-medium px-2 py-1.5 rounded" :class="msg.includes('berhasil') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'">{{ msg }}</div>
      </div>
      
      <div class="flex-grow">
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">{{ book.category }}</span>
          <span class="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider" :class="book.type === 'digital' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'">{{ book.type === 'digital' ? 'E-Book' : 'Fisik' }}</span>
        </div>
        <h1 class="text-3xl font-bold text-slate-800 mb-1">{{ book.title }}</h1>
        <p class="text-lg text-slate-500 mb-6">oleh <span class="font-medium text-slate-700">{{ book.author }}</span></p>
        
        <div class="flex items-center gap-1 text-amber-500 mb-6 bg-amber-50 w-max px-3 py-1.5 rounded-lg border border-amber-100">
          <Icon name="star" size="18" />
          <span class="font-bold">{{ book.rating }} / 5.0</span>
          <span class="text-amber-700/60 ml-1">({{ book.reviews?.length || 0 }} Ulasan)</span>
        </div>
        
        <h3 class="text-lg font-bold text-slate-800 mb-2">Sinopsis</h3>
        <p class="text-slate-600 leading-relaxed">{{ book.description }}</p>
        
        <div class="mt-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border border-teal-100 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-teal-800 flex items-center gap-2">✨ AI Book Insights</h3>
            <button @click="fetchInsights" :disabled="isGenerating" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 disabled:opacity-50">
              <span v-if="isGenerating" class="animate-spin text-lg">⏳</span>
              {{ aiInsights ? 'Regenerate' : 'Generate Insights' }}
            </button>
          </div>
          <div v-if="aiInsights" class="text-slate-700 text-sm leading-relaxed" v-html="aiInsights"></div>
          <div v-else-if="isGenerating" class="text-teal-600 text-sm animate-pulse font-medium">✨ Meminta Gemini untuk menganalisis buku ini...</div>
          <div v-else class="text-slate-500 text-sm">Klik tombol di atas untuk mendapatkan ringkasan AI, poin pembelajaran, dan ulasan instan menggunakan teknologi Gemini.</div>
        </div>
      </div>
    </div>

    <!-- Section Ulasan -->
    <div class="border-t border-slate-100 bg-slate-50 p-6 lg:p-8">
      <h3 class="text-xl font-bold text-slate-800 mb-6">Ulasan Pembaca</h3>
      
      <!-- Form Ulasan -->
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

      <!-- List Ulasan -->
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
             <div class="ml-auto text-xs text-slate-400">{{ new Date(rev.date).toLocaleDateString('id-ID') }}</div>
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