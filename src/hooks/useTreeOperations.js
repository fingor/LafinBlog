import { ref, nextTick } from 'vue'

/**
 * 通用树操作组合式函数
 * @param {Object} options 配置选项
 * @param {Function} options.loadData 加载数据的函数
 * @param {Function} options.getItemPath 获取项目路径的函数
 * @param {Function} options.updateExpandedKeys 更新展开状态的函数
 * @param {Function} options.showMessage 显示消息的函数
 * @returns {Object} 返回树操作相关的方法和状态
 */
export function useTreeOperations(options) {
  const { loadData, getItemPath, updateExpandedKeys, showMessage = console.log } = options
  
  const lastOperatedItemPath = ref([])
  const treeRef = ref(null)

  /**
   * 根据路径展开节点并折叠其他节点
   * @param {Array} path 节点路径
   * @param {string} operationType 操作类型
   */
  const expandPathAndCollapseOthers = (path, operationType = 'rename') => {
    if (!path || path.length === 0) return
    
    let expandedPath = path
    
    if (operationType === 'add') {
      // 对于新增操作，展开整个路径（包括父目录本身）
      expandedPath = path
    } else {
      // 对于删除和重命名操作，展开父级路径（不包括操作的目标节点）
      expandedPath = path.slice(0, -1)
    }
    
    // 通过Tree组件的ref更新展开状态
    if (treeRef.value && treeRef.value.updateExpandedKeys) {
      treeRef.value.updateExpandedKeys(expandedPath)
    } else if (updateExpandedKeys) {
      // 备用方案：使用传入的更新函数
      updateExpandedKeys(expandedPath)
    }
  }

  /**
   * 通用的树操作包装器
   * @param {Function} operation 要执行的操作函数
   * @param {string} itemId 操作项的ID
   * @param {string} parentId 父级ID
   * @param {string} operationType 操作类型：'add', 'delete', 'rename'
   * @returns {Promise} 操作结果
   */
  const withTreeStatePreservation = async (operation, itemId, parentId = null, operationType = 'rename') => {
    try {
      // 记录操作项的路径
      let path = null
      
      if (operationType === 'add') {
        // 对于新增操作，展开父目录
        if (parentId && getItemPath) {
          path = getItemPath(parentId)
        }
      } else {
        // 对于删除和重命名操作，保持原有逻辑
        if (itemId && getItemPath) {
          path = getItemPath(itemId)
        } else if (parentId && getItemPath) {
          path = getItemPath(parentId)
        }
      }
      
      if (path) {
        lastOperatedItemPath.value = path
      }

      // 执行操作
      const result = await operation()

      // 重新加载数据
      if (loadData) {
        await loadData()
      }

      // 应用展开状态：保持操作项的父级目录展开，其他节点折叠
      nextTick(() => {
        expandPathAndCollapseOthers(lastOperatedItemPath.value, operationType)
      })

      return result
    } catch (error) {
      throw error
    }
  }

  /**
   * 通用的增删改操作包装器
   * @param {Function} operation 操作函数
   * @param {string} itemId 项目ID
   * @param {string} parentId 父级ID
   * @param {string} successMessage 成功消息
   * @param {string} errorMessage 错误消息
   * @param {string} operationType 操作类型：'add', 'delete', 'rename'
   * @returns {Promise} 操作结果
   */
  const executeOperation = async (operation, itemId, parentId, successMessage, errorMessage, operationType = 'rename') => {
    try {
      const response = await withTreeStatePreservation(operation, itemId, parentId, operationType)
      
      if (response.status) {
        showMessage(successMessage, 'success')
      } else {
        showMessage(response.message || errorMessage, 'error')
      }
      
      return response
    } catch (error) {
      showMessage(errorMessage, 'error')
      throw error
    }
  }

  return {
    lastOperatedItemPath,
    treeRef,
    expandPathAndCollapseOthers,
    withTreeStatePreservation,
    executeOperation
  }
}
