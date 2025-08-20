<template>
  <div class="notes-container">
    <!-- 顶部导航栏 -->
    <div class="notes-header">
      <div class="header-left">
        <el-icon class="book-icon"><Document /></el-icon>
        <span class="title">笔记</span>
      </div>
      <div class="header-right">
        <el-button type="primary" class="add-btn" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 侧边栏 -->
    <div class="notes-sidebar">
      <div v-if="loading" class="loading-container">
        <el-loading />
      </div>
      <div v-else class="sidebar-content">
        <!-- 递归渲染树结构 -->
        <TreeNode
          v-for="item in treeData"
          :key="item.id"
          :item="item"
          :selected-item="selectedItem"
          :editing-item="editingItem"
          v-model:editing-text="editingText"
          @item-click="handleItemClick"
          @toggle-expand="handleToggleExpand"
          @show-context-menu="showContextMenu"
          @show-add-menu="showAddMenu"
          @save-edit="saveEdit"
          @cancel-edit="cancelEdit"
        />
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="handleRename">
        <el-icon><Edit /></el-icon>
        <span>重命名</span>
      </div>
      <div class="menu-item danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
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
            <el-option label="根目录" value=""></el-option>
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
  </div>
</template>

<script setup>
  import {
    ref,
    reactive,
    onMounted,
    onUnmounted,
    nextTick,
    defineAsyncComponent,
  } from 'vue'
  import {
    Document,
    Lock,
    Plus,
    MoreFilled,
    ArrowDown,
    ArrowRight,
    Folder,
    Edit,
    Delete,
  } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    getNotesData,
    addNoteItem,
    renameNoteItem,
    deleteNoteItem,
    updateExpandStatus,
  } from '@/api/notesApi'

  // 递归组件
  const TreeNode = defineAsyncComponent(() => import('./TreeNode.vue'))

  // 响应式数据
  const selectedItem = ref('')

  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  })

  const addMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  })

  const addDialogVisible = ref(false)
  const loading = ref(false)

  const addForm = reactive({
    type: 'folder',
    title: '',
    parentId: '',
  })

  const treeData = ref([])

  // 内联编辑相关
  const editingItem = ref(null)
  const editingText = ref('')

  // 方法
  const handleItemClick = item => {
    if (item.type === 'document') {
      selectedItem.value = item.id
    } else {
      handleToggleExpand(item)
    }
  }

  const handleToggleExpand = async item => {
    try {
      item.expanded = !item.expanded
      const response = await updateExpandStatus({
        id: item.id,
        expanded: item.expanded,
      })
      if (response.code !== 200) {
        item.expanded = !item.expanded
        ElMessage.error(response.message || '操作失败')
      }
    } catch (error) {
      item.expanded = !item.expanded
      ElMessage.error('操作失败')
    }
  }

  const showContextMenu = (event, item) => {
    contextMenu.visible = true
    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
    contextMenu.item = item
  }

  const hideContextMenu = () => {
    contextMenu.visible = false
  }

  const saveEdit = async () => {
    if (!editingItem.value) return

    // 找到当前编辑的项目
    const currentItem = findItemById(editingItem.value)
    if (!currentItem) return

    // 如果输入为空，使用原名称
    const newTitle = editingText.value.trim() || currentItem.title

    // 无论名称是否变化，都调用API保存
    try {
      const response = await renameNoteItem({
        id: editingItem.value,
        title: newTitle,
      })

      if (response.code === 200) {
        currentItem.title = newTitle
        ElMessage.success('重命名成功')
      } else {
        ElMessage.error(response.message || '重命名失败')
      }
    } catch (error) {
      ElMessage.error('重命名失败')
    }

    cancelEdit()
  }

  const handleQuickAdd = async (type, parentItem) => {
    const defaultName = type === 'folder' ? '新建文件夹' : '新建文档'

    try {
      const response = await addNoteItem({
        title: defaultName,
        type,
        parentId: parentItem ? parentItem.id : null,
      })

      if (response.code === 200) {
        await loadNotesData()
        // 找到新创建的项目并开始编辑
        const newItem = findNewlyCreatedItem(
          parentItem ? parentItem.id : null,
          type,
          defaultName
        )
        if (newItem) {
          startEdit(newItem)
        }
      } else {
        ElMessage.error(response.message || '添加失败')
      }
    } catch (error) {
      ElMessage.error('添加失败')
    }

    // 隐藏添加菜单
    hideAddMenu()
  }

  // 显示添加选项菜单
  const showAddMenu = (event, item) => {
    addMenu.visible = true
    addMenu.x = event.clientX
    addMenu.y = event.clientY
    addMenu.item = item
  }

  const hideAddMenu = () => {
    addMenu.visible = false
  }

  const findNewlyCreatedItem = (parentId, type, title) => {
    const findInTree = items => {
      for (const item of items) {
        // 检查是否是我们要找的项目
        if (item.type === type && item.title === title) {
          // 如果是根级项目，parentId应该为空
          if (!parentId && !item.parentId) {
            return item
          }
          // 如果有父级，检查parentId
          if (parentId && item.parentId === parentId) {
            return item
          }
        }
        if (item.children && item.children.length > 0) {
          const found = findInTree(item.children)
          if (found) return found
        }
      }
      return null
    }
    return findInTree(treeData.value)
  }

  const startEdit = item => {
    editingItem.value = item.id
    editingText.value = item.title
    // 使用 nextTick 确保 DOM 更新后再设置焦点
    nextTick(() => {
      // 查找当前编辑的输入框并设置焦点
      const inputElement = document.querySelector('.inline-edit-input')
      if (inputElement) {
        inputElement.focus()
        inputElement.select()
      }
    })
  }

  const cancelEdit = () => {
    editingItem.value = null
    editingText.value = ''
  }

  const showHeaderMenu = () => {
    ElMessage.info('头部菜单功能待实现')
  }

  const showAddDialog = () => {
    addForm.type = 'folder'
    addForm.title = ''
    addForm.parentId = ''
    addDialogVisible.value = true
  }

  const getAllFolders = () => {
    const folders = []
    const traverse = items => {
      items.forEach(item => {
        if (item.type === 'folder') {
          folders.push(item)
        }
        if (item.children?.length) {
          traverse(item.children)
        }
      })
    }
    traverse(treeData.value)
    return folders
  }

  const handleAdd = async () => {
    if (!addForm.title.trim()) {
      ElMessage.warning('请输入名称')
      return
    }

    try {
      const response = await addNoteItem({
        title: addForm.title,
        type: addForm.type,
        parentId: addForm.parentId,
      })
      if (response.code === 200) {
        addDialogVisible.value = false
        ElMessage.success('添加成功')
        await loadNotesData()
      } else {
        ElMessage.error(response.message || '添加失败')
      }
    } catch (error) {
      ElMessage.error('添加失败')
    }
  }

  const handleRename = () => {
    if (!contextMenu.item) return
    startEdit(contextMenu.item)
    hideContextMenu()
  }

  const handleDelete = async () => {
    if (!contextMenu.item) return

    // 隐藏右键菜单
    hideContextMenu()

    try {
      await ElMessageBox.confirm(
        `确定要删除"${contextMenu.item.title}"吗？此操作不可恢复！`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )

      const response = await deleteNoteItem(contextMenu.item.id)
      if (response.code === 200) {
        ElMessage.success('删除成功')
        await loadNotesData()
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }

  const loadNotesData = async () => {
    loading.value = true
    try {
      const response = await getNotesData()
      if (response.code === 200) {
        treeData.value = response.data
      } else {
        ElMessage.error(response.message || '加载失败')
      }
    } catch (error) {
      ElMessage.error('加载失败')
    } finally {
      loading.value = false
    }
  }

  // 生命周期
  onMounted(async () => {
    document.addEventListener('click', hideContextMenu)
    document.addEventListener('click', hideAddMenu)
    await loadNotesData()
  })

  onUnmounted(() => {
    document.removeEventListener('click', hideContextMenu)
    document.removeEventListener('click', hideAddMenu)
  })

  // 根据ID查找项目
  const findItemById = id => {
    const findInTree = items => {
      for (const item of items) {
        if (item.id === id) {
          return item
        }
        if (item.children && item.children.length > 0) {
          const found = findInTree(item.children)
          if (found) return found
        }
      }
      return null
    }
    return findInTree(treeData.value)
  }
</script>

<style scoped lang="scss">
  .notes-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    width: 300px;
    border-right: 1px solid #e4e7ed;
    user-select: none;
  }

  .notes-header {
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

      .lock-icon {
        font-size: 14px;
        color: #909399;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .more-icon {
        font-size: 18px;
        color: #606266;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
          background: #f5f7fa;
          color: #409eff;
        }
      }

      .add-btn {
        border-radius: 6px;
        padding: 8px 16px;
      }
    }
  }

  .notes-sidebar {
    flex: 1;
    background: #fff;
    overflow: hidden;

    .loading-container {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sidebar-content {
      height: 100%;
      overflow-y: auto;
      padding: 8px 0;
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

      &.danger {
        color: #f56c6c;

        &:hover {
          background: #fef0f0;
          color: #f56c6c;
        }
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
</style>
