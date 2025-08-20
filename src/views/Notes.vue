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
        <el-tree
          :data="treeData"
          :props="treeProps"
          node-key="id"
          :default-expand-all="false"
          :default-expanded-keys="Array.from(expandedKeys)"
          :expand-on-click-node="false"
          :highlight-current="true"
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
  import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
  import {
    Document,
    Plus,
    Folder,
    Edit,
    Delete,
    MoreFilled,
  } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    getNotesData,
    addNoteItem,
    renameNoteItem,
    deleteNoteItem,
    updateExpandStatus,
  } from '@/api/notesApi'

  // 响应式数据
  const selectedItem = ref('')
  const treeData = ref([])
  const loading = ref(false)
  const addDialogVisible = ref(false)
  const expandedKeys = ref(new Set())
  const renameDialogVisible = ref(false)
  const renameForm = reactive({ id: null, title: '' })
  const renameInputRef = ref(null)

  // 树组件配置
  const treeProps = { children: 'children', label: 'title' }

  const addMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  })

  const addForm = reactive({
    type: 'folder',
    title: '',
    parentId: '',
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

  const findItemById = id => findInTree(treeData.value, item => item.id === id)

  // 事件处理方法
  const handleNodeClick = data => {
    if (data.type === 'document') {
      selectedItem.value = data.id
      ElMessage.success(`选中文档: ${data.title}`)
    }
  }

  const handleNodeExpand = async data => {
    try {
      data.expanded = true
      expandedKeys.value.add(data.id)
      const response = await updateExpandStatus({ id: data.id, expanded: true })
      if (response.code !== 200) {
        data.expanded = false
        expandedKeys.value.delete(data.id)
        ElMessage.error(response.message || '展开失败')
      }
    } catch (error) {
      data.expanded = false
      expandedKeys.value.delete(data.id)
      ElMessage.error('展开失败')
    }
  }

  const handleNodeCollapse = async data => {
    try {
      data.expanded = false
      expandedKeys.value.delete(data.id)
      const response = await updateExpandStatus({
        id: data.id,
        expanded: false,
      })
      if (response.code !== 200) {
        data.expanded = true
        expandedKeys.value.add(data.id)
        ElMessage.error(response.message || '收起失败')
      }
    } catch (error) {
      data.expanded = true
      expandedKeys.value.add(data.id)
      ElMessage.error('收起失败')
    }
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
    const defaultName = type === 'folder' ? '新建文件夹' : '新建文档'
    try {
      const response = await addNoteItem({
        title: defaultName,
        type,
        parentId: parentItem?.id || null,
      })
      if (response.code === 200) {
        await loadNotesData()
        ElMessage.success(`添加${type === 'folder' ? '文件夹' : '文档'}成功`)
      } else {
        ElMessage.error(response.message || '添加失败')
      }
    } catch (error) {
      ElMessage.error('添加失败')
    }
    addMenu.visible = false
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
        if (item.type === 'folder') folders.push(item)
        if (item.children?.length) traverse(item.children)
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

  const handleDelete = async item => {
    try {
      await ElMessageBox.confirm(
        `确定要删除"${item.title}"吗？此操作不可恢复！`,
        '警告',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
      const response = await deleteNoteItem(item.id)
      if (response.code === 200) {
        ElMessage.success('删除成功')
        await loadNotesData()
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    } catch (error) {
      if (error !== 'cancel') ElMessage.error('删除失败')
    }
  }

  // 重命名相关方法
  const startRename = item => {
    renameForm.id = item.id
    renameForm.title = item.title
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
    const currentItem = findItemById(renameForm.id)
    if (!currentItem) return

    try {
      const response = await renameNoteItem({
        id: renameForm.id,
        title: renameForm.title,
      })
      if (response.code === 200) {
        currentItem.title = renameForm.title
        ElMessage.success('重命名成功')
      } else {
        ElMessage.error(response.message || '重命名失败')
      }
    } catch (error) {
      ElMessage.error('重命名失败')
    }
    cancelRename()
  }

  const cancelRename = () => {
    renameDialogVisible.value = false
    renameForm.title = ''
    renameForm.id = null
  }

  const loadNotesData = async () => {
    loading.value = true
    try {
      const response = await getNotesData()
      if (response.code === 200) {
        const currentExpandedKeys = new Set(expandedKeys.value)
        treeData.value = response.data
        nextTick(() => {
          expandedKeys.value = currentExpandedKeys
        })
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
    document.addEventListener('click', () => (addMenu.visible = false))
    await loadNotesData()

    // 初始化展开状态
    const initExpandedState = data => {
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.expanded) expandedKeys.value.add(item.id)
          if (item.children?.length) initExpandedState(item.children)
        })
      }
    }
    setTimeout(() => initExpandedState(treeData.value), 100)
  })

  onUnmounted(() => {
    document.removeEventListener('click', () => (addMenu.visible = false))
  })
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
