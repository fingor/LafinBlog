// const baseUrl = "https://api.fingor.cn"; // 可选：统一管理基础URL
// const baseUrl = import.meta.env.VITE_API_BASE_URL;
// const baseUrl = ""; // 开发环境使用空字符串，让请求走代理
// 动态处理 URL（开发环境用相对路径，生产环境用绝对路径）

import { ElMessage } from 'element-plus';
import { $confirm } from './confirm.js';
import router from '../router/index.ts';

// 错误消息管理 - 避免同时显示多条错误信息
let isShowingError = false;

// 统一的错误消息处理函数
const showErrorMessage = (res) => {
  // 如果正在显示错误消息，则跳过
  if (isShowingError) {
    return;
  }

  let errorMessage = 'Error';
  
  // 优先级：1. errors 数组中的第一个错误 2. message 3. 默认错误
  if (res.errors && Array.isArray(res.errors) && res.errors.length > 0) {
    errorMessage = res.errors[0];
  } else if (res.message) {
    errorMessage = res.message;
  }

  // 设置正在显示错误标志
  isShowingError = true;
  
  // 使用 Element Plus 的 ElMessage 显示错误
  ElMessage.error(errorMessage);
  
  // 3秒后重置标志，允许显示新的错误消息
  setTimeout(() => {
    isShowingError = false;
  }, 3000);
};

export const $http = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  // 统一设置请求头
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    token,
    // ...(token && { Authorization: `Bearer ${token}` }), // 有token时自动添加
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // 检查 401 未授权状态
    if (response.status === 401) {
      // 清除本地存储的token
      localStorage.removeItem('token');
      localStorage.removeItem('rememberMe');
      
      // 显示登录超时确认弹窗
      try {
        await $confirm(
          '登录已超时，请重新登录',
          '登录超时',
          {
            confirmButtonText: '确定',
            showCancelButton: false,
            type: 'warning'
          }
        );
        // 用户点击确定后跳转到登录页
        router.push('/login');
      } catch (error) {
        // 用户关闭弹窗也跳转到登录页
        router.push('/login');
      }
      
      // 返回一个标识401的响应对象
      return {
        status: false,
        message: '登录已超时',
        code: 401
      };
    }
    
    const res = await response.json();
    
    // 如果请求失败（status 为 false），统一处理错误消息
    if (!res.status) {
      showErrorMessage(res);
    }
    
    return res;
  } catch (error) {
    console.error("请求失败:", error);
    
    // 网络错误或其他异常情况
    if (!isShowingError) {
      isShowingError = true;
      ElMessage.error('网络请求失败，请检查网络连接');
      setTimeout(() => {
        isShowingError = false;
      }, 3000);
    }
    
    throw error; // 继续抛出错误供业务层处理
  }
};
