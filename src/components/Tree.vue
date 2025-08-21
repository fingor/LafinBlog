<template>
  <div class="tree-container">
    <!-- 顶部导航栏 -->
    <div class="tree-header">
      <div class="header-left">
        <el-icon class="book-icon"><Document /></el-icon>
        <span class="title">{{ title || '笔记' }}</span>
      </div>
      <div class="header-right">
        <el-button type="primary" class="add-btn" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
    </div>
    <!-- 侧边栏 -->
    <div
      class="tree-sidebar"
      v-loading="loading"
      element-loading-text="加载中..."
    >
      <div class="sidebar-content">
        <el-tree
          v-bind="$attrs"
          node-key="id"
          :default-expand-all="false"
          :default-expanded-keys="Array.from(expandedKeys)"
          :expand-on-click-node="false"
          :highlight-current="true"
          ref="treeRef"
          @node-click="handleNodeClick"
          @node-expand="handleNodeExpand"
          @node-collapse="handleNodeCollapse"
        >
          <template #default="{ node, data }">
            <div class="custom-tree-node">
              <div class="node-content">
                <el-icon class="node-icon">
                  <Folder v-if="data.type === 'folder'" />
                  <Document v-else />
                </el-icon>
                <span class="node-label">{{ data.title }}</span>
              </div>
              <div class="node-actions">
                <el-button
                  v-if="data.type === 'folder'"
                  type="primary"
                  link
                  size="small"
                  @click.stop="showAddMenu($event, data)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
                <el-dropdown trigger="click" @command="handleCommand">
                  <el-button type="primary" link size="small" @click.stop>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="{ type: 'rename', data }">
                        <el-icon><Edit /></el-icon>
                        重命名
                      </el-dropdown-item>
                      <el-dropdown-item
                        :command="{ type: 'delete', data }"
                        divided
                        class="danger-item"
                      >
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </div>
    <!-- 添加菜单 -->
    <div
      v-if="addMenu.visible"
      class="context-menu"
      :style="{ left: addMenu.x + 'px', top: addMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="handleQuickAdd('folder', addMenu.item)">
        <el-icon><Folder /></el-icon>
        <span>新建文件夹</span>
      </div>
      <div class="menu-item" @click="handleQuickAdd('document', addMenu.item)">
        <el-icon><Document /></el-icon>
        <span>新建文档</span>
      </div>
    </div>
    <!-- 添加对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加新项目" width="400px">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="addForm.type">
            <el-radio label="folder">文件夹</el-radio>
            <el-radio label="document">文档</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="addForm.title" placeholder="请输入名称"></el-input>
        </el-form-item>
        <el-form-item label="父级">
          <el-select
            v-model="addForm.parentId"
            placeholder="请选择父级目录"
            clearable
          >
            <el-option label="根目录" value="root"></el-option>
            <el-option
              v-for="item in getAllFolders()"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAdd">确定</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 快速添加对话框 -->
    <el-dialog v-model="quickAddDialogVisible" title="新建项目" width="400px">
      <el-form :model="quickAddForm" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="quickAddForm.type" disabled>
            <el-radio label="folder">文件夹</el-radio>
            <el-radio label="document">文档</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称">
          <el-input
            v-model="quickAddForm.title"
            placeholder="请输入名称"
            @keyup.enter="handleQuickAddConfirm"
            ref="quickAddInputRef"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelQuickAdd">取消</el-button>
          <el-button type="primary" @click="handleQuickAddConfirm"
            >确定</el-button
          >
        </span>
      </template>
    </el-dialog>
    <!-- 重命名对话框 -->
    <el-dialog v-model="renameDialogVisible" title="重命名" width="400px">
      <el-form :model="renameForm" label-width="80px">
        <el-form-item label="名称">
          <el-input
            v-model="renameForm.title"
            placeholder="请输入新名称"
            @keyup.enter="handleRename"
            ref="renameInputRef"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelRename">取消</el-button>
          <el-button type="primary" @click="handleRename">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import {
    ref,
    reactive,
    onMounted,
    onUnmounted,
    nextTick,
    useAttrs,
  } from 'vue'
  import {
    Document,
    Plus,
    Folder,
    Edit,
    Delete,
    MoreFilled,
  } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'

  // 获取所有传递给组件的属性
  const attrs = useAttrs()

  // 定义props - 只保留必要的props
  const props = defineProps({
    // 加载状态
    loading: {
      type: Boolean,
      default: false,
    },
    // 标题
    title: {
      type: String,
      default: '笔记',
    },
  })

  // 定义emits
  const emit = defineEmits([
    'node-click',
    'node-expand',
    'node-collapse',
    'add-item',
    'rename-item',
    'delete-item',
    'quick-add',
  ])

  // 响应式数据
  const addDialogVisible = ref(false)
  const renameDialogVisible = ref(false)
  const quickAddDialogVisible = ref(false)
  const renameForm = reactive({ id: null, title: '', type: '' })
  const quickAddForm = reactive({ type: 'folder', title: '', parentId: null })
  const renameInputRef = ref(null)
  const quickAddInputRef = ref(null)
  const expandedKeys = ref(new Set())
  const treeRef = ref(null)

  const addMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  })

  const addForm = reactive({
    type: 'folder',
    title: '',
    parentId: 'root', // 默认选择根目录
  })

  // 工具方法
  const findInTree = (items, predicate) => {
    for (const item of items) {
      if (predicate(item)) return item
      if (item.children?.length) {
        const found = findInTree(item.children, predicate)
        if (found) return found
      }
    }
    return null
  }

  const findItemById = id =>
    findInTree(attrs.data || [], item => item.id === id)

  // 事件处理方法
  const handleNodeClick = (data, node) => {
    // 转发事件给父组件
    emit('node-click', { data, node })
  }

  const handleNodeExpand = data => {
    expandedKeys.value.add(data.id)
    emit('node-expand', data)
  }

  const handleNodeCollapse = data => {
    expandedKeys.value.delete(data.id)
    emit('node-collapse', data)
  }

  const showAddMenu = (event, item) => {
    addMenu.visible = true
    addMenu.x = event.clientX
    addMenu.y = event.clientY
    addMenu.item = item
  }

  const handleCommand = ({ type, data }) => {
    switch (type) {
      case 'rename':
        startRename(data)
        break
      case 'delete':
        handleDelete(data)
        break
    }
  }

  const handleQuickAdd = async (type, parentItem) => {
    // 显示快速添加对话框
    quickAddForm.type = type
    quickAddForm.title = ''
    quickAddForm.parentId = parentItem?.id || null
    quickAddDialogVisible.value = true
    addMenu.visible = false

    // 聚焦到输入框
    nextTick(() => {
      if (quickAddInputRef.value) {
        quickAddInputRef.value.focus()
      }
    })
  }

  const handleQuickAddConfirm = async () => {
    if (!quickAddForm.title.trim()) {
      ElMessage.warning('请输入名称')
      return
    }

    emit('quick-add', {
      title: quickAddForm.title,
      type: quickAddForm.type,
      parentId: quickAddForm.parentId,
    })

    cancelQuickAdd()
  }

  const cancelQuickAdd = () => {
    quickAddDialogVisible.value = false
    quickAddForm.title = ''
    quickAddForm.type = 'folder'
    quickAddForm.parentId = null
  }

  const showAddDialog = () => {
    addForm.type = 'folder'
    addForm.title = ''
    addForm.parentId = 'root' // 默认选择根目录
    addDialogVisible.value = true
  }

  const getAllFolders = () => {
    const folders = []
    const traverse = items => {
      items.forEach(item => {
        if (item.type === 'folder') folders.push(item)
        if (item.children?.length) traverse(item.children)
      })
    }
    traverse(attrs.data || [])
    return folders
  }

  const handleAdd = async () => {
    if (!addForm.title.trim()) {
      ElMessage.warning('请输入名称')
      return
    }
    emit('add-item', {
      title: addForm.title,
      type: addForm.type,
      parentId: addForm.parentId === 'root' ? '' : addForm.parentId, // 如果是 root，则传递空字符串
    })
    addDialogVisible.value = false
  }

  const handleDelete = async item => {
    try {
      await ElMessageBox.confirm(
        `确定要删除"${item.title}"吗？此操作不可恢复！`,
        '警告',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
      emit('delete-item', item)
    } catch (error) {
      // 用户取消删除
    }
  }

  // 重命名相关方法
  const startRename = item => {
    renameForm.id = item.id
    renameForm.title = item.title
    renameForm.type = item.type // 添加类型信息
    renameDialogVisible.value = true
    nextTick(() => {
      if (renameInputRef.value) {
        renameInputRef.value.focus()
        renameInputRef.value.select()
      }
    })
  }

  const handleRename = async () => {
    if (!renameForm.title.trim()) {
      ElMessage.warning('请输入新名称')
      return
    }
    emit('rename-item', {
      id: renameForm.id,
      title: renameForm.title,
      type: renameForm.type, // 传递类型信息
    })
    cancelRename()
  }

  const cancelRename = () => {
    renameDialogVisible.value = false
    renameForm.title = ''
    renameForm.id = null
    renameForm.type = ''
  }

  // 更新展开状态的方法
  const updateExpandedKeys = newExpandedKeys => {
    expandedKeys.value = new Set(newExpandedKeys)
    // 强制更新树组件的展开状态
    if (treeRef.value) {
      nextTick(() => {
        // 先折叠所有节点
        treeRef.value.collapseAll()
        // 然后展开指定的节点
        newExpandedKeys.forEach(key => {
          const node = treeRef.value.getNode(key)
          if (node) {
            node.expand()
          }
        })
      })
    }
  }

  // 暴露方法给父组件
  defineExpose({
    updateExpandedKeys,
  })

  // 生命周期
  onMounted(() => {
    document.addEventListener('click', () => (addMenu.visible = false))
  })

  onUnmounted(() => {
    document.removeEventListener('click', () => (addMenu.visible = false))
  })
</script>

<style scoped lang="scss">
  .tree-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    width: 300px;
    border-right: 1px solid #e4e7ed;
    user-select: none;
  }

  .tree-header {
    height: 56px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .book-icon {
        font-size: 20px;
        color: #409eff;
      }

      .title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .add-btn {
        border-radius: 6px;
        padding: 8px 16px;
      }
    }
  }

  .tree-sidebar {
    flex: 1;
    background: #fff;
    overflow: hidden;

    .sidebar-content {
      height: 100%;
      overflow-y: auto;
      padding: 8px 0;
    }
  }

  .custom-tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    padding: 12px 12px 12px 0;
    width: 100%;
    margin: 6px 0;

    .node-content {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;

      .node-icon {
        font-size: 16px;
        color: #909399;
      }

      .node-label {
        color: #303133;
        font-size: 16px;
      }
    }

    .node-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .node-actions {
      opacity: 1;
    }
  }

  .context-menu {
    position: fixed;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    padding: 6px 0;
    z-index: 9999;
    min-width: 120px;
    backdrop-filter: blur(8px);

    .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      color: #606266;
      border-radius: 4px;
      margin: 0 4px;

      &:hover {
        background: #f5f7fa;
        color: #409eff;
      }

      .el-icon {
        font-size: 14px;
      }
    }
  }

  // 滚动条样式
  .sidebar-content::-webkit-scrollbar {
    width: 4px;
  }

  .sidebar-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar-content::-webkit-scrollbar-thumb {
    background: rgba(144, 147, 153, 0.3);
    border-radius: 2px;
    transition: background 0.2s;
  }

  .sidebar-content::-webkit-scrollbar-thumb:hover {
    background: rgba(144, 147, 153, 0.5);
  }

  // 下拉菜单样式
  :deep(.el-dropdown-menu__item.danger-item) {
    color: #f56c6c;

    &:hover {
      background-color: #fef0f0;
      color: #f56c6c;
    }
  }
</style>
