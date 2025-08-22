<template>
  <div class="markdown-editor">
    <div ref="vditorRef"></div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
  import Vditor from 'vditor'
  import 'vditor/dist/index.css'

  // Props
  const props = defineProps({
    modelValue: {
      type: String,
      default: '',
    },
    mode: {
      type: String,
      default: 'wysiwyg',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  })

  // Emits
  const emit = defineEmits(['update:modelValue'])

  // 响应式数据
  const vditorRef = ref(null)
  let vditorInstance = null

  // 监听props变化
  watch(
    () => props.modelValue,
    newVal => {
      if (vditorInstance && vditorInstance.getValue() !== newVal) {
        vditorInstance.setValue(newVal || '')
      }
    }
  )

  // 初始化Vditor
  const initVditor = () => {
    if (!vditorRef.value) return

    vditorInstance = new Vditor(vditorRef.value, {
      mode: props.mode,
      value: props.modelValue || '',
      placeholder: '请输入内容...',
      theme: 'classic',

      // 工具栏配置
      toolbar: props.readonly
        ? []
        : [
            'emoji',
            'headings',
            'bold',
            'italic',
            'strike',
            'link',
            'upload',
            '|',
            'list',
            'ordered-list',
            'check',
            'outdent',
            'indent',
            '|',
            'quote',
            'line',
            'code',
            'inline-code',
            '|',
            'table',
            'undo',
            'redo',
            '|',
            'fullscreen',
            'edit-mode',
            'both',
            'preview',
          ],

      // 上传配置
      upload: {
        accept: 'image/*',
        multiple: true,
        success: (editor, msg) => {
          console.log('上传成功:', msg)
        },
        error: (msg) => {
          console.error('上传失败:', msg)
        },
        handler: (files, insertImage) => {
          // 处理图片上传
          files.forEach(file => {
            const reader = new FileReader()
            reader.onload = (e) => {
              // 将图片转换为base64并插入
              const imageMarkdown = `![${file.name}](${e.target.result})`
              vditorInstance.insertValue(imageMarkdown)
            }
            reader.onerror = (error) => {
              console.error('图片读取失败:', error)
            }
            reader.readAsDataURL(file)
          })
        }
      },

      // 粘贴配置
      paste: {
        enable: true,
        filter: (p) => {
          // 处理粘贴的图片
          if (p.type === 'image') {
            const reader = new FileReader()
            reader.onload = (e) => {
              vditorInstance.insertValue(`![粘贴的图片](${e.target.result})`)
            }
            reader.readAsDataURL(p.file)
            return false // 阻止默认处理
          }
          return true
        }
      },

      input: value => {
        emit('update:modelValue', value)
      },

      // 预览配置
      preview: {
        hljs: {
          enable: true,
          lineNumber: true,
          style: 'github',
        },
      },

      // 缓存配置
      cache: {
        enable: false,
      },

      // 初始化完成回调
      after: () => {
        console.log('Vditor 初始化完成')
        if (!props.readonly) {
          setTimeout(() => {
            if (vditorInstance) {
              vditorInstance.focus()
            }
          }, 100)
        }
      },
    })
  }

  // 初始化
  onMounted(() => {
    nextTick(() => {
      initVditor()
    })
  })

  // 组件销毁时清理
  onBeforeUnmount(() => {
    if (vditorInstance) {
      vditorInstance.destroy()
      vditorInstance = null
    }
  })
</script>

<style scoped>
  .markdown-editor {
    height: 100%;
  }

  /* 确保工具栏提示不被遮挡 */
  :deep(.vditor-toolbar) {
    overflow: visible !important;
    z-index: 1000;
  }

  :deep(.markdown-editor) {
    overflow: visible !important;
  }
</style>
