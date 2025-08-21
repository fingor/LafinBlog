# 树操作组合式函数使用说明

## useTreeOperations

这是一个通用的树操作组合式函数，用于在树形结构中进行增删改操作时保持展开状态。

### 功能特性

- 自动记录操作项的路径
- 操作后重新加载数据
- 保持操作项的父级目录展开状态
- 自动折叠其他节点
- 统一的消息提示处理

### 使用方法

```javascript
import { useTreeOperations } from '@/hooks/useTreeOperations'
import { ElMessage } from 'element-plus'

// 在组件中使用
const { treeRef, executeOperation } = useTreeOperations({
  loadData: loadTreeData,           // 加载数据的函数
  getItemPath: getItemPath,         // 获取项目路径的函数
  updateExpandedKeys: updateKeys,   // 更新展开状态的函数
  showMessage: (message, type) => ElMessage[type](message) // 消息提示函数
})
```

### 配置选项

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| loadData | Function | 是 | 加载数据的异步函数 |
| getItemPath | Function | 是 | 获取项目在树中路径的函数 |
| updateExpandedKeys | Function | 是 | 更新展开状态的函数 |
| showMessage | Function | 否 | 消息提示函数，默认使用 console.log |

### 核心方法

#### executeOperation(operation, itemId, parentId, successMessage, errorMessage)

执行树操作并自动处理状态管理。

**参数：**
- `operation`: 要执行的操作函数（返回 Promise）
- `itemId`: 操作项的ID（用于记录路径）
- `parentId`: 父级ID（用于记录路径）
- `successMessage`: 成功消息
- `errorMessage`: 错误消息

**示例：**

```javascript
// 添加操作
const handleAdd = async ({ title, parentId }) => {
  await executeOperation(
    async () => await addItem({ title, parentId }),
    null,
    parentId,
    '添加成功',
    '添加失败'
  )
}

// 删除操作
const handleDelete = async (item) => {
  await executeOperation(
    async () => await deleteItem(item.id),
    item.id,
    null,
    '删除成功',
    '删除失败'
  )
}

// 重命名操作
const handleRename = async ({ id, title }) => {
  await executeOperation(
    async () => await renameItem({ id, title }),
    id,
    null,
    '重命名成功',
    '重命名失败'
  )
}
```

### 完整示例

```vue
<template>
  <Tree ref="treeRef" :data="treeData" />
</template>

<script setup>
import { ref } from 'vue'
import { useTreeOperations } from '@/hooks/useTreeOperations'
import { ElMessage } from 'element-plus'

const treeData = ref([])
const expandedKeys = ref(new Set())

// 获取项目路径
const getItemPath = (targetId) => {
  // 实现获取项目在树中路径的逻辑
}

// 更新展开状态
const updateExpandedKeys = (newExpandedKeys) => {
  expandedKeys.value.clear()
  newExpandedKeys.forEach(id => expandedKeys.value.add(id))
}

// 加载数据
const loadTreeData = async () => {
  // 实现加载数据的逻辑
}

// 使用树操作组合式函数
const { treeRef, executeOperation } = useTreeOperations({
  loadData: loadTreeData,
  getItemPath,
  updateExpandedKeys,
  showMessage: (message, type) => ElMessage[type](message)
})

// 操作方法
const handleAdd = async (data) => {
  await executeOperation(
    async () => await api.add(data),
    null,
    data.parentId,
    '添加成功',
    '添加失败'
  )
}

const handleDelete = async (item) => {
  await executeOperation(
    async () => await api.delete(item.id),
    item.id,
    null,
    '删除成功',
    '删除失败'
  )
}
</script>
```

### 优势

1. **代码复用**: 一次编写，多处使用
2. **状态管理**: 自动处理树展开状态
3. **错误处理**: 统一的错误处理和消息提示
4. **类型安全**: 支持 TypeScript
5. **易于维护**: 逻辑集中，便于维护和测试
