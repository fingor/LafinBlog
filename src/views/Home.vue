<template>
  <div class="home-container">
    <!-- 导航栏 -->
    <div class="navbar">
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
      <!-- 用户头像和下拉菜单 -->
      <div class="user-section">
        <div
          class="user-avatar"
          @click="toggleDropdown"
          @mouseenter="showDropdown = true"
        >
          <img :src="userAvatar" alt="用户头像" />
          <div
            class="dropdown-menu"
            v-show="showDropdown"
            @mouseleave="showDropdown = false"
          >
            <div v-if="!isLoggedIn" class="dropdown-item" @click="goToRegister">
              <i class="icon">📝</i>
              注册
            </div>
            <div class="dropdown-item" @click="logout">
              <i class="icon">🚪</i>
              退出登录
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 主内容区域 -->
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue'
  import logo from '@/assets/avengers.svg'
  import userAvatar from '@/assets/imgs/user-avatar.png'
  import { useRouter, useRoute } from 'vue-router'

  const router = useRouter()
  const route = useRoute()
  const activeIndex = ref('')
  const showDropdown = ref(false)
  const isLoggedIn = ref(false)

  // 检查用户登录状态
  const checkLoginStatus = () => {
    const token = localStorage.getItem('token')
    const userInfo = localStorage.getItem('userInfo')
    isLoggedIn.value = !!(token && userInfo)
  }

  // 监听路由变化
  watch(
    () => route.path,
    newPath => {
      activeIndex.value = newPath
    }
  )

  // 组件挂载时设置当前路径
  onMounted(() => {
    activeIndex.value = route.path
    checkLoginStatus()
  })

  const handleSelect = index => {
    activeIndex.value = index // 更新选中项
    router.push(index)
  }

  const redirectHome = () => {
    router.push('/')
  }

  const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value
  }

  const goToRegister = () => {
    showDropdown.value = false
    router.push('/register')
  }

  const logout = () => {
    showDropdown.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('rememberMe')
    checkLoginStatus()
    router.push('/login')
  }

  const lists = [
    {
      index: '/notes',
      title: '笔记',
    },
    {
      index: '/learning',
      title: '应用',
    },
  ]
</script>

<style scoped lang="scss">
  .home-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .navbar {
    position: relative;
    display: flex;
    flex-direction: column;
    background: white;
    border-bottom: 1px solid #eae2d7;
  }

  .top {
    display: flex;
    align-items: center;
    padding: 10px 20px;

    img {
      cursor: pointer;
    }

    .title {
      cursor: pointer;
      margin-left: 10px;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .navList {
    border-top: 1px solid #eae2d7;
    padding: 10px 20px;

    span {
      cursor: pointer;
      margin-right: 20px;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        color: #409eff;
        background-color: #f0f8ff;
      }

      &.active {
        color: #409eff;
        font-weight: bold;
        background-color: #e6f3ff;
      }
    }
  }

  .user-section {
    position: absolute;
    top: 15px;
    right: 20px;
  }

  .user-avatar {
    position: relative;
    cursor: pointer;

    img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #eae2d7;
      transition: border-color 0.3s ease;

      &:hover {
        border-color: #409eff;
      }
    }
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: white;
    border: 1px solid #eae2d7;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 150px;
    z-index: 1000;

    &::before {
      content: '';
      position: absolute;
      top: -6px;
      right: 15px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid white;
    }
  }

  .dropdown-item {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f5f5f5;
    }

    &:first-child {
      border-radius: 8px 8px 0 0;
    }

    &:last-child {
      border-radius: 0 0 8px 8px;
    }

    .icon {
      font-size: 16px;
    }
  }

  .main-content {
    flex: 1;
    overflow: auto;
    // padding: 20px;
    background-color: #f8f9fa;
  }
</style>
