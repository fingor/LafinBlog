import { ElMessage } from 'element-plus'
import { $confirm } from './confirm.js'
import router from '../router/index.ts'

// 简单的防重复执行工具
const throttleMap = new Map()
const throttle = (key, fn, delay = 3000) => {
  if (throttleMap.has(key)) return

  throttleMap.set(key, true)
  setTimeout(() => throttleMap.delete(key), delay)

  fn()
  // return fn()
}

// 清除本地存储的认证信息
const clearAuthData = () => {
  const authKeys = ['token', 'rememberMe', 'rememberedLogin']
  authKeys.forEach(key => localStorage.removeItem(key))
}

// 防抖显示错误信息
const showErrorMessage = res => {
  const errorMessage = res.errors?.[0] || res.message || 'Error'
  throttle('error', () => ElMessage.error(errorMessage))
}

// 处理401响应 - 统一处理所有401状态码
const handle401Response = async res => {
  // 如果已经在处理，直接返回
  if (throttleMap.has('token-expired')) {
    return {
      status: false,
      message: '登录已超时',
      code: 401,
      errorType: res.errorType,
    }
  }

  throttleMap.set('token-expired', true)

  try {
    await $confirm('登录已超时，请重新登录', '登录超时', {
      confirmButtonText: '确定',
      showCancelButton: false,
      type: 'warning',
    })

    // 用户确认后清空缓存并跳转到登录页
    clearAuthData()
    router.push('/login')
  } catch {
    // 用户取消或其他情况，仍然清空缓存并跳转
    clearAuthData()
    router.push('/login')
  }

  setTimeout(() => throttleMap.delete('token-expired'), 1000)

  return {
    status: false,
    message: '登录已超时',
    code: 401,
    errorType: res.errorType,
  }
}

export const $http = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    token: localStorage.getItem('token'),
  }

  try {
    const response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
      return handle401Response(await response.json())
    }

    const res = await response.json()
    if (!res.status) showErrorMessage(res)

    return res
  } catch (error) {
    console.error('请求失败:', error)
    throttle('network', () => ElMessage.error('网络请求失败，请检查网络连接'))
    throw error
  }
}
