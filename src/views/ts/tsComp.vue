<template>
  <div>
    <h1>TS组件</h1>
    <h2>{{ name }}</h2>
    <h2>{{ age }}</h2>
    <h2>{{ sex }}</h2>
  </div>
</template>

<!-- ts写法 -->
<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      name: string
      age: number
      sex?: string
    }>(),
    {
      sex: '男',
    }
  )
  // 现在可以在 script 中使用 props
  console.log(props.name)
  console.log(props.age)
</script>

<!-- 常规写法 -->
<!-- <script setup>
  defineProps({
    name: String,
    age: {
      type: Number,
      default: 18,
      required: true,
    },
    sex: String,
  })
</script> -->
<style scoped lang="scss"></style>
