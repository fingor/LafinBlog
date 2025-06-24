<template>
  <div class="app-container">
    <NavBar />
    <router-view style="flex: 1"></router-view>
  </div>
</template>
<script setup>
import NavBar from "./components/NavBar.vue";
</script>
<style scoped lang="scss">
.app-container {
  display: flex;
  flex-flow: column;
  height: 100%;
}
</style>
