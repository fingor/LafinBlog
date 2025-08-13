<template>
  <div class="top">
    <img
      style="width: 60px"
      :src="logo"
      alt="Element logo"
      @click="redirectHome"
    />
    <span class="title" @click="redirectHome">Lafin的博客</span>
  </div>
  <div class="navList">
    <span
      :class="{ active: activeIndex === item.index }"
      v-for="item in lists"
      :key="item.index"
      @click="handleSelect(item.index)"
      >{{ item.title }}</span
    >
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import logo from "@/assets/avengers.svg";
import { useRouter, useRoute } from "vue-router";
const router = useRouter();
const route = useRoute();
const activeIndex = ref("");

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    activeIndex.value = newPath;
  }
);
// 组件挂载时设置当前路径
onMounted(() => {
  activeIndex.value = route.path;
});

const handleSelect = (index) => {
  activeIndex.value = index; // 更新选中项
  router.push(index);
};
const redirectHome = () => {
  router.push("/");
};
const lists = [
  {
    index: "/notes",
    title: "笔记",
  },
  {
    index: "/learning",
    title: "应用",
  },
];
</script>

<style scoped lang="scss">
.top {
  display: flex;
  align-items: center;
  img {
    cursor: pointer;
  }
  .title {
    cursor: pointer;
  }
}
.navList {
  border-top: 1px solid #eae2d7;
  padding: 10px 0;
  span {
    cursor: pointer;
    margin-right: 10px;
    &:hover {
      color: #409eff;
    }
    &.active {
      color: #409eff;
      font-weight: bold;
    }
  }
}
</style>
