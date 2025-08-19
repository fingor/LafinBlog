<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>用户登录</h2>
        <p>欢迎回到Lafin的博客</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="login">用户名/邮箱</label>
          <input
            id="login"
            name="login"
            v-model="formData.login"
            type="text"
            placeholder="请输入用户名或邮箱"
            required
            :class="{ error: errors.login }"
          />
          <span v-if="errors.login" class="error-message">{{
            errors.login
          }}</span>
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            name="password"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            required
            :class="{ error: errors.password }"
          />
          <span v-if="errors.password" class="error-message">{{
            errors.password
          }}</span>
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <input 
              v-model="formData.rememberMe" 
              type="checkbox" 
              name="rememberMe"
            />
            <span class="checkmark"></span>
            记住我
          </label>
          <a href="#" @click.prevent="forgotPassword" class="forgot-link"
            >忘记密码？</a
          >
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '登录中...' : '立即登录' }}
        </button>
      </form>

      <div class="register-link">
        还没有账号？ <a @click="goToRegister">立即注册</a>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { $http } from '@/utils/request.js'
  import { $success, $error, $warning, $info } from '@/utils/confirm.js'

  const router = useRouter()
  const loading = ref(false)

  const formData = reactive({
    login: 'admin',
    password: 'admin',
    rememberMe: false,
  })

  const errors = reactive({
    login: '',
    password: '',
  })

  // 验证表单
  const validateForm = () => {
    let isValid = true

    // 重置错误信息
    Object.keys(errors).forEach(key => {
      errors[key] = ''
    })

    // 验证用户名
    if (!formData.login.trim()) {
      errors.login = '用户名或邮箱不能为空'
      isValid = false
    }

    // 验证密码
    if (!formData.password) {
      errors.password = '密码不能为空'
      isValid = false
    }

    return isValid
  }

  // 处理登录
  const handleLogin = async () => {
    if (!validateForm()) {
      return
    }

    loading.value = true

    try {
      const response = await $http('/api/auth/sign_in', {
        method: 'POST',
        body: JSON.stringify({
          login: formData.login,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      })
      if (response.status === true) {
        // 保存用户信息到本地存储
        // localStorage.setItem('userInfo', JSON.stringify(response.data))
        localStorage.setItem('token', response.data.token)
        // 如果选择记住我，可以设置更长的过期时间
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        }
        // 显示成功消息
        $success('登录成功！')
        // 跳转到首页
        router.push('/home')
      }
      // 移除 else 分支，因为 request.js 已经统一处理了错误消息
    } catch (error) {
      console.error('登录错误:', error)
      // 网络错误或其他异常情况，request.js 已经处理了，这里不需要重复显示
    } finally {
      loading.value = false
    }
  }

  const goToRegister = () => {
    router.push('/register')
  }

  const forgotPassword = () => {
    $info('忘记密码功能开发中...')
  }
</script>

<style scoped lang="scss">
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }

  .login-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 40px;
    width: 100%;
    max-width: 400px;
  }

  .login-header {
    text-align: center;
    margin-bottom: 30px;

    h2 {
      color: #333;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
    }

    p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }
  }

  .login-form {
    .form-group {
      margin-bottom: 20px;

      label {
        display: block;
        margin-bottom: 8px;
        color: #333;
        font-weight: 500;
        font-size: 14px;
      }

      input[type='text'],
      input[type='password'] {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.3s ease;
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: #667eea;
        }

        &.error {
          border-color: #ff4757;
        }

        &::placeholder {
          color: #999;
        }
      }

      .error-message {
        color: #ff4757;
        font-size: 12px;
        margin-top: 4px;
        display: block;
      }
    }
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .checkbox-label {
    display: flex !important;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    color: #666;

    input[type='checkbox'] {
      display: none;
    }

    .checkmark {
      width: 18px;
      height: 18px;
      border: 2px solid #e1e5e9;
      border-radius: 4px;
      margin-right: 8px;
      position: relative;
      transition: all 0.3s ease;
    }

    input[type='checkbox']:checked + .checkmark {
      background-color: #667eea;
      border-color: #667eea;

      &::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
        font-weight: bold;
      }
    }
  }

  .forgot-link {
    color: #667eea;
    text-decoration: none;
    font-size: 14px;

    &:hover {
      text-decoration: underline;
    }
  }

  .login-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .register-link {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: #666;

    a {
      color: #667eea;
      cursor: pointer;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
</style>
