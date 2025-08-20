<template>
  <div
    class="tree-item"
    :style="{ paddingLeft: item.level * 20 + 'px' }"
    @click.stop="emit('item-click', item)"
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
        @click.stop="emit('toggle-expand', item)"
      >
        <ArrowDown v-if="item.expanded" />
        <ArrowRight v-else />
      </el-icon>
      <el-icon v-else class="item-icon">
        <Document v-if="item.type === 'document'" />
        <Folder v-else />
      </el-icon>

      <!-- 内联编辑输入框 -->
      <input
        v-if="editingItem === item.id"
        :value="editingText"
        @input="emit('update:editingText', $event.target.value)"
        class="inline-edit-input"
        @blur="emit('save-edit')"
        @keyup.enter="emit('save-edit')"
        @keyup.esc="emit('cancel-edit')"
        ref="editInput"
        @click.stop
        @focus="handleInputFocus"
      />
      <span v-else class="item-title">{{ item.title }}</span>

      <!-- 操作按钮 -->
      <div class="item-actions" v-if="!editingItem">
        <el-icon
          v-if="item.type === 'folder'"
          class="add-icon"
          @click.stop="emit('show-add-menu', $event, item)"
        >
          <Plus />
        </el-icon>
        <el-icon
          class="more-icon"
          @click.stop="emit('show-context-menu', $event, item)"
        >
          <MoreFilled />
        </el-icon>
      </div>
    </div>

    <!-- 递归渲染子项 -->
    <div v-if="item.children && item.children.length > 0 && item.expanded">
      <TreeNode
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :selected-item="selectedItem"
        :editing-item="editingItem"
        :editing-text="editingText"
        @item-click="item => $emit('item-click', item)"
        @toggle-expand="item => $emit('toggle-expand', item)"
        @show-context-menu="
          (event, item) => emit('show-context-menu', event, item)
        "
        @show-add-menu="(event, item) => emit('show-add-menu', event, item)"
        @save-edit="() => $emit('save-edit')"
        @cancel-edit="() => $emit('cancel-edit')"
        @update:editing-text="value => $emit('update:editingText', value)"
      />
    </div>
  </div>
</template>

<script setup>
  import {
    Document,
    Plus,
    MoreFilled,
    ArrowDown,
    ArrowRight,
    Folder,
  } from '@element-plus/icons-vue'

  // 定义props
  defineProps({
    item: {
      type: Object,
      required: true,
    },
    selectedItem: {
      type: String,
      default: '',
    },
    editingItem: {
      type: String,
      default: null,
    },
    editingText: {
      type: String,
      default: '',
    },
  })

  // 定义emits
  const emit = defineEmits([
    'item-click',
    'toggle-expand',
    'show-context-menu',
    'show-add-menu',
    'save-edit',
    'cancel-edit',
    'update:editingText',
  ])

  // 处理输入框焦点
  const handleInputFocus = event => {
    event.target.select()
  }
</script>

<style scoped lang="scss">
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
      transition: all 0.2s;

      &:hover {
        background: #f5f7fa;

        .item-actions {
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

      .inline-edit-input {
        flex: 1;
        font-size: 14px;
        color: #606266;
        border: 1px solid #409eff;
        border-radius: 4px;
        padding: 2px 6px;
        outline: none;
        background: #fff;
        line-height: 1.4;
        min-width: 0;
        max-width: 100%;
        box-sizing: border-box;
      }

      .item-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0;
        transition: all 0.2s;

        .add-icon {
          font-size: 14px;
          color: #c0c4cc;
          cursor: pointer;
          padding: 2px;
          border-radius: 2px;
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

        .more-icon {
          font-size: 14px;
          color: #c0c4cc;
          cursor: pointer;
          padding: 2px;
          border-radius: 2px;
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
  }
</style>
