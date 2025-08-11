<template>
  <div class="learning">
    <el-menu
      :default-active="route.path"
      class="el-menu-vertical-demo"
      :collapse="isCollapse"
      @select="handleSelect"
      router
    >
      <template v-for="item in menuItems" :key="item.index">
        <!-- 处理带子菜单的项目 -->
        <el-sub-menu v-if="item.children" :index="item.index">
          <template #title>
            <span>{{ item.title }}</span>
          </template>

          <template v-for="child in item.children" :key="child.index">
            <el-menu-item :index="child.index">{{ child.title }}</el-menu-item>
          </template>
        </el-sub-menu>

        <!-- 处理普通菜单项 -->
        <el-menu-item v-else :index="item.index" :disabled="item.disabled">
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </template>
    </el-menu>
    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const isCollapse = ref(false)

  // 定义菜单数据
  const menuItems = ref([
    {
      index: '/learning/nodejs',
      title: 'Node.js',
    },
    {
      index: '/learning/react-native',
      title: 'React Native',
    },
    {
      index: '/learning/webworker',
      title: 'WebWorker',
    },
    {
      index: '/learning/bigFileUpload',
      title: 'BigFileUpload',
    },
    {
      index: '/learning/chatAI',
      title: 'ChatAI',
    },
    {
      index: '/learning/typescript',
      title: 'TypeScript',
    },
    {
      index: '/learning/remoteComponent',
      title: 'RemoteComponent',
    },
  ])

  // 添加 handleSelect 方法
  const handleSelect = (key: string) => {
    console.log('Selected menu item:', key)
  }
</script>

<style scoped lang="scss">
  .learning {
    display: flex;
    .content {
      padding-left: 20px;
      flex: 1;
    }
  }
  .el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 200px;
    min-height: 400px;
  }
</style>
