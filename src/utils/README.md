# 全局确认弹窗和消息提示工具

## 概述

本项目提供了基于 Element Plus 的全局确认弹窗和消息提示工具，包括 `$confirm`、`$message`、`$success`、`$error`、`$warning`、`$info` 等方法。

## 安装和导入

```javascript
import { $confirm, $message, $success, $error, $warning, $info } from '@/utils/confirm.js'
```

## API 文档

### $confirm(message, title, options)

显示确认弹窗，返回 Promise。

#### 参数

- `message` (string): 弹窗内容
- `title` (string, 可选): 弹窗标题，默认为 "Title"
- `options` (object, 可选): 配置选项

#### options 配置项

- `confirmButtonText` (string): 确认按钮文字，默认为 "OK"
- `cancelButtonText` (string): 取消按钮文字，默认为 "Cancel"
- `type` (string): 弹窗类型，可选值：'warning', 'info', 'success', 'error'，默认为 "warning"
- `showCancelButton` (boolean): 是否显示取消按钮，默认为 true
- `showConfirmButton` (boolean): 是否显示确认按钮，默认为 true

#### 返回值

返回 Promise：
- `resolve`: 用户点击确认按钮
- `reject`: 用户点击取消按钮或关闭弹窗

### 消息提示方法

#### $message(message, type, options)
通用消息提示方法

#### $success(message, options)
成功消息提示

#### $error(message, options)
错误消息提示

#### $warning(message, options)
警告消息提示

#### $info(message, options)
信息消息提示

## 使用示例

### 基础用法

```javascript
// 基础确认弹窗
$confirm('This is a message', 'Title')
  .then(() => {
    console.log('用户点击了确认')
  })
  .catch(() => {
    console.log('用户点击了取消')
  })
```

### 自定义配置

```javascript
// 自定义标题和按钮
$confirm('您确定要删除这条记录吗？', '删除确认', {
  confirmButtonText: '确定删除',
  cancelButtonText: '取消',
  type: 'warning'
})
  .then(() => {
    // 执行删除操作
    $success('删除成功')
  })
  .catch(() => {
    $info('删除已取消')
  })
```

### 危险操作确认

```javascript
// 危险操作确认
$confirm('此操作不可逆，确定要继续吗？', '危险操作', {
  confirmButtonText: '确定执行',
  cancelButtonText: '取消',
  type: 'error'
})
  .then(() => {
    // 执行危险操作
    $success('操作成功')
  })
  .catch(() => {
    $info('操作已取消')
  })
```

### 消息提示

```javascript
// 成功消息
$success('操作成功完成！')

// 错误消息
$error('操作失败，请重试')

// 警告消息
$warning('请注意这个警告信息')

// 信息消息
$info('这是一条信息提示')
```

## 实际应用场景

### 1. 删除确认

```javascript
const handleDelete = (id) => {
  $confirm('删除后数据将无法恢复，确定要删除吗？', '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 调用删除 API
      deleteRecord(id).then(() => {
        $success('删除成功')
        refreshList()
      })
    })
    .catch(() => {
      $info('删除已取消')
    })
}
```

### 2. 保存确认

```javascript
const handleSave = () => {
  $confirm('您有未保存的更改，是否要保存？', '保存确认', {
    confirmButtonText: '保存',
    cancelButtonText: '不保存',
    type: 'info'
  })
    .then(() => {
      // 执行保存操作
      saveData().then(() => {
        $success('数据已保存')
      })
    })
    .catch(() => {
      $warning('数据未保存')
    })
}
```

### 3. 退出登录确认

```javascript
const handleLogout = () => {
  $confirm('确定要退出登录吗？', '退出登录', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      // 执行退出登录
      logout().then(() => {
        $success('已成功退出登录')
        router.push('/login')
      })
    })
    .catch(() => {
      $info('取消退出登录')
    })
}
```

## 注意事项

1. **Promise 处理**: `$confirm` 返回 Promise，记得使用 `.then()` 和 `.catch()` 处理用户操作
2. **错误处理**: 在 `.catch()` 中处理用户取消操作，避免程序报错
3. **用户体验**: 根据操作的危险程度选择合适的 `type` 类型
4. **按钮文字**: 自定义按钮文字时，确保文字简洁明了
5. **消息提示**: 在确认操作完成后，使用相应的消息提示反馈给用户

## 与 Element Plus 的关系

本工具基于 Element Plus 的 `ElMessageBox` 和 `ElMessage` 组件封装，提供了更简洁的 API 和统一的默认配置。如果需要更复杂的配置，可以直接使用 Element Plus 的原生组件。
