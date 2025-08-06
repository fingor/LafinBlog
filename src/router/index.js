import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue"; // 手动导入组件
const routes = [
  {
    path: "/",
    redirect: "/home", // 重定向到首页
  },
  {
    path: "/home",
    name: "Home",
    component: Home,
  },
  {
    path: "/notes",
    name: "Notes",
    component: () => import("../views/Notes.vue"), // 笔记
  },
  {
    path: "/learning",
    name: "Learning",
    component: () => import("../views/Learning/index.vue"), // 学习
    children: [
      {
        path: "",
        // 默认进入nodejs子路由
        redirect: "/learning/nodejs", // 修改这里，重定向到完整的子路由路径
      },
      {
        path: "nodejs",
        name: "NodeJS",
        // component: () => import("../views/Learning/Nodejs.vue"),
        component: () => import("../views/Learning/node/index.vue"),
      },
      {
        path: "react-native",
        name: "ReactNative",
        component: () => import("../views/Learning/ReactNative.vue"),
      },
      {
        path: "webworker",
        name: "Webworker",
        component: () => import("../views/Learning/WebWorker.vue"),
      },
      {
        path: "bigFileUpload",
        name: "bigFileUpload",
        component: () => import("../views/Learning/BigFileUpload.vue"),
      },
      {
        path: "chatAI",
        name: "ChatAI",
        component: () => import("../views/Learning/chatAI.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 历史模式
  routes,
});

export default router;
