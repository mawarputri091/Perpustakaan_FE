<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore' // 🌟 Impor authStore

const router = useRouter()
const authStore = useAuthStore() // 🌟 Inisialisasi store

// State Form Register
const name = ref('')
const username = ref('')
const email = ref('')
const phone = ref('') // 🌟 Tambahkan state baru untuk nomor telepon
const password = ref('')
const confirmPassword = ref('')

// State UI
const error = ref('')
const isLoading = ref(false)
const showSuccess = ref(false)

// 🌟 Validasi real-time seperti website asli.
// Error baru muncul setelah field pernah disentuh (blur), supaya form tidak
// langsung merah semua saat pertama dibuka.
const touched = ref({
  name: false,
  email: false,
  phone: false,
  username: false,
  password: false,
  confirmPassword: false
})

const markTouched = (field) => {
  touched.value[field] = true
}

// Aturan: Nama lengkap minimal 8 karakter, boleh pakai simbol apapun
const nameError = computed(() => {
  if (!name.value) return 'Nama lengkap wajib diisi.'
  if (name.value.trim().length < 8) return 'Nama lengkap minimal 8 karakter.'
  return ''
})

const emailError = computed(() => {
  if (!email.value) return 'Alamat email wajib diisi.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return 'Format email tidak valid. Contoh: nama@email.com'
  return ''
})

const phoneError = computed(() => {
  if (!phone.value) return 'Nomor telepon wajib diisi.'
  if (!/^08\d{8,11}$/.test(phone.value)) return 'Nomor harus diawali 08 dan terdiri dari 10–13 digit angka.'
  return ''
})

const usernameError = computed(() => {
  if (!username.value) return 'Username wajib diisi.'
  if (username.value.length < 5) return 'Username minimal 5 karakter.'
  if (!/^[a-zA-Z0-9._]+$/.test(username.value)) return 'Username hanya boleh huruf, angka, titik, dan underscore (tanpa spasi).'
  return ''
})

const passwordError = computed(() => {
  if (!password.value) return 'Password wajib diisi.'
  if (password.value.length < 8) return 'Password minimal 8 karakter.'
  return ''
})

const confirmPasswordError = computed(() => {
  if (!confirmPassword.value) return 'Konfirmasi password wajib diisi.'
  if (confirmPassword.value !== password.value) return 'Konfirmasi password tidak cocok.'
  return ''
})

const isFormValid = computed(() =>
  !nameError.value &&
  !emailError.value &&
  !phoneError.value &&
  !usernameError.value &&
  !passwordError.value &&
  !confirmPasswordError.value
)

const goToLogin = () => {
  showSuccess.value = false
  router.push('/login')
}

const doRegister = async () => {
  error.value = ''

  // Tandai semua field sebagai tersentuh supaya semua error tampil saat submit
  Object.keys(touched.value).forEach((key) => { touched.value[key] = true })

  if (!isFormValid.value) {
    error.value = 'Periksa kembali data Anda, masih ada isian yang belum valid.'
    return
  }

  isLoading.value = true

  // 🌟 Panggil fungsi registrasi terpusat dari authStore
  const result = await authStore.register({
    name: name.value,
    username: username.value,
    email: email.value,
    phone: phone.value,
    password: password.value
  })

  isLoading.value = false

  if (result.success) {
    showSuccess.value = true
  } else {
    error.value = result.message
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
      
      <div class="text-center mb-6">
        <div class="w-12 h-12 bg-teal-500 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-800">Daftar Akun</h1>
        <p class="text-sm text-slate-500 mt-1">Buat akun baru untuk menikmati fasilitas EduLibrary</p>
      </div>

      <form @submit.prevent="doRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
          <input
            v-model="name"
            type="text"
            @blur="markTouched('name')"
            :class="[
              'w-full px-4 py-2 rounded-lg border outline-none transition text-sm focus:ring-2',
              touched.name && nameError
                ? 'border-red-400 focus:ring-red-400 bg-red-50/50'
                : 'border-slate-300 focus:ring-teal-500'
            ]"
            placeholder="Minimal 8 karakter, boleh pakai simbol..."
            required
          >
          <p v-if="touched.name && nameError" class="text-red-600 text-xs mt-1">{{ nameError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Alamat Email</label>
          <input
            v-model="email"
            type="email"
            @blur="markTouched('email')"
            :class="[
              'w-full px-4 py-2 rounded-lg border outline-none transition text-sm focus:ring-2',
              touched.email && emailError
                ? 'border-red-400 focus:ring-red-400 bg-red-50/50'
                : 'border-slate-300 focus:ring-teal-500'
            ]"
            placeholder="contoh@email.com"
            required
          >
          <p v-if="touched.email && emailError" class="text-red-600 text-xs mt-1">{{ emailError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp / Telp</label>
          <input
            v-model="phone"
            type="text"
            @blur="markTouched('phone')"
            :class="[
              'w-full px-4 py-2 rounded-lg border outline-none transition text-sm focus:ring-2',
              touched.phone && phoneError
                ? 'border-red-400 focus:ring-red-400 bg-red-50/50'
                : 'border-slate-300 focus:ring-teal-500'
            ]"
            placeholder="Contoh: 0873636363"
            required
          >
          <p v-if="touched.phone && phoneError" class="text-red-600 text-xs mt-1">{{ phoneError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
          <input
            v-model="username"
            type="text"
            @blur="markTouched('username')"
            :class="[
              'w-full px-4 py-2 rounded-lg border outline-none transition text-sm focus:ring-2',
              touched.username && usernameError
                ? 'border-red-400 focus:ring-red-400 bg-red-50/50'
                : 'border-slate-300 focus:ring-teal-500'
            ]"
            placeholder="Buat nama pengguna unik..."
            required
          >
          <p v-if="touched.username && usernameError" class="text-red-600 text-xs mt-1">{{ usernameError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            @blur="markTouched('password')"
            :class="[
              'w-full px-4 py-2 rounded-lg border outline-none transition text-sm focus:ring-2',
              touched.password && passwordError
                ? 'border-red-400 focus:ring-red-400 bg-red-50/50'
                : 'border-slate-300 focus:ring-teal-500'
            ]"
            placeholder="Minimal 8 karakter"
            required
          >
          <p v-if="touched.password && passwordError" class="text-red-600 text-xs mt-1">{{ passwordError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            @blur="markTouched('confirmPassword')"
            :class="[
              'w-full px-4 py-2 rounded-lg border outline-none transition text-sm focus:ring-2',
              touched.confirmPassword && confirmPasswordError
                ? 'border-red-400 focus:ring-red-400 bg-red-50/50'
                : 'border-slate-300 focus:ring-teal-500'
            ]"
            placeholder="••••••••"
            required
          >
          <p v-if="touched.confirmPassword && confirmPasswordError" class="text-red-600 text-xs mt-1">{{ confirmPasswordError }}</p>
        </div>

        <div v-if="error" class="text-red-600 text-xs font-medium text-center bg-red-50 p-2.5 rounded-lg border border-red-100">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoading" 
          class="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition shadow-md shadow-teal-600/20 disabled:opacity-70 flex justify-center items-center gap-2 text-sm"
        >
          <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isLoading ? 'MENDAFTARKAN...' : 'DAFTAR SEKARANG' }}</span>
        </button>
      </form>

      <div class="relative flex py-4 items-center">
        <div class="flex-grow border-t border-slate-200"></div>
        <span class="flex-shrink mx-4 text-slate-400 text-xs">Sudah punya akun?</span>
        <div class="flex-grow border-t border-slate-200"></div>
      </div>

      <div class="text-center text-sm">
        <router-link to="/login" class="font-bold text-teal-600 hover:text-teal-700 hover:underline transition">
          Masuk / Login di Sini
        </router-link>
      </div>

    </div>

    <!-- 🌟 Modal Sukses Registrasi -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showSuccess"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center border border-slate-100 animate-pop">
          <div class="w-16 h-16 bg-teal-100 rounded-full mx-auto flex items-center justify-center mb-5">
            <svg class="w-9 h-9 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">Registrasi Berhasil!</h2>
          <p class="text-sm text-slate-500 mb-6">
            Akun Anda telah dibuat. Silakan masuk menggunakan akun baru Anda untuk mulai menikmati fasilitas EduLibrary.
          </p>
          <button
            @click="goToLogin"
            class="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition shadow-md shadow-teal-600/20 text-sm"
          >
            Lanjut ke Halaman Login
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@keyframes pop {
  0% { opacity: 0; transform: scale(0.9) translateY(12px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-pop {
  animation: pop 0.3s ease-out;
}
</style>