import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../components/LoginPage.vue'
import ClassesPage from '../components/ClassesPage.vue'
import ClassroomPage from '../components/ClassroomPage.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/classes', component: ClassesPage },
  { path: '/classroom', component: ClassroomPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router