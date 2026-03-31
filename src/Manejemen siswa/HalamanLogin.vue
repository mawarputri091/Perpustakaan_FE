<template>
  <div class="container">

    <!-- LEFT -->
    <div class="left">
      <h1>Log in</h1>
      <p>Don’t have an account? <a href="#">Sign Up.</a></p>

      <div class="input-group">
        <label>Username</label>
        <input type="text" v-model="username">
      </div>

      <div class="input-group">
        <label>Password</label>
        <input type="password" v-model="password">
      </div>

      <button class="login-btn" @click="handleLogin">LOG IN</button>

      <button class="social-btn">
        <img src="https://cdn-icons-png.flaticon.com/512/281/281764.png">
        Continue with Google
      </button>

      <button class="social-btn">
        <img src="https://cdn-icons-png.flaticon.com/512/732/732221.png">
        Continue with Microsoft
      </button>
    </div>

    <!-- RIGHT -->
    <div class="right">
      <div class="right-content">
        <h2>Hello, Friend!</h2>
        <p>Register with your personal details to use all of site features</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('')
const password = ref('')

const handleLogin = () => {
  console.log("Username:", username.value)
  console.log("Password:", password.value)

  // nanti bisa sambung ke backend
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Segoe UI", sans-serif;
}

.container {
  width: 900px;
  height: 500px;
  background: #fff;
  display: flex;
  border-radius: 10px;
  overflow: hidden;
}

/* LEFT */
.left {
  width: 50%;
  padding: 60px 50px;
}

.left h1 {
  font-size: 32px;
  margin-bottom: 10px;
  color: black;
}

.left p {
  font-size: 13px;
  color: #777;
  margin-bottom: 30px;
}

.left p a {
  color: #4a90e2;
  text-decoration: none;
  transition: 0.2s;
}

.left p a:hover {
  text-decoration: underline;
  color: #2f6fd6;
}

/* INPUT */
.input-group {
  margin-bottom: 25px;
}

.input-group label {
  font-size: 12px;
  color: black;
}

.input-group input {
  width: 100%;
  border: none;
  border-bottom: 1px solid #ccc;
  padding: 8px 0;
  outline: none;
  background: transparent;
}

.input-group input:focus {
  border-bottom: 1px solid #4a90e2;
}

/* BUTTON */
.login-btn {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  background: linear-gradient(135deg, #6c63ff, #5a4bff);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: 0.2s;
}

.login-btn:hover {
  background: #2f00ff;
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(0,0,0,0.2);
}

/* SOCIAL */
.social-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background: linear-gradient(135deg, #6c63ff, #5a4bff);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: 0.2s;
}

.social-btn:hover {
  background: #2f00ff;
  transform: translateY(-2px);
  box-shadow: 0 5px 10px rgba(0,0,0,0.2);
}

.social-btn img {
  width: 20px;
  height: 20px;
  background: white;
  padding: 3px;
  border-radius: 4px;
}

/* RIGHT */
.right {
  width: 50%;
  background: linear-gradient(135deg, #6c63ff, #5a4bff);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;

  border-top-left-radius: 80px;
  border-bottom-left-radius: 80px;
}

.right-content h2 {
  margin-bottom: 15px;
}

.right-content p {
  font-size: 13px;
  padding: 0 20px;
}
</style>