import { defineStore } from 'pinia'
import { ref } from 'vue'

// 1. MENGUBAH URL KE IP BACKEND ANDA (Sesuai Postman)
const API_URL = 'http://192.168.1.3:3000'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('currentUser')) || null)
  
  const login = async (username, password) => {
    try {
      // Langkah 1: POST Login untuk mendapatkan Token
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
      
      // Langkah 2: Ambil daftar Users untuk melihat Role-nya (Sesuai Postman)
      const usersRes = await fetch(`${API_URL}/users`, {
        headers: {
          'Content-Type': 'application/json',
          // Mengirim Bearer Token hasil login
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      
      let foundUser = null;
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        const usersList = Array.isArray(usersJson) ? usersJson : (usersJson.data || []);
        // Cari user yang login di dalam array /users
        foundUser = usersList.find(u => u.username === username);
      }

      // Jika endpoint /users gagal, gunakan data bawaan dari /auth/login
      if (!foundUser) {
        foundUser = result.data || result || { username, role: 'gratis' };
      }

      // ==========================================
      // Langkah 3: MAPPING ROLE DARI DATABASE KE FRONTEND
      // ==========================================
      let userRole = 'user'
      let userMembership = 'free'

      const dbRole = (foundUser.role || '').toLowerCase()

      if (dbRole === 'admin') {
        userRole = 'admin'
        userMembership = 'GOD'
      } else if (dbRole === 'berbayar') {
        userRole = 'user'
        userMembership = 'premium'
      } else if (dbRole === 'gratis') {
        userRole = 'user'
        userMembership = 'free'
      }

      const userData = {
        id: foundUser.id || Date.now(),
        name: foundUser.username || username, 
        username: foundUser.username || username,
        role: userRole, 
        membership: userMembership
      }

      // Simpan data ke state lokal
      user.value = userData
      localStorage.setItem('currentUser', JSON.stringify(userData))
      
      if (token) {
        localStorage.setItem('api_token', token)
      }
      
      return { success: true }
    } catch (error) {
      console.error("[Login Gagal]:", error.message)
      const errorMsg = error.message === 'Failed to fetch' 
          ? 'Server API Offline (Gagal Terhubung ke 10.134.199.62)' 
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