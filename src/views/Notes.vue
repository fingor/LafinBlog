<template>
  <div class="notes-container" data-skin>
    <!-- 左侧树组件 -->
    <div class="notes-left">
      <Tree
        ref="treeRef"
        title="笔记管理"
        :loading="loading"
        :data="treeData"
        :props="{ children: 'children', label: 'title' }"
        :default-expand-all="false"
        :expand-on-click-node="false"
        :highlight-current="true"
        :check-strictly="true"
        :accordion="false"
        :indent="16"
        :icon-class="'el-icon-arrow-right'"
        @node-click="handleNodeClick"
        @add-item="handleAddItem"
        @rename-item="handleRenameItem"
        @delete-item="handleDeleteItem"
        @quick-add="handleQuickAdd"
      />
    </div>

    <!-- 右侧内容区域 -->
    <div class="notes-right" data-skin>
      <div class="content-header">
        <h2 v-if="selectedNote">{{ selectedNote.title }}</h2>
        <h2 v-else>笔记详情</h2>
                 <div v-if="selectedNote" class="header-actions">
            <el-button
              v-if="isEditing"
              @click="cancelEdit"
              size="small"
              type="info"
              plain
            >
              取消
            </el-button>
            <el-button
              :type="isEditing ? 'primary' : 'default'"
              @click="toggleEdit"
              size="small"
            >
              {{ isEditing ? '保存' : '编辑' }}
            </el-button>
          </div>
      </div>
      <el-scrollbar class="content-body">
        <div v-if="selectedNote" class="note-detail">
          <!-- 编辑模式 -->
          <div v-if="isEditing" class="edit-mode">
            <MarkdownEditor
              v-model="editContent"
              mode="wysiwyg"
              :readonly="false"
            />
          </div>
          <!-- 预览模式 -->
          <div v-else class="preview-mode">
            <div ref="previewRef" class="vditor-preview-container"></div>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>请选择一个文档查看详情</p>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, nextTick, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import Vditor from 'vditor'
  import 'vditor/dist/index.css'
  import Tree from '@/components/Tree.vue'
  import MarkdownEditor from '@/components/MarkdownEditor.vue'
  import {
    getNotesData,
    addNote,
    addFolder,
    deleteNote,
    deleteFolder,
    renameNote,
    renameFolder,
    getNote,
    saveNote,
  } from '@/api/notesApi'

  // 响应式数据
  const treeData = ref([])
  const loading = ref(false)
  const selectedNote = ref(null)
  const treeRef = ref(null)
  const previewRef = ref(null)
  const isEditing = ref(false)
  const editContent = ref('')

  // 渲染预览内容
  const renderPreview = () => {
    if (!previewRef.value || !selectedNote.value) return

    // 清空容器
    previewRef.value.innerHTML = ''

    // 如果内容为空，显示空状态
    if (
      !selectedNote.value.content ||
      selectedNote.value.content.trim() === ''
    ) {
      previewRef.value.innerHTML =
        '<div class="empty-content"><p>暂无内容</p></div>'
      return
    }

    // 处理内容，去掉 <span class="ne-text"> 标签，只保留内容
    let processedContent = selectedNote.value.content
    // 使用正则表达式去掉 <span class="ne-text"> 和 </span> 标签
    processedContent = processedContent.replace(/<span class="ne-text">(.*?)<\/span>/g, '$1')
    // 将 <strong> 标签替换为 ** 加粗语法
    processedContent = processedContent.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    // 使用Vditor的预览功能，与编辑模式保持一致的配置
    Vditor.preview(previewRef.value, processedContent, {
      hljs: {
        enable: true,
        lineNumber: true,
        style: 'github',
      },
      theme: {
        current: 'light',
      },
      // 添加更多配置以确保完整显示
      after: () => {
        // 预览渲染完成后的回调
        console.log('预览渲染完成')
      },
    })
  }

  // 监听selectedNote变化
  watch(
    () => selectedNote.value?.content,
    () => {
      if (!isEditing.value) {
        nextTick(() => {
          renderPreview()
        })
      }
    }
  )

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
  // 获取笔记详情
  const getSingleNote = async id => {
    try {
      const response = await getNote(id)
      if (response.status) {
        selectedNote.value = response.data.document
        editContent.value = response.data.document.content || ''
        isEditing.value = false
        // 渲染预览
        nextTick(() => {
          renderPreview()
        })
      }
    } catch (error) {
      console.error('获取笔记详情失败:', error)
      ElMessage.error('获取笔记详情失败')
    }
  }

  // 切换编辑模式
  const toggleEdit = () => {
    if (isEditing.value) {
      // 保存内容
      save()
    } else {
      // 进入编辑模式
      editContent.value = selectedNote.value?.content || ''
      isEditing.value = true
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    // 恢复原始内容，不保存修改
    editContent.value = selectedNote.value?.content || ''
    isEditing.value = false
    // 重新渲染预览内容
    nextTick(() => {
      renderPreview()
    })
    ElMessage.info('已取消编辑')
  }

  // 保存笔记
  const save = async () => {
    if (!selectedNote.value) return

    // 只发送id和content两个字段
    const saveData = {
      id: selectedNote.value.id,
      content: editContent.value,
    }

    try {
      const response = await saveNote(saveData)
      if (response.status) {
        // 更新本地数据
        selectedNote.value.content = editContent.value
        isEditing.value = false
        // 重新渲染预览内容
        nextTick(() => {
          renderPreview()
        })
        ElMessage.success('保存成功')
      } else {
        ElMessage.error(response.message || '保存失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error('保存失败')
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

  const handleQuickAdd = async ({ type, title, parentId, content }) => {
    try {
      let response
      if (type === 'folder') {
        response = await addFolder({ title, parentId })
      } else {
        response = await addNote({ title, directoryId: parentId, content })
      }

      if (response.status) {
        ElMessage.success(`添加${type === 'folder' ? '文件夹' : '文档'}成功`)
        await loadNotesData()
        // 展开父节点
        if (parentId && treeRef.value) {
          nextTick(() => {
            treeRef.value.updateExpandedKeys([parentId])
          })
        }
      } else {
        ElMessage.error(response.message || '添加失败')
      }
    } catch (error) {
      console.error('添加失败:', error)
      ElMessage.error('添加失败')
    }
  }

  const handleAddItem = async ({ title, type, parentId }) => {
    try {
      let response
      if (type === 'folder') {
        response = await addFolder({ title, parentId })
      } else {
        response = await addNote({ title, directoryId: parentId })
      }

      if (response.status) {
        ElMessage.success(`添加${type === 'folder' ? '文件夹' : '文档'}成功`)
        await loadNotesData()
        // 展开父节点
        if (parentId && treeRef.value) {
          nextTick(() => {
            treeRef.value.updateExpandedKeys([parentId])
          })
        }
      } else {
        ElMessage.error(response.message || '添加失败')
      }
    } catch (error) {
      console.error('添加失败:', error)
      ElMessage.error('添加失败')
    }
  }

  const handleRenameItem = async ({ id, title, type }) => {
    try {
      let response
      if (type === 'folder') {
        response = await renameFolder({ id, title })
      } else {
        response = await renameNote({ id, title })
      }

      if (response.status) {
        ElMessage.success('重命名成功')
        await loadNotesData()
      } else {
        ElMessage.error(response.message || '重命名失败')
      }
    } catch (error) {
      console.error('重命名失败:', error)
      ElMessage.error('重命名失败')
    }
  }

  const handleDeleteItem = async item => {
    try {
      let response
      if (item.type === 'folder') {
        response = await deleteFolder({ id: item.id })
      } else {
        response = await deleteNote({ id: item.id })
      }

      if (response.status) {
        ElMessage.success('删除成功')
        await loadNotesData()
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
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
  })
</script>

<style scoped lang="scss">
  .notes-container {
    height: 100%;
    display: flex;
    // 移除硬编码的背景色，让主题样式生效
    // background: #f5f7fa;
  }

  .notes-left {
    flex-shrink: 0;
  }

  .notes-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    // 移除硬编码的背景色，让主题样式生效
    // background: #ffffff;
    border-left: 1px solid #e4e7ed;
    overflow: hidden;
  }

  .content-header {
    height: 56px;
    // 移除硬编码的背景色
    // background: #fff;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      // 让文字颜色继承主题
      // color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .content-body {
    flex: 1;
    height: 100%;
  }

  .note-detail {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .edit-mode {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .preview-mode {
      flex: 1;
      padding: 0;
      overflow: visible;
    }

    .vditor-preview-container {
      min-height: 100%;
      padding: 20px;
      overflow: visible;
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

     // 空内容样式
   .empty-content {
     display: flex;
     align-items: center;
     justify-content: center;
     height: 100%;
     color: #909399;
     font-size: 16px;

     p {
       margin: 0;
       opacity: 0.6;
     }
   }

   // 图片帮助对话框样式
   :deep(.image-help-dialog) {
     .el-message-box__content {
       max-width: 500px;
     }
     
     .el-message-box__message {
       line-height: 1.6;
       
       h4 {
         color: #409eff;
         margin-bottom: 16px;
       }
       
       ul, ol {
         margin: 8px 0;
         padding-left: 20px;
       }
       
       li {
         margin: 8px 0;
       }
       
       strong {
         color: #303133;
       }
     }
   }
</style>
