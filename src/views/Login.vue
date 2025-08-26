<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>用户登录</h2>
        <p>欢迎回到Lafin的博客</p>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名/邮箱" prop="login">
          <el-input
            v-model="formData.login"
            placeholder="请输入用户名或邮箱"
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

        <el-form-item>
          <div class="form-options">
            <el-checkbox v-model="formData.rememberMe"> 记住我 </el-checkbox>
            <el-link type="primary" @click="forgotPassword">
              忘记密码？
            </el-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            size="large"
            class="login-button"
          >
            {{ loading ? '登录中...' : '立即登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-link">
        还没有账号？
        <el-link type="primary" @click="goToRegister">立即注册</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { $http } from '@/utils/request.js'
  import { $success, $error, $warning, $info } from '@/utils/confirm.js'

  const router = useRouter()
  const formRef = ref()
  const loading = ref(false)

  const formData = reactive({
    login: '',
    password: '',
    rememberMe: false,
  })

  // 页面加载时检查是否有保存的登录信息
  const loadRememberedInfo = () => {
    const rememberedLogin = localStorage.getItem('rememberedLogin')
    const rememberMe = localStorage.getItem('rememberMe')

    if (rememberMe === 'true' && rememberedLogin) {
      formData.login = rememberedLogin
      formData.rememberMe = true
    }
  }

  // 组件挂载时加载保存的信息
  onMounted(() => {
    loadRememberedInfo()
  })

  // 表单验证规则
  const rules = {
    login: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  }

  // 处理登录
  const handleLogin = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
    } catch (error) {
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
        localStorage.setItem('token', response.data.token)

        // 处理"记住我"功能
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('rememberedLogin', formData.login) // 保存用户名
        } else {
          // 如果没有勾选"记住我"，清除保存的信息
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('rememberedLogin')
        }

        $success('登录成功！')
        router.push('/home')
      }
    } catch (error) {
      console.error('登录错误:', error)
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
    border-radius: 20px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    padding: 50px;
    width: 100%;
    max-width: 480px;
    backdrop-filter: blur(10px);
  }

  .login-header {
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

  .login-form {
    :deep(.el-form-item) {
      margin-bottom: 28px;

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
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-top: 8px;

      .el-checkbox {
        .el-checkbox__label {
          color: #5a6c7d;
          font-size: 14px;
          font-weight: 500;
        }

        .el-checkbox__input.is-checked .el-checkbox__inner {
          background-color: #667eea;
          border-color: #667eea;
        }
      }

      .el-link {
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .login-button {
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

  .register-link {
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
    .login-card {
      padding: 30px 25px;
      margin: 10px;
    }

    .login-form {
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
    }
  }
</style>
