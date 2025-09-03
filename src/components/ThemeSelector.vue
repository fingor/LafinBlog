<template>
  <div class="theme-selector">
    <el-dropdown @command="handleThemeChange" placement="bottom-start">
      <div class="theme-button">
        <!-- 显示当前主题颜色圆点而不是文字 -->
        <span :class="`current-theme-dot theme-dot-${currentTheme}`"></span>
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
      justify-content: center;
      padding: 8px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 32px;
      height: 32px;
      background-color: rgba(255, 255, 255, 0.1);

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }

      .current-theme-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
    }
  }

  .theme-option {
    display: flex;
    align-items: center;
    gap: 12px;
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

  .current-theme-dot {
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
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
</style>
