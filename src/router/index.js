import { createRouter, createWebHistory } from 'vue-router'

// Views
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import CatalogView from '../views/CatalogView.vue'
import BookDetailView from '../views/BookDetailView.vue'
import LoanHistoryView from '../views/LoanHistoryView.vue'
import UpgradeView from '../views/UpgradeView.vue'
import AdminBooksView from '../views/AdminBooksView.vue'
import PdfReaderView from '../views/PdfReaderView.vue'

// Components
import AppLayout from '../components/AppLayout.vue' // Ganti inline layout

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
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

router.beforeEach((to, from, next) => {
  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)
  const user = JSON.parse(localStorage.getItem('currentUser'))

  if (authRequired && !user) return next('/login')
  if (to.path.startsWith('/admin') && user?.role !== 'admin') return next('/dashboard')
  next()
})

export default router
