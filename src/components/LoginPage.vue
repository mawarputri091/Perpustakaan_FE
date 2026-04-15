<template>
  <div class="wrapper">
    <div class="login-container">
      
      <!-- LEFT -->
      <div class="left">
        <h1>Log in</h1>
        <p class="subtitle">Don't have an account? <span>Sign Up.</span></p>

        <input placeholder="Username" />
        <input type="password" placeholder="Password" />

        <button class="login-btn" @click="login">LOG IN</button>
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
        <h2>Hello, Friend!</h2>
        <p>Register with your personal details to use all of site features</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const login = () => {
  router.push('/classes')
}
</script>

<style scoped>
/* WRAPPER biar center */
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f3f3f3;
}

/* CARD */
.login-container {
  display: flex;
  width: 900px;
  height: 550px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

/* LEFT */
.left {
  flex: 1;
  padding: 50px;
  display: flex;
  flex-direction: column;
}

.subtitle {
  font-size: 14px;
  margin-bottom: 20px;
}

.subtitle span {
  color: #6a5af9;
  cursor: pointer;
}

input {
  margin: 10px 0;
  padding: 10px;
  border: none;
  border-bottom: 1px solid #ccc;
}

/* BUTTON */
.login-btn {
  margin-top: 20px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg,#6a5af9,#5b4cf0);
  color: white;
  cursor: pointer;
}

.google, .microsoft {
  margin-top: 10px;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg,#6a5af9,#5b4cf0);
  color: white;
}

/* RIGHT */
.right {
  flex: 1;
  background: linear-gradient(135deg,#6a5af9,#5b4cf0);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-top-left-radius: 100px;
  border-bottom-left-radius: 100px;
  text-align: center;
}

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
</style>