<template>
  <div class="notes-container">
    <!-- 顶部导航栏 -->
    <div class="notes-header">
      <div class="header-left">
        <el-icon class="book-icon"><Document /></el-icon>
        <span class="title">笔记</span>
        <el-icon class="lock-icon"><Lock /></el-icon>
      </div>
      <div class="header-right">
        <el-icon class="more-icon" @click="showHeaderMenu">
          <MoreFilled />
        </el-icon>
        <el-button type="primary" class="add-btn" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 侧边栏 -->
    <div class="notes-sidebar">
      <div v-if="loading" class="loading-container">
        <el-loading-component />
      </div>
      <div v-else class="sidebar-content">
        <!-- 递归渲染树形结构 -->
        <div
          v-for="item in treeData"
          :key="item.id"
          class="tree-item"
          :style="{ paddingLeft: item.level * 20 + 'px' }"
          @click="handleItemClick(item, $event)"
          @contextmenu="showContextMenu($event, item)"
        >
          <div
            class="item-content"
            :class="{
              active: selectedItem === item.id && item.type === 'document',
            }"
          >
            <el-icon
              v-if="item.children && item.children.length > 0"
              class="expand-icon"
              @click.stop="handleToggleExpand(item)"
            >
              <ArrowDown v-if="item.expanded" />
              <ArrowRight v-else />
            </el-icon>
            <el-icon v-else class="item-icon">
              <Document v-if="item.type === 'document'" />
              <Folder v-else />
            </el-icon>
            <span class="item-title">{{ item.title }}</span>
            <el-icon
              v-if="item.type === 'folder'"
              class="add-icon"
              @click.stop="showAddMenu($event, item)"
            >
              <Plus />
            </el-icon>
          </div>

          <!-- 递归渲染子项 -->
          <div
            v-if="item.children && item.children.length > 0 && item.expanded"
          >
            <div
              v-for="child in item.children"
              :key="child.id"
              class="tree-item"
              :style="{ paddingLeft: child.level * 20 + 'px' }"
              @click="handleItemClick(child, $event)"
              @contextmenu="showContextMenu($event, child)"
            >
              <div
                class="item-content"
                :class="{
                  active:
                    selectedItem === child.id && child.type === 'document',
                }"
              >
                <el-icon
                  v-if="child.children && child.children.length > 0"
                  class="expand-icon"
                  @click.stop="handleToggleExpand(child)"
                >
                  <ArrowDown v-if="child.expanded" />
                  <ArrowRight v-else />
                </el-icon>
                <el-icon v-else class="item-icon">
                  <Document v-if="child.type === 'document'" />
                  <Folder v-else />
                </el-icon>
                <span class="item-title">{{ child.title }}</span>
                <el-icon
                  v-if="child.type === 'folder'"
                  class="add-icon"
                  @click.stop="showAddMenu($event, child)"
                >
                  <Plus />
                </el-icon>
              </div>

              <!-- 第三层子项 -->
              <div
                v-if="
                  child.children && child.children.length > 0 && child.expanded
                "
              >
                <div
                  v-for="grandChild in child.children"
                  :key="grandChild.id"
                  class="tree-item"
                  :style="{ paddingLeft: grandChild.level * 20 + 'px' }"
                  @click="handleItemClick(grandChild, $event)"
                  @contextmenu="showContextMenu($event, grandChild)"
                >
                  <div
                    class="item-content"
                    :class="{
                      active:
                        selectedItem === grandChild.id &&
                        grandChild.type === 'document',
                    }"
                  >
                    <el-icon
                      v-if="
                        grandChild.children && grandChild.children.length > 0
                      "
                      class="expand-icon"
                      @click.stop="handleToggleExpand(grandChild)"
                    >
                      <ArrowDown v-if="grandChild.expanded" />
                      <ArrowRight v-else />
                    </el-icon>
                    <el-icon v-else class="item-icon">
                      <Document v-if="grandChild.type === 'document'" />
                      <Folder v-else />
                    </el-icon>
                    <span class="item-title">{{ grandChild.title }}</span>
                    <el-icon
                      v-if="grandChild.type === 'folder'"
                      class="add-icon"
                      @click.stop="showAddMenu($event, grandChild)"
                    >
                      <Plus />
                    </el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧菜单 -->
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
      <div class="menu-item" @click="handleMoveOut">
        <el-icon><FolderOpened /></el-icon>
        <span>移出目录</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="handleCopy">
        <el-icon><CopyDocument /></el-icon>
        <span>复制...</span>
      </div>
      <div class="menu-item" @click="handleMove">
        <el-icon><FolderAdd /></el-icon>
        <span>移动...</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>

    <!-- 添加悬浮菜单 -->
    <div
      v-if="addMenu.visible"
      class="add-menu"
      :style="{ left: addMenu.x + 'px', top: addMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="handleQuickAdd('folder')">
        <el-icon><Folder /></el-icon>
        <span>新增目录</span>
      </div>
      <div class="menu-item" @click="handleQuickAdd('document')">
        <el-icon><Document /></el-icon>
        <span>新增文档</span>
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
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRename">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted, onUnmounted } from 'vue'
  import {
    Document,
    Lock,
    Plus,
    MoreFilled,
    ArrowDown,
    ArrowRight,
    Folder,
    Edit,
    FolderOpened,
    CopyDocument,
    FolderAdd,
    Delete,
  } from '@element-plus/icons-vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    getNotesData,
    addNoteItem,
    renameNoteItem,
    deleteNoteItem,
    updateExpandStatus,
    moveNoteItem,
    copyNoteItem,
    getAllFolders as getAllFoldersApi,
  } from '@/api/notesApi'

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
  const renameDialogVisible = ref(false)
  const loading = ref(false)

  const addForm = reactive({
    type: 'folder',
    title: '',
    parentId: '',
  })

  const renameForm = reactive({
    title: '',
  })

  // 数据
  const treeData = ref([])

  // 方法
  const handleItemClick = (item, event) => {
    // 阻止事件冒泡，避免触发父级的事件
    event.stopPropagation()

    if (item.type === 'document') {
      // 只有文档才触发选中
      selectedItem.value = item.id
      console.log('选中文档:', item.id)
    } else {
      // 文件夹只触发展开/收起
      handleToggleExpand(item)
    }
  }

  const handleItemSelect = id => {
    selectedItem.value = id
    console.log('选中文档:', id)
  }

  const handleToggleExpand = async item => {
    try {
      // 直接更新本地状态，避免API调用延迟
      item.expanded = !item.expanded
      console.log('切换展开状态:', item.id, item.expanded)

      // 异步更新服务器状态
      const response = await updateExpandStatus({
        id: item.id,
        expanded: item.expanded,
      })

      if (response.code !== 200) {
        // 如果服务器更新失败，回滚本地状态
        item.expanded = !item.expanded
        ElMessage.error(response.message || '操作失败')
      }
    } catch (error) {
      // 如果API调用失败，回滚本地状态
      item.expanded = !item.expanded
      console.error('更新展开状态失败:', error)
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

  const showAddMenu = (event, item) => {
    addMenu.visible = true
    addMenu.x = event.clientX
    addMenu.y = event.clientY
    addMenu.item = item
  }

  const hideAddMenu = () => {
    addMenu.visible = false
  }

  const handleQuickAdd = async type => {
    if (!addMenu.item) return

    const title = type === 'folder' ? '新建文件夹' : '新建文档'
    const parentId = addMenu.item.id

    try {
      const response = await addNoteItem({
        title,
        type,
        parentId,
      })

      if (response.code === 200) {
        ElMessage.success('添加成功')
        await loadNotesData()
      } else {
        ElMessage.error(response.message || '添加失败')
      }
    } catch (error) {
      console.error('添加失败:', error)
      ElMessage.error('添加失败')
    }

    hideAddMenu()
  }

  const showHeaderMenu = () => {
    // 显示头部菜单，类似截图中的三个点菜单
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
        if (item.children && item.children.length > 0) {
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
      console.error('添加失败:', error)
      ElMessage.error('添加失败')
    }
  }

  const handleRename = () => {
    if (!contextMenu.item) return
    renameForm.title = contextMenu.item.title
    renameDialogVisible.value = true
    hideContextMenu()
  }

  const confirmRename = async () => {
    if (!renameForm.title.trim()) {
      ElMessage.warning('请输入名称')
      return
    }

    if (!contextMenu.item) return

    try {
      const response = await renameNoteItem({
        id: contextMenu.item.id,
        title: renameForm.title,
      })

      if (response.code === 200) {
        contextMenu.item.title = renameForm.title
        renameDialogVisible.value = false
        ElMessage.success('重命名成功')
      } else {
        ElMessage.error(response.message || '重命名失败')
      }
    } catch (error) {
      console.error('重命名失败:', error)
      ElMessage.error('重命名失败')
    }
  }

  const handleMoveOut = async () => {
    if (!contextMenu.item) return

    try {
      const response = await ElMessageBox.confirm(
        '确定要移出目录吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )

      if (response === 'confirm') {
        const moveResponse = await moveNoteItem({
          id: contextMenu.item.id,
          targetParentId: null,
        })

        if (moveResponse.code === 200) {
          ElMessage.success('移出目录成功')
          await loadNotesData()
        } else {
          ElMessage.error(moveResponse.message || '移出失败')
        }
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('移出目录失败:', error)
        ElMessage.error('移出失败')
      }
    }
    hideContextMenu()
  }

  const handleCopy = async () => {
    if (!contextMenu.item) return

    try {
      const response = await copyNoteItem({
        id: contextMenu.item.id,
        targetParentId: null,
      })

      if (response.code === 200) {
        ElMessage.success('复制成功')
        await loadNotesData()
      } else {
        ElMessage.error(response.message || '复制失败')
      }
    } catch (error) {
      console.error('复制失败:', error)
      ElMessage.error('复制失败')
    }
    hideContextMenu()
  }

  const handleMove = () => {
    if (!contextMenu.item) return
    ElMessage.info('移动功能待实现')
    console.log('移动项目:', contextMenu.item)
    hideContextMenu()
  }

  const handleDelete = async () => {
    if (!contextMenu.item) return

    try {
      const response = await ElMessageBox.confirm(
        '确定要删除吗？此操作不可恢复！',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )

      if (response === 'confirm') {
        const deleteResponse = await deleteNoteItem(contextMenu.item.id)

        if (deleteResponse.code === 200) {
          ElMessage.success('删除成功')
          await loadNotesData()
        } else {
          ElMessage.error(deleteResponse.message || '删除失败')
        }
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    }
    hideContextMenu()
  }

  // 加载笔记数据
  const loadNotesData = async () => {
    console.log('加载笔记数据')
    loading.value = true
    try {
      const response = await getNotesData()
      console.log('API响应:', response)
      if (response.code === 200) {
        treeData.value = response.data
        console.log('树形数据:', treeData.value)
      } else {
        ElMessage.error(response.message || '加载失败')
      }
    } catch (error) {
      console.error('加载数据失败:', error)
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
</script>

<style scoped lang="scss">
  .notes-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    width: 300px;
    border-right: 1px solid #e4e7ed;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
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

  .tree-item {
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 4px;
    margin: 1px 8px;

    .item-content {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      min-height: 32px;
      border-radius: 4px;
      position: relative;
      transition: all 0.2s;

      &:hover {
        background: #f5f7fa;

        .add-icon {
          opacity: 1;
        }
      }

      &.active {
        background: #ecf5ff;

        .item-title {
          color: #409eff;
          font-weight: 500;
        }
      }

      .expand-icon {
        font-size: 12px;
        color: #909399;
        transition: all 0.2s;
        cursor: pointer;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          color: #409eff;
          background: rgba(64, 158, 255, 0.1);
          border-radius: 2px;
        }
      }

      .item-icon {
        font-size: 16px;
        color: #909399;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .item-title {
        flex: 1;
        font-size: 14px;
        color: #606266;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.4;
      }

      .add-icon {
        font-size: 14px;
        color: #c0c4cc;
        cursor: pointer;
        padding: 2px;
        border-radius: 2px;
        opacity: 0;
        transition: all 0.2s;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          color: #409eff;
          background: rgba(64, 158, 255, 0.1);
        }
      }
    }
  }

  .context-menu,
  .add-menu {
    position: fixed;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    padding: 6px 0;
    z-index: 9999;
    min-width: 140px;
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

    .menu-divider {
      height: 1px;
      background: #e4e7ed;
      margin: 4px 8px;
    }
  }

  .add-menu {
    min-width: 120px;
    padding: 4px 0;

    .menu-item {
      padding: 6px 12px;
      font-size: 13px;
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
