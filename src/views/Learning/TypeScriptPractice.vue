<template>
  <div class="typescript-practice">
    <h2>TypeScript 接口练习</h2>
    
    <!-- 用户信息表单 -->
    <div class="user-form">
      <h3>用户信息</h3>
      <input v-model="userInfo.name" placeholder="姓名" />
      <input v-model.number="userInfo.age" placeholder="年龄" type="number" />
      <input v-model="userInfo.email" placeholder="邮箱" />
      <button @click="saveUserInfo">保存用户信息</button>
    </div>

    <!-- 显示用户信息 -->
    <div class="user-display" v-if="userInfo.name">
      <h3>当前用户信息：</h3>
      <p>姓名：{{ userInfo.name }}</p>
      <p>年龄：{{ userInfo.age }}</p>
      <p>邮箱：{{ userInfo.email }}</p>
    </div>

    <!-- 错误提示 -->
    <div class="error" v-if="errorMessage">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 第一步：定义用户信息的接口（使用JSDoc注释来提供类型信息）
/**
 * @typedef {Object} UserInfo
 * @property {string} name - 用户姓名
 * @property {number} age - 用户年龄
 * @property {string} email - 用户邮箱
 */

// 第二步：使用接口定义响应式数据
const userInfo = reactive({
  name: '',
  age: 0,
  email: ''
})

const errorMessage = ref('')

// 第三步：使用接口的函数
const saveUserInfo = () => {
  // 简单的验证
  if (!userInfo.name) {
    errorMessage.value = '请输入姓名'
    return
  }
  
  if (userInfo.age < 0 || userInfo.age > 150) {
    errorMessage.value = '年龄必须在0-150之间'
    return
  }
  
  if (!userInfo.email.includes('@')) {
    errorMessage.value = '请输入有效的邮箱地址'
    return
  }
  
  errorMessage.value = ''
  console.log('用户信息已保存：', userInfo)
}
</script>

<style scoped>
.typescript-practice {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.user-form {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.user-form input {
  display: block;
  width: 100%;
  margin: 10px 0;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.user-form button {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.user-display {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.error {
  color: red;
  margin-top: 10px;
  padding: 10px;
  background: #ffebee;
  border-radius: 4px;
}
</style> 