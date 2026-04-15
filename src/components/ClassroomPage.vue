<template>
  <div class="app">
    <aside class="sidebar">
      <h2 class="logo">Students</h2>
      <ul>
        <li>Dashboard</li>
        <li class="active">Tugas</li>
        <li>Materi</li>
        <li>Absensi</li>
        <li>Forum</li>
        <li>Berita</li>
      </ul>
    </aside>

    <div class="main">
      <header class="header">
        <h1>Classroom</h1>
        <div class="actions">
          <button class="btn small">Log out</button>
          <button class="btn small">Login</button>
          <div class="avatar">Foto profil</div>
        </div>
      </header>

      <div class="toolbar">
        <input class="search" placeholder="🔍 Search" />
        <select class="filter">
          <option>Lainnya</option>
        </select>

        <div class="toolbar-actions">
          <button class="circle">+</button>
          <button class="edit">Edit</button>
          <button class="circle">-</button>
        </div>
      </div>

      <div class="table">
        <div class="row header-row">
          <div>NIS</div>
          <div>Data Siswa</div>
          <div>Jadwal Kelas</div>
          <div>No hp</div>
        </div>

        <div class="row" v-for="i in 5" :key="i">
          <div>00{{ i }}</div>
          <div>Nama Siswa {{ i }}</div>
          <div>Senin - Jumat</div>
          <div>08xxxxxxx</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  background: #f3f3f3;
  font-family: 'Segoe UI', sans-serif;
}

/* SIDEBAR */
.sidebar {
  width: 220px;
  background: #2d1363;
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
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
}

.sidebar li:hover {
  background: rgba(255,255,255,0.1);
}

.active {
  background: rgba(255,255,255,0.2);
}

/* MAIN */
.main {
  flex: 1;
  padding: 20px;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #7a6f6f;
  padding: 15px 20px;
  border-radius: 10px;
  color: white;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn {
  background: #2d1363;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.small {
  font-size: 12px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #2d1363;
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
  background: #2d1363;
  color: white;
  font-size: 18px;
}

.edit {
  background: #2d1363;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
}

/* TABLE */
.table {
  margin-top: 20px;
  background: #7a6f6f;
  border-radius: 15px;
  padding: 10px;
  color: white;
}

.row {
  display: grid;
  grid-template-columns: 1fr 2fr 2fr 1fr;
  padding: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.3);
}

.header-row {
  font-weight: bold;
  border-bottom: 2px solid white;
}

.row:last-child {
  border-bottom: none;
}

.row:hover {
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
}
</style>
