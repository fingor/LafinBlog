<template>
  <div>
    <el-button type="primary" @click="signOut">登出</el-button>
    <el-button type="primary" @click="signIn">登录</el-button>
    <el-button type="primary" @click="getArticles">查询课程列表</el-button>
    <el-button type="primary" @click="getArticlesFrontEnd"
      >查询课程列表(前台)</el-button
    >
  </div>
  <div>
    <span v-for="item in articles" :key="item.id">{{ item.title }}</span>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { $http } from "@/utils/request";
const articles = ref([]);

const signOut = () => {
  localStorage.removeItem("token");
  ElMessage.success("登出成功");
};
const signIn = () => {
  $http("/admin/auth/sign_in", {
    method: "POST",
    body: JSON.stringify({ login: "admin@clwy.cn", password: "aaabbbcccd" }),
  }).then((res) => {
    console.log("res", res);
    if (res.status) {
      localStorage.setItem("token", res.data.token);
    }
  });
};
const getArticles = () => {
  const params = new URLSearchParams({
    title: "aaa",
  });
  //   $http(`/admin/articles?${params.toString()}`, {
  $http(`/admin/articles`, {
    // 自动转为 ?page=1&limit=10&keyword=test
    method: "GET",
  }).then((res) => {
    console.log("res11", res);
    if (res.data?.articles?.length > 0) {
      articles.value = res.data.articles;
    } else {
      articles.value = [];
    }
  });
};
const getArticlesFrontEnd = () => {
  //   $http(`/admin/articles?${params.toString()}`, {
  $http(`/api/articles`, {
    // 自动转为 ?page=1&limit=10&keyword=test
    method: "GET",
  }).then((res) => {
    console.log("res11", res);
    if (res.data?.articles?.length > 0) {
      articles.value = res.data.articles;
    } else {
      articles.value = [];
    }
  });
};
</script>

<style></style>
