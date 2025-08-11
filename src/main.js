import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/assets/css/global.css' // 全局公共样式
import { $http } from '@/utils/request.js';
import * as Vue from 'vue';
window.Vue = Vue; // 将 Vue 挂载到 window 对象上，方便全局访问

const app = createApp(App);
app.config.globalProperties.$http = $http;// 将 $http 方法挂载到全局属性上，方便在组件中使用
app.use(router);
app.use(ElementPlus)
app.mount("#app");
