<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h2>用户注册</h2>
        <p>欢迎加入Lafin的博客</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            name="username"
            v-model="formData.username"
            type="text"
            placeholder="请输入用户名"
            required
            :class="{ error: errors.username }"
          />
          <span v-if="errors.username" class="error-message">{{
            errors.username
          }}</span>
        </div>
        <div class="form-group">
          <label for="nickname">昵称</label>
          <input
            id="nickname"
            name="nickname"
            v-model="formData.nickname"
            type="text"
            placeholder="请输入用户名"
            required
            :class="{ error: errors.nickname }"
          />
          <span v-if="errors.nickname" class="error-message">{{
            errors.nickname
          }}</span>
        </div>
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            name="email"
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱"
            required
            :class="{ error: errors.email }"
          />
          <span v-if="errors.email" class="error-message">{{
            errors.email
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

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            required
            :class="{ error: errors.confirmPassword }"
          />
          <span v-if="errors.confirmPassword" class="error-message">{{
            errors.confirmPassword
          }}</span>
        </div>

        <!-- 验证码区域 -->
        <div class="form-group">
          <label for="captcha">验证码</label>
          <div class="captcha-container">
            <input
              id="captcha"
              name="captcha"
              v-model="formData.captchaText"
              type="text"
              placeholder="请输入验证码"
              required
              :class="{ error: errors.captchaText }"
              maxlength="4"
            />
            <div class="captcha-display" @click="refreshCaptcha">
              <div
                v-if="captchaData"
                v-html="captchaData"
                class="captcha-svg"
              ></div>
              <div v-else class="captcha-loading">
                <span v-if="captchaLoading">加载中...</span>
                <span v-else>点击获取验证码</span>
              </div>
            </div>
          </div>
          <span v-if="errors.captchaText" class="error-message">{{
            errors.captchaText
          }}</span>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              v-model="formData.agreeTerms"
              type="checkbox"
              name="agreeTerms"
            />
            <span class="checkmark"></span>
            我已阅读并同意
            <a href="#" @click.prevent="showTerms">用户协议</a> 和
            <a href="#" @click.prevent="showPrivacy">隐私政策</a>
          </label>
        </div>

        <button type="submit" class="register-btn" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '注册中...' : '立即注册' }}
        </button>
      </form>

      <div class="login-link">
        已有账号？ <a @click="goToLogin">立即登录</a>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { $http } from '@/utils/request.js'
  import {
    $confirm,
    $message,
    $success,
    $error,
    $warning,
  } from '@/utils/confirm.js'

  const router = useRouter()
  const loading = ref(false)
  const captchaLoading = ref(false)
  const captchaData = ref('')
  const captchaKey = ref('')

  const formData = reactive({
    username: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    captchaText: '',
    agreeTerms: false,
  })

  const errors = reactive({
    username: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    captchaText: '',
  })

  // 获取验证码
  const getCaptcha = async () => {
    captchaLoading.value = true
    try {
      const response = await $http('/api/captcha', {
        method: 'GET',
      })

      if (response.status) {
        captchaData.value = response.data.captchaData
        captchaKey.value = response.data.captchaKey
      } else {
        console.error('获取验证码失败:', response.message)
      }
    } catch (error) {
      console.error('获取验证码错误:', error)
    } finally {
      captchaLoading.value = false
    }
  }

  // 刷新验证码
  const refreshCaptcha = () => {
    if (!captchaLoading.value) {
      getCaptcha()
    }
  }

  // 验证表单
  const validateForm = () => {
    let isValid = true

    // 重置错误信息
    Object.keys(errors).forEach(key => {
      errors[key] = ''
    })

    // 验证用户名
    if (!formData.username.trim()) {
      errors.username = '用户名不能为空'
      isValid = false
    } else if (formData.username.length < 3) {
      errors.username = '用户名至少3个字符'
      isValid = false
    }

    // 验证昵称
    if (!formData.nickname.trim()) {
      errors.nickname = '昵称不能为空'
      isValid = false
    } else if (formData.nickname.length < 2) {
      errors.nickname = '昵称至少2个字符'
      isValid = false
    }

    // 验证邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      errors.email = '邮箱不能为空'
      isValid = false
    } else if (!emailRegex.test(formData.email)) {
      errors.email = '请输入有效的邮箱地址'
      isValid = false
    }

    // 验证密码
    if (!formData.password) {
      errors.password = '密码不能为空'
      isValid = false
    } else if (formData.password.length < 6) {
      errors.password = '密码至少6个字符'
      isValid = false
    }

    // 验证确认密码
    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认密码'
      isValid = false
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
      isValid = false
    }

    // 验证验证码
    if (!formData.captchaText.trim()) {
      errors.captchaText = '请输入验证码'
      isValid = false
    } else if (formData.captchaText.length !== 4) {
      errors.captchaText = '验证码为4位字符'
      isValid = false
    }

    // 验证用户协议
    if (!formData.agreeTerms) {
      $warning('请先同意用户协议和隐私政策')
      isValid = false
    }

    return isValid
  }

  // 处理注册
  const handleRegister = async () => {
    if (!validateForm()) {
      return
    }

    if (!captchaKey.value) {
      $warning('请先获取验证码')
      return
    }

    loading.value = true

    try {
      const response = await $http('/api/auth/sign_up', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username,
          nickname: formData.nickname,
          email: formData.email,
          password: formData.password,
          captchaKey: captchaKey.value,
          captchaText: formData.captchaText,
        }),
      })

      if (response.status) {
        $success('注册成功！')
        // 保存用户信息到本地存储
        localStorage.setItem('token', response.data.token || '')
        router.push('/home')
      } else {
        // 如果验证码错误，自动刷新验证码
        if (response.message && response.message.includes('验证码')) {
          getCaptcha()
          formData.captchaText = ''
        }
      }
    } catch (error) {
      console.error('注册错误:', error)
      // 网络错误或其他异常情况，request.js 已经处理了，这里不需要重复显示
    } finally {
      loading.value = false
    }
  }

  const goToLogin = () => {
    router.push('/login')
  }

  const showTerms = () => {
    $confirm(
      '用户协议内容将在这里显示。\n\n您是否同意本协议的所有条款？',
      '用户协议',
      {
        confirmButtonText: '同意',
        cancelButtonText: '不同意',
        type: 'info',
      }
    )
      .then(() => {
        formData.agreeTerms = true
        $success('已同意用户协议')
      })
      .catch(() => {
        formData.agreeTerms = false
        $info('您需要同意用户协议才能继续注册')
      })
  }

  const showPrivacy = () => {
    $confirm(
      '隐私政策内容将在这里显示。\n\n您是否同意本隐私政策？',
      '隐私政策',
      {
        confirmButtonText: '同意',
        cancelButtonText: '不同意',
        type: 'info',
      }
    )
      .then(() => {
        formData.agreeTerms = true
        $success('已同意隐私政策')
      })
      .catch(() => {
        formData.agreeTerms = false
        $info('您需要同意隐私政策才能继续注册')
      })
  }

  // 页面加载时获取验证码
  onMounted(() => {
    getCaptcha()
  })
</script>

<style scoped lang="scss">
  .register-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }

  .register-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 40px;
    width: 100%;
    max-width: 400px;
  }

  .register-header {
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

  .register-form {
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
      input[type='email'],
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

  // 验证码样式
  .captcha-container {
    display: flex;
    gap: 12px;
    align-items: flex-start;

    input[type='text'] {
      flex: 1;
    }

    .captcha-display {
      width: 100px;
      height: 44px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f8f9fa;

      &:hover {
        border-color: #667eea;
        background: #f0f2ff;
      }

      .captcha-svg {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
          max-width: 100%;
          max-height: 100%;
        }
      }

      .captcha-loading {
        font-size: 12px;
        color: #666;
        text-align: center;
        padding: 0 8px;
        line-height: 1.2;
      }
    }
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

    a {
      color: #667eea;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .register-btn {
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

  .login-link {
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
