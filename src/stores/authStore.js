import { defineStore } from 'pinia'
import { ref } from 'vue'

// TIPS SATU WIFI: Ubah localhost menjadi IP Komputer Anda (contoh: [http://192.168.1.5:3000](http://192.168.1.5:3000))
const API_URL = 'http://172.19.136.62:3000'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('currentUser')) || null)
  
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
      const userData = result.data || result // Ambil data user
      const token = result.token || result.data?.token // Ambil token dari backend
      
      user.value = userData
      localStorage.setItem('currentUser', JSON.stringify(userData))
      
      if (token) {
        localStorage.setItem('api_token', token)
      }
      
      return { success: true }
    } catch (error) {
      console.error("[Login Gagal] Hanya bisa login via API:", error.message)
      const errorMsg = error.message === 'Failed to fetch' 
          ? 'Server API Offline (Gagal Terhubung)' 
          : error.message
          
      return { success: false, message: errorMsg }
    }
  }

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
  
  const upgradeMembership = () => {
    if (user.value) { 
      user.value.membership = 'premium'
      localStorage.setItem('currentUser', JSON.stringify(user.value))
    }
  }
  
  return { user, login, logout, upgradeMembership }
})
