<<<<<<< Updated upstream
<script setup>
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
=======
  <script setup>
  import { ref, reactive } from 'vue'
  import { useAuthStore } from '../stores/authStore'
  import { useRouter } from 'vue-router'
  import Swal from 'sweetalert2' // Import SweetAlert2
>>>>>>> Stashed changes

  const auth = useAuthStore()
  const router = useRouter()

<<<<<<< Updated upstream
const upgrade = () => {
  auth.upgradeMembership()
  alert('Berhasil! Anda sekarang adalah Member Premium.')
  router.push('/dashboard')
=======
  // State interaktif modal & loading gimmick
  const showPaymentModal = ref(false)
  const isProcessing = ref(false)
  const selectedPlan = ref(null)

  // Data 3 Pilihan Paket Premium (Disesuaikan dengan fitur asli aplikasi)
  const plans = [
    {
      id: '1_month',
      name: 'Premium Bulanan',
      duration: '1 Bulan',
      price: 49000,
      originalPrice: 49000,
      features: [
        'Akses Penuh Baca Seluruh Isi Buku',
        'Unduh File E-Book Format PDF',
        'Membaca Tanpa Batas Halaman',
        'Respons UI Premium Akses Cepat'
      ],
      isPopular: false
    },
    {
      id: '5_months',
      name: 'Premium Hemat',
      duration: '5 Bulan',
      price: 199000,
      originalPrice: 245000,
      features: [
        'Akses Penuh Baca Seluruh Isi Buku',
        'Unduh File E-Book Format PDF',
        'Masa Aktif Lebih Panjang (5 Bulan)',
        'Potongan Harga Paket Hingga 20%'
      ],
      isPopular: false
    },
    {
      id: '1_year',
      name: 'Premium Setahun',
      duration: '1 Tahun',
      price: 399000,
      originalPrice: 588000,
      features: [
        'Akses Penuh Baca Seluruh Isi Buku',
        'Unduh File E-Book Format PDF',
        'Masa Aktif Maksimal (12 Bulan)',
        'Hemat Hingga 32% (Paling Murah)',
        'Prioritas Dukungan Sistem VIP'
      ],
      isPopular: true
    }
  ]

  // Form data diri gimmick pembeli
  const formData = reactive({
    fullName: '',
    phone: '',
    paymentMethod: 'DANA',
    paymentProof: null
  })

  // Memicu modal form dibuka saat memilih paket
  const handleUpgradeClick = (plan) => {
    selectedPlan.value = plan
    formData.fullName = ''
    formData.phone = ''
    formData.paymentProof = null
    showPaymentModal.value = true
  }

  // Handler file upload bukti transfer gimmick
  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
      formData.paymentProof = event.target.files[0].name
    }
  }

// Proses submit data diri & eksekusi upgrade dengan API Backend Terpusat via authStore
const processPayment = async () => {
  if (!formData.fullName.trim() || !formData.phone.trim()) {
    Swal.fire({
      title: 'Data Belum Lengkap',
      text: 'Silakan isi nama lengkap dan nomor telepon Anda!',
      icon: 'warning',
      background: '#ffffff',
      color: '#333333',
      confirmButtonColor: '#10b981',
      customClass: { popup: 'rounded-xl' }
    })
    return
  }

  isProcessing.value = true

  try {
    // 1. Ambil ID user aktif dari Pinia Auth Store
    const userId = auth.user?.id

    if (!userId) {
      throw new Error('Sesi Anda telah berakhir. Silakan login ulang kembali.')
    }

    // 2. Hubungkan ke fungsi terpusat di authStore (Menggunakan API_URL dinamis)
    const result = await auth.upgradeMembership({
      userId: userId,
      plan_id: selectedPlan.value.id,
      fullName: formData.fullName,
      phone: formData.phone
    })

    // 3. Validasi hasil kembalian dari authStore
    if (!result.success) {
      throw new Error(result.message || 'Gagal memproses upgrade pada sistem database.')
    }

    // 4. UPDATE STATE SISI FRONTEND (SINKRONISASI INSTAN)
    if (auth.user) {
      auth.user.role = 'premium'
      auth.user.membership = 'premium' 
    }

    isProcessing.value = false
    showPaymentModal.value = false
    
    // Popup sukses dengan Fitur Auto Close (Timer)
    Swal.fire({
      title: 'Selamat, kk!',
      html: `Pendaftaran paket <span class="text-teal-600 font-bold">${selectedPlan.value.name}</span> berhasil diverifikasi.<br><span class="text-gray-600">Akun Anda kini menjadi Premium.</span>`,
      icon: 'success',
      iconColor: '#10b981',        
      background: '#ffffff',       
      color: '#2d3748',            
      confirmButtonText: 'OK',     
      confirmButtonColor: '#10b981',
      timer: 3000,                  
      timerProgressBar: true,       
      customClass: {
        popup: 'rounded-xl shadow-2xl p-6',
        title: 'text-2xl font-bold text-gray-800'
      }
    }).then(() => {
      // Pindah ke dashboard setelah user klik OK atau timer habis
      router.push('/dashboard')
    })

  } catch (error) {
    isProcessing.value = false
    
    // Alert jika terjadi kegagalan koneksi API atau token kedaluwarsa
    Swal.fire({
      title: 'Upgrade Gagal',
      text: error.message || 'Terjadi kesalahan sistem saat menghubungi server.',
      icon: 'error',
      confirmButtonColor: '#ef4444'
    })
  }
>>>>>>> Stashed changes
}
  </script>

<<<<<<< Updated upstream
<template>
  <div class="max-w-4xl mx-auto py-8 text-center">
    <h1 class="text-4xl font-extrabold text-slate-800 mb-10">Tingkatkan Pengalaman Membacamu</h1>
    <div class="bg-teal-600 p-8 rounded-2xl text-white max-w-md mx-auto">
      <h3 class="text-xl font-bold mb-2">Member Premium</h3>
      <div class="text-3xl font-bold mb-6">Rp 49.000 / bulan</div>
      <button v-if="auth.user?.membership !== 'premium'" @click="upgrade" class="w-full bg-white text-teal-700 font-bold py-3 rounded-xl">Upgrade Sekarang</button>
      <button v-else disabled class="w-full py-3 bg-teal-800 text-teal-200 rounded-xl font-bold">Anda sudah Premium!</button>
    </div>
  </div>
</template>
=======
  <template>
    <div class="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto text-center mb-12">
        <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Tingkatkan Pengalaman Membacamu
        </h1>
        <p class="text-lg text-slate-600">
          Pilih durasi paket member premium yang sesuai dengan kebutuhan membaca Anda.
        </p>
      </div>

      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-6">
        <div 
          v-for="plan in plans" 
          :key="plan.id"
          class="bg-white rounded-3xl p-8 border transition-all duration-300 flex flex-col relative"
          :class="plan.isPopular ? 'border-teal-500 shadow-xl ring-2 ring-teal-500/20 md:-translate-y-4' : 'border-slate-200 shadow-sm hover:shadow-md'"
        >
          <span v-if="plan.isPopular" class="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
            Best Value
          </span>

          <div class="mb-6">
            <h3 class="text-xl font-bold text-slate-800 mb-1">{{ plan.name }}</h3>
            <p class="text-xs text-slate-500">Masa aktif akun {{ plan.duration }}</p>
          </div>

          <div class="mb-6 flex flex-col">
            <span v-if="plan.originalPrice !== plan.price" class="text-xs text-red-500 line-through font-medium">
              Rp {{ plan.originalPrice.toLocaleString('id-ID') }}
            </span>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-extrabold text-slate-900">Rp {{ plan.price.toLocaleString('id-ID') }}</span>
              <span class="text-slate-500 text-xs">/{{ plan.id === '1_year' ? 'thn' : 'pkt' }}</span>
            </div>
          </div>

          <ul class="space-y-3 mb-8 flex-1">
            <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2.5 text-sm text-slate-600">
              <svg class="w-4 h-4 text-teal-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ feature }}</span>
            </li>
          </ul>

          <button 
            v-if="auth.user?.membership !== 'premium' && auth.user?.membership !== 'GOD'"
            @click="handleUpgradeClick(plan)"
            class="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm"
            :class="plan.isPopular ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/10' : 'bg-teal-50 hover:bg-teal-100 text-teal-700'"
          >
            Upgrade Sekarang
          </button>
          <button 
            v-else 
            disabled 
            class="w-full py-3 bg-slate-200 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed"
          >
            Anda sudah Premium!
          </button>
        </div>
      </div>

      <div v-if="showPaymentModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
          
          <div class="bg-slate-900 text-white p-5">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-sm font-bold">Formulir Data Diri & Pembayaran</h3>
                <p class="text-xs text-slate-400">Pendaftaran akun: {{ selectedPlan?.name }}</p>
              </div>
              <button type="button" @click="showPaymentModal = false" class="text-slate-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form @submit.prevent="processPayment" class="p-5 space-y-4">
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
              <table class="w-full">
                <tbody>
                  <tr class="border-b border-slate-200/60">
                    <td class="py-1 text-slate-500">Masa Aktif</td>
                    <td class="py-1 text-right font-semibold text-slate-800">{{ selectedPlan?.duration }}</td>
                  </tr>
                  <tr>
                    <td class="py-1 text-slate-500">Total Pembayaran</td>
                    <td class="py-1 text-right font-bold text-teal-600 text-sm">Rp {{ selectedPlan?.price.toLocaleString('id-ID') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Pemohon</label>
              <input v-model="formData.fullName" type="text" placeholder="Masukkan nama lengkap..." required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input v-model="formData.phone" type="tel" placeholder="08xxxxxxxxxx" required class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran</label>
              <select v-model="formData.paymentMethod" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-teal-500">
                <option value="DANA">DANA</option>
                <option value="GoPay">GoPay</option>
                <option value="Mandiri">Transfer Bank Mandiri</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Upload Bukti Pembayaran</label>
              <div class="border-2 border-slate-300 border-dashed rounded-lg p-4 text-center bg-slate-50 cursor-pointer hover:border-teal-500 relative">
                <input type="file" accept="image/*" @change="handleFileChange" class="absolute inset-0 opacity-0 cursor-pointer">
                <p class="text-xs text-slate-500 font-medium">Klik untuk pilih berkas gambar bukti transfer</p>
                <p v-if="formData.paymentProof" class="text-xs text-emerald-600 font-bold mt-1">Terpilih: {{ formData.paymentProof }}</p>
              </div>
            </div>

            <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" @click="showPaymentModal = false" :disabled="isProcessing" class="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
              <button type="submit" :disabled="isProcessing" class="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1.5 shadow-sm">
                <svg v-if="isProcessing" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isProcessing ? 'Memverifikasi Data...' : 'Kirim Pembayaran' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
>>>>>>> Stashed changes
