import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mockUsers } from '../data/mockData'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('currentUser')) || null)
  
  const login = (email, password) => {
    const found = mockUsers.find(u => u.email === email && u.password === password)
    if (found) { 
      user.value = found; 
      localStorage.setItem('currentUser', JSON.stringify(found)); 
      return true; 
    }
    return false;
  }
  
  const logout = () => { 
    user.value = null; 
    localStorage.removeItem('currentUser'); 
  }
  
  const upgradeMembership = () => {
    if (user.value) { 
      user.value.membership = 'premium'; 
      localStorage.setItem('currentUser', JSON.stringify(user.value)); 
    }
  }
  
  return { user, login, logout, upgradeMembership }
})
