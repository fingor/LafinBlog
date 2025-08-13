<template>
  <h1>Node.js 后台管理系统</h1>
  <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
    <el-tab-pane
      label="文章管理"
      name="articles"
    >
      <BackendApi />
    </el-tab-pane>
    <el-tab-pane
      label="分类管理"
      name="categories"
    >
      <CategoryManagement />
    </el-tab-pane>
    <el-tab-pane
      label="课程管理"
      name="courses"
    >
      <CourseManagement />
    </el-tab-pane>
    <el-tab-pane
      label="章节管理"
      name="chapters"
    >
      <ChapterManagement />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup>
  import { ref } from 'vue'
  import BackendApi from './components/backendApi.vue'
  import CategoryManagement from './components/categoryManagement.vue'
  import CourseManagement from './components/courseManagement.vue'
  import ChapterManagement from './components/chapterManagement.vue'
  
  const activeName = ref('articles')
  const handleClick = (tab, event) => {
    console.log(tab, event)
  }
</script>

<style></style>
