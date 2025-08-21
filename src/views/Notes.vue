<template>
  <div class="notes-container">
    <!-- 左侧树组件 -->
    <div class="notes-left">
      <Tree
        ref="treeRef"
        title="笔记管理"
        :loading="loading"
        :data="treeData"
        :props="{ children: 'children', label: 'title' }"
        :default-expand-all="false"
        :default-expanded-keys="Array.from(expandedKeys)"
        :expand-on-click-node="false"
        :highlight-current="true"
        :check-strictly="true"
        :accordion="false"
        :indent="16"
        :icon-class="'el-icon-arrow-right'"
        @node-click="handleNodeClick"
        @node-expand="handleNodeExpand"
        @node-collapse="handleNodeCollapse"
        @add-item="handleAddItem"
        @rename-item="handleRenameItem"
        @delete-item="handleDeleteItem"
        @quick-add="handleQuickAdd"
      />
    </div>

    <!-- 右侧内容区域 -->
    <div class="notes-right">
      <div class="content-header">
        <h2>笔记详情</h2>
      </div>
      <div class="content-body">
        <div v-if="selectedNote" class="note-detail">
          <h3>{{ selectedNote.title }}</h3>
          <div v-if="selectedNote.content" class="note-content">
            <div class="content-text">{{ selectedNote.content }}</div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>请选择一个文档查看详情</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import Tree from '@/components/Tree.vue'
  import { useTreeOperations } from '@/hooks/useTreeOperations'
  import {
    getNotesData,
    addNote,
    addFolder,
    deleteNote,
    deleteFolder,
    renameNote,
    renameFolder,
    getNote,
  } from '@/api/notesApi'

  // 响应式数据
  const treeData = ref([])
  const loading = ref(false)
  const selectedNote = ref(null)
  const expandedKeys = ref(new Set())

  // 获取项目在树中的路径
  const getItemPath = targetId => {
    const findPath = (items, targetId, path = []) => {
      for (const item of items) {
        const currentPath = [...path, item.id]
        if (item.id === targetId) {
          return currentPath
        }
        if (item.children && item.children.length > 0) {
          const foundPath = findPath(item.children, targetId, currentPath)
          if (foundPath) {
            return foundPath
          }
        }
      }
      return null
    }
    return findPath(treeData.value, targetId)
  }

  // 加载笔记数据
  const loadNotesData = async () => {
    loading.value = true
    try {
      const response = await getNotesData()
      if (response.status) {
        // 根据API响应结构，数据在 response.data.notesData
        // 需要将扁平数据转换为树形结构
        const flatData = response.data.notesData
        treeData.value = buildTreeFromFlatData(flatData)
      } else {
        ElMessage.error(response.message || '加载失败')
      }
    } catch (error) {
      console.error('加载失败:', error)
      ElMessage.error('加载失败')
    } finally {
      loading.value = false
    }
  }

  // 更新展开状态的函数
  const updateExpandedKeys = newExpandedKeys => {
    expandedKeys.value.clear()
    newExpandedKeys.forEach(id => {
      expandedKeys.value.add(id)
    })
  }

  // 使用树操作组合式函数
  const { treeRef, executeOperation } = useTreeOperations({
    loadData: loadNotesData,
    getItemPath,
    updateExpandedKeys,
    showMessage: (message, type) => ElMessage[type](message),
  })

  // 获取笔记详情
  const getSingleNote = async id => {
    try {
      const response = await getNote(id)
      if (response.status) {
        selectedNote.value = response.data.document
      }
    } catch (error) {
      console.error('获取笔记详情失败:', error)
      ElMessage.error('获取笔记详情失败')
    }
  }

  // 事件处理方法
  const handleNodeClick = ({ data, node }) => {
    if (data.type === 'document') {
      getSingleNote(data.id)
    } else if (data.type === 'folder') {
      // 对于文件夹，点击时切换展开/折叠状态
      if (node.expanded) {
        node.collapse()
      } else {
        node.expand()
      }
    }
  }

  const handleNodeExpand = data => {
    expandedKeys.value.add(data.id)
  }

  const handleNodeCollapse = data => {
    expandedKeys.value.delete(data.id)
  }

  const handleQuickAdd = async ({ type, title, parentId, content }) => {
    const operation = async () => {
      if (type === 'folder') {
        return await addFolder({ title, parentId })
      } else {
        return await addNote({ title, directoryId: parentId, content })
      }
    }

    await executeOperation(
      operation,
      null,
      parentId,
      `添加${type === 'folder' ? '文件夹' : '文档'}成功`,
      '添加失败',
      'add'
    )
  }

  const handleAddItem = async ({ title, type, parentId }) => {
    const operation = async () => {
      if (type === 'folder') {
        return await addFolder({ title, parentId })
      } else {
        return await addNote({ title, directoryId: parentId })
      }
    }
    await executeOperation(
      operation,
      null,
      parentId,
      `添加${type === 'folder' ? '文件夹' : '文档'}成功`,
      '添加失败',
      'add'
    )
  }

  const handleRenameItem = async ({ id, title, type }) => {
    const operation = async () => {
      if (type === 'folder') {
        return await renameFolder({ id, title })
      } else {
        return await renameNote({ id, title })
      }
    }
    await executeOperation(
      operation,
      id,
      null,
      '重命名成功',
      '重命名失败',
      'rename'
    )
  }

  const handleDeleteItem = async item => {
    const operation = async () => {
      if (item.type === 'folder') {
        return await deleteFolder({ id: item.id })
      } else {
        return await deleteNote({ id: item.id })
      }
    }

    await executeOperation(
      operation,
      item.id,
      null,
      '删除成功',
      '删除失败',
      'delete'
    )
  }

  // 将扁平数据转换为树形结构
  const buildTreeFromFlatData = flatData => {
    const itemMap = new Map()
    const roots = []
    // 创建映射
    flatData.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] })
    })
    // 构建树形结构
    flatData.forEach(item => {
      const node = itemMap.get(item.id)
      // 如果pid为空则作为根节点
      if (item.pid === null || item.pid === undefined) {
        roots.push(node)
      } else {
        const parent = itemMap.get(item.pid)
        if (parent) {
          parent.children.push(node)
        } else {
          // 如果找不到父节点，则作为根节点
          roots.push(node)
        }
      }
    })

    // 按 index 排序
    const sortChildren = nodes => {
      nodes.sort((a, b) => (a.index || 0) - (b.index || 0))
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          sortChildren(node.children)
        }
      })
    }
    sortChildren(roots)

    return roots
  }

  // 生命周期
  onMounted(async () => {
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
</script>

<style scoped lang="scss">
  .notes-container {
    height: 100vh;
    display: flex;
    background: #f5f7fa;
  }

  .notes-left {
    flex-shrink: 0;
  }

  .notes-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-left: 1px solid #e4e7ed;
  }

  .content-header {
    height: 56px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    padding: 0 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .content-body {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }

  .note-detail {
    width: 100%;
    h3 {
      margin: 0 0 20px 0;
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }

    .note-info {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;

      p {
        margin: 8px 0;
        color: #606266;
        font-size: 14px;

        strong {
          color: #303133;
          margin-right: 8px;
        }
      }
    }

    .note-content {
      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .content-text {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        font-size: 14px;
        line-height: 1.6;
        color: #606266;
        white-space: pre-wrap;
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      font-size: 16px;
      margin: 0;
    }
  }

  // 滚动条样式
  .content-body::-webkit-scrollbar {
    width: 6px;
  }

  .content-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .content-body::-webkit-scrollbar-thumb {
    background: rgba(144, 147, 153, 0.3);
    border-radius: 3px;
    transition: background 0.2s;
  }

  .content-body::-webkit-scrollbar-thumb:hover {
    background: rgba(144, 147, 153, 0.5);
  }
</style>
