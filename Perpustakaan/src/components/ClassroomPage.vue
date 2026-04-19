<template>
  <div class="app">

    <!-- SIDEBAR -->
    <aside class="sidebar">
      <h2 class="logo">Students</h2>
      <ul>
        <li>Dashboard</li>
        <li class="active">Tugas</li>
        <router-link to="/" class="menu">Dashboard </router-link>
<router-link to="/classes" class="menu">Classes</router-link>
        <li>Materi</li>
        <li>Absensi</li>
        <li>Forum</li>
        <li>Berita</li>
      </ul>
    </aside>

    <!-- MAIN -->
    <div class="main">

      <!-- HEADER -->
      <div class="header">
  <h1>Classroom</h1>

  <div class="profile">
    <img 
      :src="profileImage || 'https://via.placeholder.com/40'" 
      class="avatar-img"
      @click="toggleMenu"
    />

    <div v-if="showMenu" class="dropdown">
      <label class="upload">
        Ganti Foto
        <input type="file" @change="handleUpload" hidden />
      </label>
      <button @click="handleLogout">Logout</button>
    </div>
  </div>
</div>

      <!-- TOOLBAR -->
      <div class="toolbar">
        <input class="search" placeholder="🔍 Search" v-model="search" />

        <div class="toolbar-actions">
          <button class="circle" @click="handleAdd">+</button>
          <button class="edit" @click="handleEdit">Edit</button>
          <button class="circle" @click="handleDelete">-</button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table">
        <div class="row header-row">
          <div>NIS</div>
          <div>Nama</div>
          <div>Jadwal</div>
          <div>No HP</div>
        </div>

        <div 
          class="row"
          v-for="(s, i) in filteredStudents"
          :key="s.id"
          @click="selectedIndex = i"
          :class="{ activeRow: selectedIndex === i }"
        >
          <div>{{ s.nis }}</div>
          <div>{{ s.nama }}</div>
          <div>{{ s.jadwal }}</div>
          <div>{{ s.hp }}</div>
        </div>

        <!-- kalau kosong -->
        <div v-if="filteredStudents.length === 0" style="padding:10px">
          Data tidak ditemukan
        </div>
      </div>

    </div>

    <!-- MODAL -->
    <div v-if="showForm" class="modal">
      <div class="modal-content">
        <h3>{{ isEditMode ? 'Edit Siswa' : 'Tambah Siswa' }}</h3>

        <input v-model="form.nis" placeholder="NIS" />
        <input v-model="form.nama" placeholder="Nama" />
        <input v-model="form.jadwal" placeholder="Jadwal" />
        <input v-model="form.hp" placeholder="No HP" />

        <div class="modal-actions">
          <button @click="handleSave">Save</button>
          <button @click="showForm = false">Cancel</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

import { ref, computed } from 'vue'

const search = ref('')

const students = ref([
  { id: 1, nis: '001', nama: 'Ahmad', jadwal: 'Senin', hp: '0812xxx' }
])

// ✅ SEARCH FILTER
const filteredStudents = computed(() => {
  return students.value.filter(s =>
    Object.values(s).some(val =>
      String(val).toLowerCase().includes(search.value.toLowerCase())
    )
  )
})

const showForm = ref(false)
const isEditMode = ref(false)
const selectedIndex = ref(null)

const form = ref({
  nis: '',
  nama: '',
  jadwal: '',
  hp: ''
})

// ADD
const handleAdd = () => {
  showForm.value = true
  isEditMode.value = false
  form.value = { nis: '', nama: '', jadwal: '', hp: '' }
}

// EDIT
const handleEdit = () => {
  if (selectedIndex.value === null) return alert('Pilih data dulu')

  form.value = { ...students.value[selectedIndex.value] }
  showForm.value = true
  isEditMode.value = true
}

// SAVE
const handleSave = () => {
  if (!form.value.nama) return alert('Nama wajib diisi')

  if (isEditMode.value) {
    students.value[selectedIndex.value] = { ...form.value }
  } else {
    students.value.push({
      ...form.value,
      id: Date.now()
    })
  }

  showForm.value = false
}

// DELETE
const handleDelete = () => {
  if (selectedIndex.value === null) return alert('Pilih data dulu')

  students.value.splice(selectedIndex.value, 1)
  selectedIndex.value = null
}

// PROFILE
const profileImage = ref(null)
const showMenu = ref(false)

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const handleUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    profileImage.value = URL.createObjectURL(file)
  }
}

const handleLogout = () => {
  alert('Logout berhasil!')

  router.push('/login')
  
  // reset data
  students.value = []
  search.value = ''
  
  // kalau nanti pakai router:
  // router.push('/')
}

</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 15px;
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-content input {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
}

.modal-actions button {
  background: linear-gradient(135deg,#6a5af9,#5b4cf0);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
}


.activeRow {
  background: #eaeaff;
}

.app {
  display: flex;
  height: 100vh;
  background: #f3f3f3;
  font-family: 'Segoe UI', sans-serif;
}

/* SIDEBAR */
.sidebar {
  width: 220px;
  background: linear-gradient(180deg,#6a5af9,#5b4cf0);
  color: white;
  padding: 20px;
}

.logo {
  margin-bottom: 30px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.3s;
}

.sidebar li:hover {
  background: rgba(255,255,255,0.2);
}

.active {
  background: rgba(255,255,255,0.3);
}

/* MAIN */
.menu {
  display: block;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 10px;
  color: white;
  text-decoration: none;
}

.menu.router-link-active {
  background: rgba(255,255,255,0.3);
}

.main {
  flex: 1;
  padding: 20px;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg,#6a5af9,#5b4cf0);
  padding: 15px 20px;
  border-radius: 15px;
  color: white;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn {
  background: white;
  color: #5b4cf0;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: white;
  color: #5b4cf0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

/* TOOLBAR */
.toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.search {
  padding: 10px;
  border-radius: 20px;
  border: none;
  width: 200px;
  box-shadow: 0 5px 10px rgba(0,0,0,0.05);
}

.filter {
  padding: 10px;
  border-radius: 20px;
  border: none;
}

.toolbar-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.circle {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg,#6a5af9,#5b4cf0);
  color: white;
  font-size: 18px;
}

.edit {
  background: linear-gradient(135deg,#6a5af9,#5b4cf0);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
}

/* TABLE */
.table {
  margin-top: 20px;
  background: white;
  border-radius: 20px;
  padding: 10px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}

.row {
  display: grid;
  grid-template-columns: 1fr 2fr 2fr 1fr;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.header-row {
  font-weight: bold;
  border-bottom: 2px solid #ddd;
}

.row:hover {
  background: #f9f9ff;
  border-radius: 10px;
}

.profile {
  position: relative;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid white;
  cursor: pointer;
}

.dropdown {
  position: absolute;
  right: 0;
  top: 50px;
  background: white;
  border-radius: 10px;
  padding: 10px;
  width: 150px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
}

.dropdown button,
.upload {
  background: linear-gradient(135deg,#6a5af9,#5b4cf0);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
}

</style>