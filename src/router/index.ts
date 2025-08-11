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
})

export default router
