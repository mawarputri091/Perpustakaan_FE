<template>
  <div>
    <h1>Classes</h1>
    <button @click="goClassroom">Masuk Classroom</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const goClassroom = () => {
  router.push('/classroom')
}
</script>