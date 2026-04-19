<template>
  <div class="main">

    <!-- HEADER -->
    <div class="header">
      <div class="left">
        <span class="back" @click="$router.push('/classroom')">←</span>
        <h2>Classes</h2>
      </div>

      <div class="actions">
       
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
    </div>

    <!-- TOOLBAR -->
    <div class="toolbar">
      <input 
        class="search" 
        placeholder="🔍 Search"
        v-model="search"
      />

      <select class="filter">
        <option>Lainnya</option>
      </select>

      <div class="toolbar-actions">
        <button class="circle" @click="handleAdd">+</button>
        <button class="edit" @click="handleEdit">Edit</button>
        <button class="circle" @click="handleDelete">-</button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="table">
      <div class="row header-row">
        <div>No</div>
        <div>Kelas</div>
        <div>NIK Kelas</div>
        <div>Jumlah</div>
      </div>

      <div 
        class="row"
        v-for="(c, i) in filteredClasses"
        :key="c.id"
        @click="selectedIndex = i"
        :class="{ activeRow: selectedIndex === i }"
      >
        <div>{{ i + 1 }}</div>
        <div>{{ c.nama }}</div>
        <div>{{ c.nik }}</div>
        <div>{{ c.jumlah }}</div>
      </div>

      <div v-if="filteredClasses.length === 0" class="empty">
        Data tidak ditemukan
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="showForm" class="modal">
      <div class="modal-content">
        <h3>{{ isEditMode ? 'Edit Kelas' : 'Tambah Kelas' }}</h3>

        <input v-model="form.nama" placeholder="Nama Kelas" />
        <input v-model="form.nik" placeholder="NIK Kelas" />
        <input v-model="form.jumlah" placeholder="Jumlah Siswa" />

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

const classes = ref([
  { id: 1, nama: 'X RPL 1', nik: 'RPL01', jumlah: 30 },
  { id: 2, nama: 'X RPL 2', nik: 'RPL02', jumlah: 28 }
])

const filteredClasses = computed(() => {
  return classes.value.filter(c =>
    Object.values(c).some(val =>
      String(val).toLowerCase().includes(search.value.toLowerCase())
    )
  )
})

const selectedIndex = ref(null)
const showForm = ref(false)
const isEditMode = ref(false)

const form = ref({
  nama: '',
  nik: '',
  jumlah: ''
})

// ADD
const handleAdd = () => {
  form.value = { nama: '', nik: '', jumlah: '' }
  isEditMode.value = false
  showForm.value = true
}

// EDIT
const handleEdit = () => {
  if (selectedIndex.value === null) return alert('Pilih data dulu')

  form.value = { ...classes.value[selectedIndex.value] }
  isEditMode.value = true
  showForm.value = true
}

// SAVE
const handleSave = () => {
  if (!form.value.nama) return alert('Nama wajib diisi')

  if (isEditMode.value) {
    classes.value[selectedIndex.value] = {
      ...form.value,
      id: classes.value[selectedIndex.value].id
    }
  } else {
    classes.value.push({
      ...form.value,
      id: Date.now()
    })
  }

  showForm.value = false
}

// DELETE
const handleDelete = () => {
  if (selectedIndex.value === null) return alert('Pilih data dulu')

  classes.value.splice(selectedIndex.value, 1)
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
}
</script>

<style scoped>
/* MAIN */
.main {
  padding: 20px;
  background: #f3f3f3;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(135deg,#6a5af9,#5b4cf0);
  color: white;
}

/* LEFT */
.left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back {
  font-size: 20px;
  cursor: pointer;
}

/* PROFILE */
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

/* DROPDOWN */
.dropdown {
  position: absolute;
  right: 0;
  top: 50px;
  background: white;
  border-radius: 12px;
  padding: 10px;
  width: 150px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dropdown button,
.upload {
  background: linear-gradient(135deg,#6a5af9,#5b4cf0);
  color: white;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
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
  background: #e9e9e9;
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

/* BUTTON */
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
  border-radius: 10px;
}

/* TABLE */
.table {
  margin-top: 20px;
  background: white;
  border-radius: 20px;
  padding: 10px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 2fr 2fr 1fr;
  padding: 12px;
  border-bottom: 1px solid #ddd;
}

.header-row {
  font-weight: bold;
  border-bottom: 2px solid #ccc;
}

.row:hover {
  background: #f5f5ff;
}

.activeRow {
  background: #eaeaff;
}

/* MODAL */
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
  padding: 8px;
  border-radius: 8px;
}

</style>