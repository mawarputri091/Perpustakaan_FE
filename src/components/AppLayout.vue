<script setup>
import AppSidebar from './AppSidebar.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <AppSidebar />
    <main class="flex-1 ml-64 overflow-y-auto">
      <div class="p-6 md:p-8 max-w-6xl mx-auto min-h-full">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>