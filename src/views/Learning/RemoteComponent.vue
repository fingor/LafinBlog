<template>
  <div>
    <h1>Remote Component</h1>
    <div v-if="remoteComponent">
      <component :mes="mes" :is="remoteComponent"></component>
    </div>
    <div v-else>Loading...</div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  // import('http://localhost:8000/index-BX2OPnq8.js').then(res => {
  //   eval(res)
  // })
  const remoteComponent = ref(null)
  const mes = ref('Hello')
  import('http://localhost:8000/remotecomponent.js').then(res => {
    // 设置css样式
    document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="http://localhost:8000/remotecomponent.css">`)
    // 动态加载远程组件
    remoteComponent.value = res.remote1
  })
  setTimeout(() => {
    mes.value = 'Hello World'
  }, 2000)
</script>
