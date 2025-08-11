<template>
  <div>
    <h1>TypeScript Demo</h1>
    <tsComp name="张三" :age="18" />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { z } from 'zod'
  import { getLists } from '@/api/getLists.ts'
  import tsComp from './tsComp.vue'

  // 定义 Schema 和类型
  const UserSchema = z.object({
    name: z.string(),
    age: z.number(),
    gender: z.string(),
  })

  type User = z.infer<typeof UserSchema>
  // 编译时类型检查
  const user = ref<User>({
    name: '张三',
    age: '25',
    gender: '男',
  })

  const wrongUser: User = {
    name: '王五',
    age: '30', // 错误：应该是 number，不是 string
    gender: '男',
  }
  console.log(wrongUser.email) // 错误：User 类型没有 email 属性

  onMounted(() => {
    // const res = await fetch('/ts/user', { method: 'POST' })
    // const data = await res.json()
    // const user = UserSchema.parse(data)
    // console.log('user', user)
    // 获取列表
    // const lists = getLists()
    // const lists = getLists({ page: 1, pageSize: 10 })
    // console.log('lists', lists)
  })
</script>
