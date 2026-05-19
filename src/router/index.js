import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import CatalogView from '../views/CatalogView.vue'
import BookDetailView from '../views/BookDetailView.vue'
import LoanHistoryView from '../views/LoanHistoryView.vue'
import UpgradeView from '../views/UpgradeView.vue'
import AdminBooksView from '../views/AdminBooksView.vue'
import PdfReaderView from '../views/PdfReaderView.vue'
import AppLayout from '../components/AppLayout.vue'

const routes = [
  { path: '/login', component: LoginView },
  { path: '/read/:id', component: PdfReaderView },
  { 
    path: '/', 
    component: AppLayout, 
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: DashboardView },
      { path: 'catalog', component: CatalogView },
      { path: 'book/:id', component: BookDetailView },
      { path: 'history', component: LoanHistoryView },
      { path: 'upgrade', component: UpgradeView },
      { path: 'admin/books', component: AdminBooksView }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(), // Menggunakan Web History untuk Vite
  routes,
  scrollBehavior() { return { top: 0 } }
})

router.beforeEach((to, from) => {
  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)
  
  // Try-catch untuk mencegah aplikasi layar putih jika memori browser korup
  let user = null;
  try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser && storedUser !== 'undefined') {
      user = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error("Local storage error:", e);
    localStorage.removeItem('currentUser');
  }

  // Pengaturan akses halaman (Versi Router terbaru tanpa parameter next)
  if (authRequired && !user) return '/login'
  if (!authRequired && user && to.path === '/login') return '/dashboard'
  if (to.path.startsWith('/admin') && user?.role !== 'admin') return '/dashboard'
  
  return true
})

// Mencegah aplikasi blank putih jika gagal memuat halaman
router.onError((error) => {
  console.error('TERJADI ERROR PADA ROUTER VUE:', error)
  alert('Aplikasi gagal memuat komponen. Silakan refresh halaman atau periksa koneksi.')
})

export default router
