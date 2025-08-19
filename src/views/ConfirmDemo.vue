<template>
  <div class="confirm-demo">
    <h2>全局确认弹窗演示</h2>
    
    <div class="demo-section">
      <h3>基础用法</h3>
      <div class="button-group">
        <el-button type="primary" @click="basicConfirm">基础确认弹窗</el-button>
        <el-button type="success" @click="customTitle">自定义标题</el-button>
        <el-button type="warning" @click="customButtons">自定义按钮</el-button>
        <el-button type="danger" @click="dangerConfirm">危险操作确认</el-button>
      </div>
    </div>

    <div class="demo-section">
      <h3>消息提示</h3>
      <div class="button-group">
        <el-button type="success" @click="showSuccess">成功消息</el-button>
        <el-button type="warning" @click="showWarning">警告消息</el-button>
        <el-button type="info" @click="showInfo">信息消息</el-button>
        <el-button type="danger" @click="showError">错误消息</el-button>
      </div>
    </div>

    <div class="demo-section">
      <h3>复杂场景</h3>
      <div class="button-group">
        <el-button @click="deleteConfirm">删除确认</el-button>
        <el-button @click="saveConfirm">保存确认</el-button>
        <el-button @click="logoutConfirm">退出登录确认</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { $confirm, $message, $success, $error, $warning, $info } from '@/utils/confirm.js'

// 基础确认弹窗
const basicConfirm = () => {
  $confirm('This is a message', 'Title')
    .then(() => {
      $success('用户点击了确认')
    })
    .catch(() => {
      $info('用户点击了取消')
    })
}

// 自定义标题
const customTitle = () => {
  $confirm('这是一个自定义标题的确认弹窗', '自定义标题')
    .then(() => {
      $success('确认成功')
    })
    .catch(() => {
      $info('操作已取消')
    })
}

// 自定义按钮
const customButtons = () => {
  $confirm('您确定要执行此操作吗？', '确认操作', {
    confirmButtonText: '确定执行',
    cancelButtonText: '取消操作',
    type: 'warning'
  })
    .then(() => {
      $success('操作已执行')
    })
    .catch(() => {
      $info('操作已取消')
    })
}

// 危险操作确认
const dangerConfirm = () => {
  $confirm('此操作不可逆，确定要继续吗？', '危险操作', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'error'
  })
    .then(() => {
      $success('删除成功')
    })
    .catch(() => {
      $info('删除已取消')
    })
}

// 消息提示演示
const showSuccess = () => {
  $success('操作成功完成！')
}

const showWarning = () => {
  $warning('请注意这个警告信息')
}

const showInfo = () => {
  $info('这是一条信息提示')
}

const showError = () => {
  $error('操作失败，请重试')
}

// 复杂场景演示
const deleteConfirm = () => {
  $confirm(
    '删除后数据将无法恢复，确定要删除这条记录吗？',
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      // 模拟删除操作
      setTimeout(() => {
        $success('记录已成功删除')
      }, 1000)
    })
    .catch(() => {
      $info('删除操作已取消')
    })
}

const saveConfirm = () => {
  $confirm(
    '您有未保存的更改，是否要保存？',
    '保存确认',
    {
      confirmButtonText: '保存',
      cancelButtonText: '不保存',
      type: 'info'
    }
  )
    .then(() => {
      // 模拟保存操作
      setTimeout(() => {
        $success('数据已保存')
      }, 1000)
    })
    .catch(() => {
      $warning('数据未保存')
    })
}

const logoutConfirm = () => {
  $confirm(
    '确定要退出登录吗？退出后需要重新登录。',
    '退出登录',
    {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      $success('已成功退出登录')
      // 这里可以执行退出登录的逻辑
    })
    .catch(() => {
      $info('取消退出登录')
    })
}
</script>

<style scoped lang="scss">
.confirm-demo {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;

  h2 {
    color: #333;
    margin-bottom: 30px;
    text-align: center;
  }

  .demo-section {
    margin-bottom: 40px;
    padding: 20px;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    background: #f8f9fa;

    h3 {
      color: #333;
      margin-bottom: 20px;
      font-size: 18px;
    }

    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .el-button {
        margin: 0;
      }
    }
  }
}
</style>
