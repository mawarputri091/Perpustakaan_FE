import { createRouter, createWebHistory } from 'vue-router'

// Pages
import LoginPage from '../components/LoginPage.vue'
import ClassesPage from '../components/ClassesPage.vue'
import ClassroomPage from '../components/ClassroomPage.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/classes', component: ClassesPage },
  { path: '/classroom', component: ClassroomPage }
]

export default createRouter({
  history: createWebHistory(),
  routes
})