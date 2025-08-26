<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h2>用户注册</h2>
        <p>欢迎加入Lafin的博客</p>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入用户名"
            clearable
            size="large"
          />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="formData.nickname"
            placeholder="请输入昵称"
            clearable
            size="large"
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="请输入邮箱"
            clearable
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
            clearable
            size="large"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            clearable
            size="large"
          />
        </el-form-item>

        <!-- 验证码区域 -->
        <el-form-item label="验证码" prop="captchaText">
          <div class="captcha-container">
            <el-input
              v-model="formData.captchaText"
              placeholder="请输入验证码"
              maxlength="4"
              clearable
              size="large"
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
        </el-form-item>

        <el-form-item prop="agreeTerms">
          <el-checkbox v-model="formData.agreeTerms">
            我已阅读并同意
            <el-link type="primary" @click="showTerms">用户协议</el-link> 和
            <el-link type="primary" @click="showPrivacy">隐私政策</el-link>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleRegister"
            size="large"
            class="register-button"
          >
            {{ loading ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-link">
        已有账号？ <el-link type="primary" @click="goToLogin">立即登录</el-link>
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
  const formRef = ref()
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

  // 表单验证规则
  const rules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, message: '用户名至少3个字符', trigger: 'blur' },
    ],
    nickname: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, message: '昵称至少2个字符', trigger: 'blur' },
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码至少6个字符', trigger: 'blur' },
    ],
    confirmPassword: [
      { required: true, message: '请确认密码', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (value !== formData.password) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur',
      },
    ],
    captchaText: [
      { required: true, message: '请输入验证码', trigger: 'blur' },
      { len: 4, message: '验证码为4位字符', trigger: 'blur' },
    ],
    agreeTerms: [
      {
        validator: (rule, value, callback) => {
          if (!value) {
            callback(new Error('请先同意用户协议和隐私政策'))
          } else {
            callback()
          }
        },
        trigger: 'change',
      },
    ],
  }

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

  // 处理注册
  const handleRegister = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
    } catch (error) {
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
        $warning('您需要同意用户协议才能继续注册')
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
        $warning('您需要同意隐私政策才能继续注册')
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
    border-radius: 20px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    padding: 50px;
    width: 100%;
    max-width: 520px;
    backdrop-filter: blur(10px);
  }

  .register-header {
    text-align: center;
    margin-bottom: 40px;

    h2 {
      color: #2c3e50;
      margin: 0 0 12px 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    p {
      color: #7f8c8d;
      margin: 0;
      font-size: 16px;
      font-weight: 400;
    }
  }

  .register-form {
    :deep(.el-form-item) {
      margin-bottom: 24px;

      .el-form-item__label {
        font-weight: 600;
        color: #2c3e50;
        font-size: 15px;
        line-height: 1.4;
        white-space: nowrap;
        padding-right: 12px;
        display: flex;
        align-items: center;
        height: 50px;
      }

      .el-input {
        .el-input__wrapper {
          border-radius: 12px;
          border: 2px solid #e8f0fe;
          background: #fafbfc;
          transition: all 0.3s ease;
          box-shadow: none;
          padding: 0 16px;
          height: 50px;

          &:hover {
            border-color: #cbd5e0;
            background: #ffffff;
          }

          &.is-focus {
            border-color: #667eea;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
        }

        .el-input__inner {
          font-size: 15px;
          color: #2c3e50;
          height: 48px;

          &::placeholder {
            color: #a0aec0;
            font-weight: 400;
          }
        }

        .el-input__suffix {
          .el-input__clear,
          .el-input__password {
            color: #a0aec0;
            font-size: 16px;
            transition: color 0.3s ease;

            &:hover {
              color: #667eea;
            }
          }
        }
      }

      .el-checkbox {
        .el-checkbox__label {
          color: #5a6c7d;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.5;

          .el-link {
            font-weight: 600;
            margin: 0 2px;
          }
        }

        .el-checkbox__input.is-checked .el-checkbox__inner {
          background-color: #667eea;
          border-color: #667eea;
        }
      }
    }

    // 验证码样式
    .captcha-container {
      display: flex;
      gap: 12px;
      align-items: flex-start;

      .el-input {
        flex: 1;
      }

      .captcha-display {
        width: 120px;
        height: 50px;
        border: 2px solid #e8f0fe;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: #fafbfc;

        &:hover {
          border-color: #667eea;
          background: #f0f2ff;
          transform: translateY(-1px);
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
          color: #7f8c8d;
          text-align: center;
          padding: 0 8px;
          line-height: 1.2;
          font-weight: 500;
        }
      }
    }

    .register-button {
      width: 100%;
      height: 52px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      transition: all 0.3s ease;
      margin-top: 8px;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .login-link {
    text-align: center;
    margin-top: 30px;
    font-size: 15px;
    color: #5a6c7d;

    .el-link {
      font-weight: 600;
      margin-left: 4px;
    }
  }

  // 响应式设计
  @media (max-width: 480px) {
    .register-card {
      padding: 30px 25px;
      margin: 10px;
    }

    .register-form {
      :deep(.el-form-item__label) {
        font-size: 14px;
      }

      .el-input .el-input__wrapper {
        height: 46px;
      }

      .el-input .el-input__inner {
        height: 44px;
        font-size: 14px;
      }

      .captcha-container .captcha-display {
        width: 100px;
        height: 46px;
      }
    }
  }
</style>
