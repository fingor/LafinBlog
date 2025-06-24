<template>
  <h1>Node.js</h1>
  <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
    <el-tab-pane label="接口测试" name="first">
      <BackendApi />
    </el-tab-pane>
    <el-tab-pane label="Config" name="second">Config</el-tab-pane>
    <el-tab-pane label="Role" name="third">Role</el-tab-pane>
    <el-tab-pane label="Task" name="fourth">Task</el-tab-pane>
  </el-tabs>
</template>

<script setup>
import { ref } from "vue";
import BackendApi from "./components/backendApi.vue";
const activeName = ref("first");
const handleClick = (tab, event) => {
  console.log(tab, event);
};
</script>

<style></style>
