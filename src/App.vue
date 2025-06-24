<template>
  <div class="app-container">
    <NavBar />
    <router-view style="flex: 1"></router-view>
    <!-- 路由内容渲染位置 -->
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
