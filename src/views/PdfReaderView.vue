<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useBookStore } from '../stores/bookStore'
import { useGemini } from '../composables/useGemini'
import Icon from '../components/Icon.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const bookStore = useBookStore()

const book = computed(() => bookStore.books.find(b => b.id === parseInt(route.params.id)))
const canvasRef = ref(null)
const pdfDoc = ref(null)

// ✨ AI Chat State
const { generateText, isGenerating: isChatting } = useGemini()
const showAiChat = ref(false)
const chatInput = ref('')
const chatMessages = ref([])
const chatContainer = ref(null)

const initChat = () => {
  if (!book.value) return;
  if (chatMessages.value.length === 0) {
    chatMessages.value.push({ role: 'assistant', text: `Halo! Saya adalah ✨ AI Study Buddy. Ada yang ingin kamu tanyakan atau diskusikan dari buku "${book.value.title}"?` });
  }
  showAiChat.value = !showAiChat.value;
}

const sendChatMessage = async () => {
  if(!chatInput.value.trim() || !book.value) return;
  const userText = chatInput.value;
  chatMessages.value.push({ role: 'user', text: userText });
  chatInput.value = '';
  setTimeout(() => { if(chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight; }, 50);

  const prompt = `Sebagai AI tutor membaca untuk buku berjudul "${book.value.title}". Pengguna bertanya: "${userText}". Berikan jawaban yang bersahabat, mendidik, dan singkat (maksimal 3-4 kalimat). Gunakan bahasa Indonesia. Gunakan **teks tebal** untuk menekankan kata kunci.`;
  const response = await generateText(prompt);
  
  chatMessages.value.push({ role: 'assistant', text: response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') });
  setTimeout(() => { if(chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight; }, 50);
}

// State
const pageNum = ref(1)
const scale = ref(1.2)
const isRendering = ref(false)
const showUpgradeModal = ref(false)
const error = ref('')
const bookmarks = computed(() => {
  if (!book.value || !auth.user) return [];
  return bookStore.bookmarks[auth.user.id]?.[book.value.id] || [];
})
const isBookmarked = computed(() => bookmarks.value.includes(pageNum.value))

onMounted(() => {
  if (!book.value || book.value.type !== 'digital') return router.push('/dashboard')
  
  if (auth.user?.membership === 'premium') {
     const savedPage = bookStore.readingProgress[auth.user?.id]?.[book.value.id]
     if (savedPage) pageNum.value = savedPage
  }

  if (window.pdfjsLib) {
    window.pdfjsLib.getDocument(book.value.pdfUrl).promise.then(pdf => {
      pdfDoc.value = pdf;
      renderPage(pageNum.value);
    }).catch(err => {
      error.value = "Gagal memuat file PDF. Mungkin terhalang oleh kebijakan CORS browser.";
    });
  }
})

const renderPage = (num) => {
  if (!pdfDoc.value || isRendering.value || !canvasRef.value) return;
  
  // FREE USER RESTRICTION
  if (num > 3 && auth.user?.membership !== 'premium') {
    showUpgradeModal.value = true;
    pageNum.value = 3; 
    return;
  }

  isRendering.value = true;
  pdfDoc.value.getPage(num).then(page => {
    const viewport = page.getViewport({ scale: scale.value });
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    page.render({ canvasContext: ctx, viewport: viewport }).promise.then(() => {
      isRendering.value = false;
      if (auth.user?.membership === 'premium') bookStore.saveProgress(auth.user?.id, book.value.id, num);
    });
  });
}

const prevPage = () => { if (pageNum.value > 1) { pageNum.value--; renderPage(pageNum.value); } }
const nextPage = () => { if (pageNum.value < pdfDoc.value.numPages) { pageNum.value++; renderPage(pageNum.value); } }
const zoomOut = () => { scale.value -= 0.2; renderPage(pageNum.value); }
const zoomIn = () => { scale.value += 0.2; renderPage(pageNum.value); }

const toggleBookmark = () => {
  if (auth.user?.membership !== 'premium') return showUpgradeModal.value = true;
  bookStore.toggleBookmark(auth.user?.id, book.value.id, pageNum.value);
}

const download = () => {
   if (auth.user?.membership !== 'premium') return showUpgradeModal.value = true;
   alert("Mengunduh PDF...");
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-900 flex flex-col" v-if="book">
    <!-- Toolbar -->
    <div class="h-14 bg-slate-800 text-white flex items-center justify-between px-4 border-b border-slate-700 shrink-0">
      <div class="flex items-center gap-4">
        <button @click="router.back()" class="p-2 hover:bg-slate-700 rounded-lg transition"><Icon name="chevron-left" /></button>
        <span class="font-medium truncate max-w-xs">{{ book.title }}</span>
      </div>
      
      <div class="flex items-center gap-2 bg-slate-700 rounded-lg p-1">
        <button @click="prevPage" :disabled="pageNum <= 1" class="p-1.5 hover:bg-slate-600 rounded disabled:opacity-50 transition"><Icon name="chevron-left" size="18" /></button>
        <span class="text-sm font-medium px-2 w-24 text-center">Hal {{ pageNum }} <span v-if="pdfDoc">/ {{ pdfDoc.numPages }}</span></span>
        <button @click="nextPage" :disabled="pdfDoc && pageNum >= pdfDoc.numPages" class="p-1.5 hover:bg-slate-600 rounded disabled:opacity-50 transition"><Icon name="chevron-right" size="18" /></button>
      </div>
      
      <div class="flex items-center gap-2">
        <button @click="zoomOut" class="p-2 hover:bg-slate-700 rounded-lg transition" title="Perkecil"><Icon name="zoom-out" size="18" /></button>
        <button @click="zoomIn" class="p-2 hover:bg-slate-700 rounded-lg transition" title="Perbesar"><Icon name="zoom-in" size="18" /></button>
        <div class="w-px h-6 bg-slate-600 mx-2"></div>
        <button @click="toggleBookmark" class="p-2 hover:bg-slate-700 rounded-lg transition" :class="isBookmarked ? 'text-amber-400' : 'text-slate-300'" title="Simpan Bookmark"><Icon name="bookmark" size="18" /></button>
        <button @click="download" class="p-2 hover:bg-slate-700 rounded-lg transition text-slate-300" title="Unduh File"><Icon name="download" size="18" /></button>
      </div>
    </div>

    <!-- Reader Area -->
    <div class="flex-grow overflow-auto flex justify-center bg-slate-900 p-6 relative">
      <div v-if="error" class="text-white mt-10 text-center">
        <p class="text-red-400 mb-2">{{ error }}</p>
      </div>
      
      <canvas ref="canvasRef" class="shadow-2xl max-w-full h-auto bg-white" style="box-shadow: 0 0 40px rgba(0,0,0,0.5);"></canvas>

      <!-- Premium Overlay Modal -->
      <div v-if="showUpgradeModal" class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
            <Icon name="crown" size="32" />
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-2">Fitur Premium</h2>
          <p class="text-slate-600 mb-6">Pengguna gratis hanya dapat membaca 3 halaman pertama. Upgrade ke Premium untuk akses penuh, fitur simpan progres, dan unduh PDF!</p>
          <div class="flex gap-3 justify-center">
            <button @click="showUpgradeModal = false" class="px-5 py-2.5 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
            <button @click="router.push('/upgrade')" class="px-5 py-2.5 rounded-lg font-medium text-white bg-teal-600 hover:bg-teal-700 transition">Upgrade Sekarang</button>
          </div>
        </div>
      </div>
      
      <!-- ✨ AI Chat Floating Button -->
      <button @click="initChat" v-if="!showAiChat" class="fixed bottom-6 right-6 bg-teal-600 text-white px-5 py-3 rounded-full shadow-2xl hover:bg-teal-700 transition z-50 flex items-center gap-2 border-2 border-teal-400/30">
         <span class="text-xl">✨</span> <span class="font-bold">Tanya AI</span>
      </button>

      <!-- ✨ AI Chat Panel -->
      <div v-if="showAiChat" class="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50" style="height: 500px; max-height: 80vh;">
         <div class="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white flex justify-between items-center shrink-0">
           <div class="font-bold flex items-center gap-2"><span class="text-xl">✨</span> AI Study Buddy</div>
           <button @click="showAiChat = false" class="hover:text-teal-200 transition text-lg font-bold">&times;</button>
         </div>
         <div ref="chatContainer" class="flex-grow p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
           <div v-for="(msg, i) in chatMessages" :key="i" :class="msg.role === 'user' ? 'self-end bg-teal-600 text-white rounded-br-none' : 'self-start bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'" class="px-4 py-2.5 rounded-2xl text-sm max-w-[85%] leading-relaxed" v-html="msg.text">
           </div>
           <div v-if="isChatting" class="self-start bg-white border border-slate-200 text-slate-500 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm text-sm italic animate-pulse flex gap-1">
              <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
              <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
           </div>
         </div>
         <div class="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
           <input v-model="chatInput" @keyup.enter="sendChatMessage" placeholder="Tanyakan tentang isi buku..." class="flex-grow px-4 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition">
           <button @click="sendChatMessage" :disabled="isChatting || !chatInput.trim()" class="bg-teal-600 text-white w-10 h-10 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center font-bold">➤</button>
         </div>
      </div>
    </div>
  </div>
</template>
