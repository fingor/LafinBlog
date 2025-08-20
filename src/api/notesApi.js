// 模拟的笔记API服务
import { ElMessage } from 'element-plus'

// 模拟数据存储 - 单层级格式
let notesData = [
  {
    id: '1',
    pid: null,
    title: '前端杂记',
    type: 'folder',
    level: 0,
    expanded: true,
    order: 1
  },
  {
    id: '1-1',
    pid: '1',
    title: 'Vue.js 学习',
    type: 'folder',
    level: 1,
    expanded: true,
    order: 1
  },
  {
    id: '1-1-1',
    pid: '1-1',
    title: 'Vue3 组合式API',
    type: 'document',
    level: 2,
    order: 1
  },
  {
    id: '1-1-2',
    pid: '1-1',
    title: 'Vue Router 使用',
    type: 'document',
    level: 2,
    order: 2
  },
  {
    id: '1-1-3',
    pid: '1-1',
    title: 'Pinia 状态管理',
    type: 'document',
    level: 2,
    order: 3
  },
  {
    id: '1-2',
    pid: '1',
    title: 'React 学习',
    type: 'folder',
    level: 1,
    expanded: false,
    order: 2
  },
  {
    id: '1-2-1',
    pid: '1-2',
    title: 'React Hooks',
    type: 'document',
    level: 2,
    order: 1
  },
  {
    id: '1-2-2',
    pid: '1-2',
    title: 'React Router',
    type: 'document',
    level: 2,
    order: 2
  },
  {
    id: '1-3',
    pid: '1',
    title: 'JavaScript 基础',
    type: 'document',
    level: 1,
    order: 3
  },
  {
    id: '2',
    pid: null,
    title: '前端学习',
    type: 'folder',
    level: 0,
    expanded: true,
    order: 2
  },
  {
    id: '2-1',
    pid: '2',
    title: 'CSS 技巧',
    type: 'folder',
    level: 1,
    expanded: true,
    order: 1
  },
  {
    id: '2-1-1',
    pid: '2-1',
    title: 'Flexbox 布局',
    type: 'document',
    level: 2,
    order: 1
  },
  {
    id: '2-1-2',
    pid: '2-1',
    title: 'Grid 布局',
    type: 'document',
    level: 2,
    order: 2
  },
  {
    id: '2-1-3',
    pid: '2-1',
    title: 'CSS 动画',
    type: 'document',
    level: 2,
    order: 3
  },
  {
    id: '2-2',
    pid: '2',
    title: 'TypeScript',
    type: 'folder',
    level: 1,
    expanded: false,
    order: 2
  },
  {
    id: '2-2-1',
    pid: '2-2',
    title: 'TypeScript 基础',
    type: 'document',
    level: 2,
    order: 1
  },
  {
    id: '2-2-2',
    pid: '2-2',
    title: '高级类型',
    type: 'document',
    level: 2,
    order: 2
  },
  {
    id: '2-3',
    pid: '2',
    title: 'Node.js 学习',
    type: 'document',
    level: 1,
    order: 3
  },
  {
    id: '3',
    pid: null,
    title: '项目实战',
    type: 'folder',
    level: 0,
    expanded: false,
    order: 3
  },
  {
    id: '3-1',
    pid: '3',
    title: '电商项目',
    type: 'folder',
    level: 1,
    expanded: false,
    order: 1
  },
  {
    id: '3-1-1',
    pid: '3-1',
    title: '项目架构设计',
    type: 'document',
    level: 2,
    order: 1
  },
  {
    id: '3-1-2',
    pid: '3-1',
    title: '用户模块',
    type: 'document',
    level: 2,
    order: 2
  },
  {
    id: '3-2',
    pid: '3',
    title: '管理系统',
    type: 'document',
    level: 1,
    order: 2
  },
  {
    id: '4',
    pid: null,
    title: '面试题整理',
    type: 'document',
    level: 0,
    order: 4
  }
]

// 模拟延迟
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 根据 pid 构建树形结构
const buildTree = (items) => {
  const itemMap = new Map()
  const roots = []

  // 创建映射
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] })
  })

  // 构建树形结构
  items.forEach(item => {
    const node = itemMap.get(item.id)
    if (item.pid === null) {
      roots.push(node)
    } else {
      const parent = itemMap.get(item.pid)
      if (parent) {
        parent.children.push(node)
      }
    }
  })

  // 按 order 排序
  const sortChildren = (nodes) => {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children)
      }
    })
  }
  sortChildren(roots)

  return roots
}

// 获取所有笔记数据
export const getNotesData = async () => {
  await delay()
  return {
    code: 200,
    data: buildTree(notesData),
    message: '获取成功'
  }
}

// 添加新项目
export const addNoteItem = async params => {
  await delay()

  const { title, type, parentId } = params

  if (!title || !type) {
    return {
      code: 400,
      message: '参数错误'
    }
  }

  // 计算 level 和 order
  let level = 0
  let order = 1
  if (parentId) {
    const parent = notesData.find(item => item.id === parentId)
    if (parent) {
      level = parent.level + 1
      // 计算同级项目的最大 order
      const siblings = notesData.filter(item => item.pid === parentId)
      order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 1
    } else {
      return {
        code: 404,
        message: '父级项目不存在'
      }
    }
  } else {
    // 根级项目
    const rootItems = notesData.filter(item => item.pid === null)
    order = rootItems.length > 0 ? Math.max(...rootItems.map(s => s.order)) + 1 : 1
  }

  const newItem = {
    id: Date.now().toString(),
    pid: parentId || null,
    title,
    type,
    level,
    expanded: false,
    order
  }

  notesData.push(newItem)

  return {
    code: 200,
    data: newItem,
    message: '添加成功'
  }
}

// 重命名项目
export const renameNoteItem = async params => {
  await delay()

  const { id, title } = params

  if (!id || !title) {
    return {
      code: 400,
      message: '参数错误'
    }
  }

  const item = notesData.find(item => item.id === id)
  if (!item) {
    return {
      code: 404,
      message: '项目不存在'
    }
  }

  item.title = title

  return {
    code: 200,
    data: item,
    message: '重命名成功'
  }
}

// 删除项目
export const deleteNoteItem = async id => {
  await delay()

  if (!id) {
    return {
      code: 400,
      message: '参数错误'
    }
  }

  // 递归删除所有子项目
  const deleteChildren = (parentId) => {
    const children = notesData.filter(item => item.pid === parentId)
    children.forEach(child => {
      deleteChildren(child.id)
      const index = notesData.findIndex(item => item.id === child.id)
      if (index !== -1) {
        notesData.splice(index, 1)
      }
    })
  }

  deleteChildren(id)
  
  // 删除当前项目
  const index = notesData.findIndex(item => item.id === id)
  if (index !== -1) {
    notesData.splice(index, 1)
    return {
      code: 200,
      message: '删除成功'
    }
  }

  return {
    code: 404,
    message: '项目不存在'
  }
}

// 更新展开状态
export const updateExpandStatus = async params => {
  await delay()

  const { id, expanded } = params

  if (id === undefined || expanded === undefined) {
    return {
      code: 400,
      message: '参数错误'
    }
  }

  const item = notesData.find(item => item.id === id)
  if (!item) {
    return {
      code: 404,
      message: '项目不存在'
    }
  }

  item.expanded = expanded

  return {
    code: 200,
    data: item,
    message: '更新成功'
  }
}

// 获取所有文件夹
export const getAllFolders = async () => {
  await delay()

  const folders = notesData.filter(item => item.type === 'folder')

  return {
    code: 200,
    data: folders,
    message: '获取成功'
  }
}
