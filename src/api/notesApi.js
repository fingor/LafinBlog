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

// 添加笔记
export const addNote = async params => {
  const response = await $http('/api/notes/document', {
    method: 'post',
    body: JSON.stringify(params),
  })
  return response
}

// 添加目录
export const addFolder = async params => {
  const response = await $http('/api/notes/directory', {
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

// 删除笔记
export const deleteNote = async params => {
  const response = await $http(`/api/notes/documentDelete`, {
    method: 'post',
    body: JSON.stringify(params),
  })
  return response
}

// 删除目录
export const deleteFolder = async params => {
  const response = await $http(`/api/notes/directoryDelete`, {
    method: 'post',
    body: JSON.stringify(params),
  })
  return response
}
// 目录重命名
export const renameFolder = async params => {
  const response = await $http('/api/notes/directoryRename', {
    method: 'post',
    body: JSON.stringify(params),
  })
  return response
}
// 笔记重命名
export const renameNote = async params => {
  const response = await $http('/api/notes/documentRename', {
    method: 'post',
    body: JSON.stringify(params),
  })
  return response
}
// 保存笔记
export const saveNote = async params => {
  const response = await $http('/api/notes/documentSave', {
    method: 'post',
    body: JSON.stringify(params),
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
