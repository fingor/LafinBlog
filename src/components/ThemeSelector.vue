<template>
  <div class="theme-selector">
    <el-dropdown @command="handleThemeChange" placement="bottom-start">
      <div class="theme-button">
        <span class="theme-text">主题</span>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="theme in themeOptions"
            :key="theme.value"
            :command="theme.value"
            :class="{ 'is-active': currentTheme === theme.value }"
          >
            <div class="theme-option">
              <span :class="`theme-dot theme-dot-${theme.value}`"></span>
              {{ theme.label }}
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'

  // 当前主题
  const currentTheme = ref('theme-default')

  // 可用主题列表
  const themeOptions = [
    { label: '默认蓝色', value: 'theme-default' },
    { label: '深色主题', value: 'theme-dark' },
    { label: '绿色主题', value: 'theme-green' },
  ]

  // 全局更新所有 data-skin 元素
  const updateAllThemes = theme => {
    // 查找并更新所有带有 data-skin 的元素
    document.querySelectorAll('[data-skin]').forEach(el => {
      el.setAttribute('data-skin', theme)
    })

    // 确保根元素也有主题
    //   const app = document.getElementById('app')
    //   if (app) app.setAttribute('data-skin', theme)
  }

  // 切换主题
  const handleThemeChange = theme => {
    currentTheme.value = theme
    localStorage.setItem('app-theme', theme)
    updateAllThemes(theme)
  }

  // 初始化主题
  onMounted(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'theme-default'
    currentTheme.value = savedTheme
    setTimeout(() => updateAllThemes(savedTheme), 100)
  })
</script>

<style scoped lang="scss">
  @import '@/assets/css/theme.scss';

  .theme-selector {
    .theme-button {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: inherit;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .theme-text {
        font-size: 14px;
      }
    }
  }

  .theme-option {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .theme-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);

    &.theme-dot-theme-default {
      background-color: $theme-default;
    }

    &.theme-dot-theme-dark {
      background-color: $theme-dark;
    }

    &.theme-dot-theme-green {
      background-color: $theme-green;
    }
  }

  :deep(.el-dropdown-menu__item.is-active) {
    background-color: rgba(64, 158, 255, 0.1);
    color: #409eff;
  }
</style>
