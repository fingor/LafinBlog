<template>
  <div class="category-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-actions">
        <el-button type="primary" @click="signIn">登录</el-button>
        <el-button type="danger" @click="signOut">登出</el-button>
        <el-button type="primary" @click="showCreateDialog">新增分类</el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="分类名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入分类名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-card">
      <el-table
        :data="categories"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="rank" label="排序" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序" prop="rank">
          <el-input-number v-model="form.rank" :min="1" :max="999" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { $http } from "@/utils/request";

// 响应式数据
const categories = ref([]);
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();

// 搜索表单
const searchForm = reactive({
  name: ''
});

// 表单数据
const form = reactive({
  id: null,
  name: '',
  rank: 1
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '分类名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  rank: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
};

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑分类' : '新增分类');

// 登录方法
const signIn = async () => {
  try {
    const res = await $http('/admin/auth/sign_in', {
      method: 'POST',
      body: JSON.stringify({
        login: 'admin@clwy.cn',
        password: 'aaabbbcccd'
      })
    });

    if (res.status) {
      localStorage.setItem("token", res.data.token);
      ElMessage.success('登录成功');
      // 登录成功后获取数据
      getCategories();
    } else {
      ElMessage.error(res.message || '登录失败');
    }
  } catch (error) {
    console.error('登录错误:', error);
    ElMessage.error('登录失败');
  }
};

// 登出方法
const signOut = () => {
  localStorage.removeItem("token");
  ElMessage.success("登出成功");
  // 清空数据
  categories.value = [];
};

// 获取分类列表
const getCategories = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();

    if (searchForm.name) {
      params.append('name', searchForm.name);
    }

    const res = await $http(`/admin/categories?${params.toString()}`, {
      method: "GET"
    });

    if (res.status) {
      categories.value = res.data.categories;
    } else {
      ElMessage.error(res.message || '获取分类列表失败');
    }
  } catch (error) {
    console.error('获取分类列表错误:', error);
    ElMessage.error('获取分类列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  getCategories();
};

// 重置搜索
const handleReset = () => {
  searchForm.name = '';
  getCategories();
};

// 显示新增对话框
const showCreateDialog = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 显示编辑对话框
const handleEdit = (row) => {
  isEdit.value = true;
  form.id = row.id;
  form.name = row.name;
  form.rank = row.rank;
  dialogVisible.value = true;
};

// 删除分类
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${row.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const res = await $http(`/admin/categories/${row.id}`, {
      method: 'DELETE'
    });

    if (res.status) {
      ElMessage.success('删除成功');
      getCategories();
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类错误:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const url = isEdit.value ? `/admin/categories/${form.id}` : '/admin/categories';
    const method = isEdit.value ? 'PUT' : 'POST';

    const res = await $http(url, {
      method,
      body: JSON.stringify({
        name: form.name,
        rank: form.rank
      })
    });

    if (res.status) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
      dialogVisible.value = false;
      getCategories();
    } else {
      ElMessage.error(res.message || (isEdit.value ? '更新失败' : '创建失败'));
    }
  } catch (error) {
    console.error('提交表单错误:', error);
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    submitLoading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  form.id = null;
  form.name = '';
  form.rank = 1;
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('zh-CN');
};

// 页面加载时获取数据
onMounted(() => {
  getCategories();
});
</script>

<style scoped>
.category-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.search-card {
  margin-bottom: 20px;
}

/* 确保按钮文字居中 */
:deep(.el-button) {
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-button span) {
  text-align: center;
}

.table-card {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  margin-bottom: 20px;
}
</style>
