import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue' // 手动导入组件

const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 历史模式
  routes: [
    {
      path: '/',
      redirect: '/home', // 重定向到首页
    },
    {
      path: '/home',
      name: 'Home',
      component: Home,
      children: [
        {
          path: '',
          name: 'HomeDefault',
          component: () => import('../views/HomeContent.vue'), // 首页内容
        },
        {
          path: '/notes',
          name: 'Notes',
          component: () => import('../views/Notes.vue'), // 笔记
        },
        {
          path: '/learning',
          name: 'Learning',
          component: () => import('../views/Learning/index.vue'), // 学习
          children: [
            {
              path: '',
              name: 'LearningDefault',
              redirect: '/learning/nodejs',
            },
            {
              path: 'nodejs',
              name: 'NodeJS',
              component: () => import('../views/Learning/node/index.vue'),
            },
            {
              path: 'react-native',
              name: 'ReactNative',
              component: () => import('../views/Learning/ReactNative.vue'),
            },
            {
              path: 'webworker',
              name: 'Webworker',
              component: () => import('../views/Learning/WebWorker.vue'),
            },
            {
              path: 'bigFileUpload',
              name: 'bigFileUpload',
              component: () => import('../views/Learning/BigFileUpload.vue'),
            },
            {
              path: 'chatAI',
              name: 'ChatAI',
              component: () => import('../views/Learning/chatAI.vue'),
            },
            {
              path: 'typescript',
              name: 'TypeScript',
              component: () => import('../views/ts/TypeScriptPractice.vue'),
            },
            {
              path: 'remoteComponent',
              name: 'RemoteComponent',
              component: () => import('../views/Learning/RemoteComponent.vue'),
            },
          ],
        },
      ],
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/payment',
      name: 'Payment',
      component: () => import('../views/Payment.vue'),
    },
    {
      path: '/data-analysis',
      name: 'DataAnalysis',
      component: () => import('../views/DataAnalysisQA.vue'),
    },
    {
      path: '/smart-qa',
      name: 'SmartQA',
      component: () => import('../pages/SmartQA.vue'),
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 定义不需要登录就能访问的路由
  const publicRoutes = ['/login', '/register']
  
  // 如果访问的是公开路由，直接放行
  if (publicRoutes.includes(to.path)) {
    next()
    return
  }
  
  // 如果没有token且访问的不是公开路由，重定向到登录页
  if (!token) {
    next('/login')
    return
  }
  
  // 有token，正常访问
  next()
})

export default router
