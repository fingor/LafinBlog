import { ElMessageBox, ElMessage } from 'element-plus'

/**
 * 全局确认弹窗方法
 * @param {string} message - 弹窗内容
 * @param {string} title - 弹窗标题，默认为 "Title"
 * @param {Object} options - 配置选项
 * @param {string} options.confirmButtonText - 确认按钮文字，默认为 "OK"
 * @param {string} options.cancelButtonText - 取消按钮文字，默认为 "Cancel"
 * @param {string} options.type - 弹窗类型，默认为 "warning"
 * @param {boolean} options.showCancelButton - 是否显示取消按钮，默认为 true
 * @param {boolean} options.showConfirmButton - 是否显示确认按钮，默认为 true
 * @returns {Promise} 返回 Promise，resolve 表示确认，reject 表示取消
 */
export const $confirm = (message, title = 'Title', options = {}) => {
  const defaultOptions = {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    type: 'warning',
    showCancelButton: true,
    showConfirmButton: true,
    ...options
  }

  return ElMessageBox.confirm(message, title, defaultOptions)
}

/**
 * 全局消息提示方法
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：success, warning, info, error
 * @param {Object} options - 配置选项
 */
export const $message = (message, type = 'info', options = {}) => {
  ElMessage({
    message,
    type,
    ...options
  })
}

/**
 * 全局成功消息
 */
export const $success = (message, options = {}) => {
  $message(message, 'success', options)
}

/**
 * 全局错误消息
 */
export const $error = (message, options = {}) => {
  $message(message, 'error', options)
}

/**
 * 全局警告消息
 */
export const $warning = (message, options = {}) => {
  $message(message, 'warning', options)
}

/**
 * 全局信息消息
 */
export const $info = (message, options = {}) => {
  $message(message, 'info', options)
}
