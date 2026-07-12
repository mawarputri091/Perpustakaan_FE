import { defineStore } from 'pinia'
import { ref } from 'vue'

// URL Sesuai IP Backend Anda (Pusat Konfigurasi IP)
const API_URL = 'http://192.168.1.9:3000'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('currentUser')) || null)
  const currentResetEmail = ref('') // State tambahan untuk menampung email yang sedang di-reset
  
  // 1. FUNGSI LOGIN
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || 'Username atau password salah')
      }
      
      const result = await response.json()
      const token = result.token || result.data?.token 
      
      if (!token) {
        throw new Error('Token tidak ditemukan dalam respons server')
      }

      const tokenPayload = JSON.parse(atob(token.split('.')[1]))
      console.log("Payload Token Aktif:", tokenPayload)

      const rawRole = (tokenPayload.role || '').toLowerCase()
      let userRole = 'user'
      let userMembership = 'free'

      if (rawRole === 'admin') {
        userRole = 'admin'
        userMembership = 'GOD'
      } else if (rawRole === 'premium') {
        userRole = 'user'
        userMembership = 'premium'
      } else if (rawRole === 'user' && username === 'berbayar') { 
        userRole = 'user'
        userMembership = 'premium'
      } else if (rawRole === 'gratis' || rawRole === 'user') {
        userRole = 'user'
        userMembership = 'free'
      }

      const userData = {
        id: tokenPayload.id || Date.now(),
        name: tokenPayload.username || username, 
        username: tokenPayload.username || username,
        role: userRole, 
        membership: userMembership,
        email: tokenPayload.email || '',
        phone: tokenPayload.phone || '' 
      }

      user.value = userData
      localStorage.setItem('currentUser', JSON.stringify(userData))
      localStorage.setItem('api_token', token)
      
      return { success: true }
    } catch (error) {
      console.error("[Login Gagal]:", error.message)
<<<<<<< Updated upstream
      const errorMsg = error.message === 'Failed to fetch' 
          ? 'Server API Offline (Gagal Terhubung ke 10.134.199.62)' 
          : error.message
          
=======
      const errorMsg = error.message === 'Failed to fetch' ? 'Server API Offline' : error.message
>>>>>>> Stashed changes
      return { success: false, message: errorMsg }
    }
  }

  // 2. FUNGSI LOGOUT
  const logout = async () => {
    try {
      const token = localStorage.getItem('api_token')
      await fetch(`${API_URL}/auth/logout`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
    } catch(e) {
      console.warn("[API Offline] Logout API gagal, menghapus sesi secara lokal.")
    } finally {
      user.value = null
      localStorage.removeItem('currentUser')
      localStorage.removeItem('api_token')
    }
  }

  // 3. FETCH ALL USERS (PANEL ADMIN) - Sinkronisasi Status Database
  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('api_token')
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      if (!response.ok) throw new Error('Gagal mengambil data user dari server')

      const json = await response.json()
      const list = Array.isArray(json) ? json : (json.data || [])

      return list.map(u => {
        const rawRole = (u.role || '').toLowerCase()
        let displayMembership = 'Gratis'

        if (rawRole === 'admin') {
          displayMembership = 'GOD'
        } else if (rawRole === 'premium') {
          displayMembership = 'Premium'
        } else if (rawRole === 'gratis') {
          displayMembership = 'Gratis'
        }

        return {
          id: u.id,
          name: u.username || 'User',
          email: u.email || '-', 
          phone: u.no_telp || u.phone || '-', 
          membership: displayMembership
        }
      })
    } catch (error) {
      console.error("[Fetch Users Error]:", error.message)
      return null
    }
  }

  // 4. FUNGSI UPDATE ADMIN: Menggunakan CARA B (Langsung ke /users/:id tanpa /auth)
  const updateUser = async (id, payload) => {
    try {
      const token = localStorage.getItem('api_token')
      
      let dbRole = 'gratis'
      if (payload.membership === 'GOD') dbRole = 'admin'
      if (payload.membership === 'Premium') dbRole = 'premium'

      const bodyPayload = {
        username: payload.username,
        email: payload.email,
        role: dbRole,
        no_telp: payload.phone
      }

      console.log("Mengirim update user ke ID:", id, "dengan payload:", bodyPayload)

      // 🌟 CARA B: Menembak rute users direktori utama backend
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(bodyPayload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Respon kegagalan dari backend controller:", errorData)
        return false
      }

      return true
    } catch (error) {
      console.error("[Update User Error]:", error.message)
      return false
    }
  } 

  // 5. REMOVE USER (HARD DELETE)
  const removeUser = async (id) => {
    try {
      const token = localStorage.getItem('api_token')
      const response = await fetch(`${API_URL}/users/${id}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })

      return response.ok
    } catch (error) {
      console.error("[Delete User Error]:", error.message)
      return false
    }
  }

  // 6. FUNGSI REGISTRASI: Menggunakan API_URL Pusat
  const register = async (payload) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          username: payload.username,
          email: payload.email,
          password: payload.password,
          no_telp: payload.phone
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || 'Gagal melakukan registrasi pendaftaran.')
      }

      return { success: true }
    } catch (error) {
      console.error("[Register Store Error]:", error.message)
      const errorMsg = error.message === 'Failed to fetch' ? 'Server API Offline' : error.message
      return { success: false, message: errorMsg }
    }
  }

  // 7. FUNGSI UPGRADE MEMBERSHIP ASINKRON
  const upgradeMembership = async (payload) => {
    try {
      const token = localStorage.getItem('api_token')

      const response = await fetch(`${API_URL}/membership/upgrade`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || `Server merespon dengan status ${response.status}`)
      }

      const data = await response.json()
      
      if (user.value) {
        user.value.membership = 'premium'
        localStorage.setItem('currentUser', JSON.stringify(user.value))
      }

      return { success: true, data }
    } catch (error) {
      console.error("[Upgrade Store Error]:", error.message)
      return { success: false, message: error.message }
    }
  }

  // 8. FUNGSI MINTA TOKEN LUPA PASSWORD
  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Email tidak ditemukan.')
      }

      currentResetEmail.value = email
      return { success: true }
    } catch (error) {
      console.error("[Store Forgot Password Error]:", error.message)
      return { success: false, message: error.message }
    }
  }

  // 9. FUNGSI SIMPAN PASSWORD BARU
  const resetPassword = async (newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentResetEmail.value,
          new_password: newPassword
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengubah kata sandi.')
      }

      return { success: true }
    } catch (error) {
      console.error("[Store Reset Password Error]:", error.message)
      return { success: false, message: error.message }
    }
  }

  // 10. FUNGSI MINTA USERNAME TERPUSAT (GIMMICK)
  const forgotUsername = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Email tidak ditemukan.')
      }

      return { success: true, username: data.username }
    } catch (error) {
      console.error("[Store Forgot Username Error]:", error.message)
      return { success: false, message: error.message }
    }
  }

  return { user, currentResetEmail, login, logout, fetchAllUsers, updateUser, removeUser, register, upgradeMembership, forgotPassword, resetPassword, forgotUsername }
})