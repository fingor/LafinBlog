// 笔记API服务
import { ElMessage } from 'element-plus'
import { $http } from '@/utils/request'

// 获取所有笔记数据
export const getNotesData = async () => {
  const response = await $http('/api/notes/getData', {
    method: 'get',
  })
  return response
}

// 添加新项目
export const addNoteItem = async params => {
  const response = await $http('/api/notes/add', {
    method: 'post',
    body: JSON.stringify(params),
  })
  return response
}

// 重命名项目
export const renameNoteItem = async params => {
  const response = await $http('/api/notes/rename', {
    method: 'put',
    body: JSON.stringify(params),
  })
  return response
}

// 删除项目
export const deleteNoteItem = async id => {
  const response = await $http(`/api/notes/delete/${id}`, {
    method: 'delete',
  })
  return response
}

// 获取所有文件夹
export const getAllFolders = async () => {
  const response = await $http('/api/notes/getFolders', {
    method: 'get',
  })
  return response
}

// 获取单个笔记
export const getNote = async id => {
  const response = await $http(`/api/notes/document/${id}`, {
    method: 'get',
  })
  return response
}
