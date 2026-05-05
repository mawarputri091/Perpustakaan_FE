<script setup>
defineProps({
  name: String,
  size: [String, Number]
})
</script>

<template>
  <svg class="w-5 h-5" :width="size || 24" :height="size || 24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path v-if="name === 'book'" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
    <path v-if="name === 'monitor'" d="M2 3h20v14H2z M8 21h8 M12 17v4"/>
    <path v-if="name === 'library'" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20 M12 2v20"/>
    <path v-if="name === 'users'" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"/>
    <path v-if="name === 'log-out'" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9"/>
    <path v-if="name === 'star'" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" :fill="name === 'star' ? 'currentColor' : 'none'"/>
    <path v-if="name === 'crown'" d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    <path v-if="name === 'chevron-left'" d="M15 18l-6-6 6-6"/>
    <path v-if="name === 'chevron-right'" d="M9 18l6-6-6-6"/>
    <path v-if="name === 'zoom-in'" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
    <path v-if="name === 'zoom-out'" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"/>
    <path v-if="name === 'bookmark'" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    <path v-if="name === 'download'" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3"/>
    <path v-if="name === 'search'" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    <path v-if="name === 'filter'" d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
    <path v-if="name === 'plus'" d="M12 5v14M5 12h14"/>
  </svg>
</template>