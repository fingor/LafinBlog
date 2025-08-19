<template>
  <div class="article-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">新增文章</el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="文章标题">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入文章标题"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.deleted" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="正常" value="false" />
            <el-option label="已删除" value="true" />
          </el-select>
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
        :data="articles"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="文章标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="content" label="文章内容" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="content-preview">{{ row.content }}</div>
          </template>
        </el-table-column>
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

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="文章内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入文章内容"
          />
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
const articles = ref([]);
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();

// 搜索表单
const searchForm = reactive({
  title: '',
  deleted: ''
});

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 表单数据
const form = reactive({
  id: null,
  title: '',
  content: ''
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' },
    { min: 1, max: 5000, message: '内容长度在 1 到 5000 个字符', trigger: 'blur' }
  ]
};

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑文章' : '新增文章');



// 获取文章列表
const getArticles = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      currentPage: pagination.currentPage.toString(),
      pageSize: pagination.pageSize.toString()
    });

    if (searchForm.title) {
      params.append('title', searchForm.title);
    }
    // 暂时注释掉软删除参数，因为数据库中没有deletedAt字段
    if (searchForm.deleted) {
      params.append('deleted', searchForm.deleted);
    }

    const res = await $http(`/admin/articles?${params.toString()}`, {
      method: "GET"
    });

    if (res.status) {
      articles.value = res.data.articles;
      pagination.total = res.data.pagination.total;
    }
  } catch (error) {
    console.error('获取文章列表错误:', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getArticles();
};

// 重置搜索
const handleReset = () => {
  searchForm.title = '';
  // searchForm.deleted = ''; // 暂时注释掉，因为数据库中没有deletedAt字段
  pagination.currentPage = 1;
  getArticles();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getArticles();
};

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  getArticles();
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
  form.title = row.title;
  form.content = row.content;
  dialogVisible.value = true;
};

// 删除文章
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文章"${row.title}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const res = await $http('/admin/articles/delete', {
      method: 'POST',
      body: JSON.stringify({ id: row.id })
    });

    if (res.status) {
      ElMessage.success('删除成功');
      getArticles();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文章错误:', error);
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

    const url = isEdit.value ? `/admin/articles/${form.id}` : '/admin/articles';
    const method = isEdit.value ? 'PUT' : 'POST';

    const res = await $http(url, {
      method,
      body: JSON.stringify({
        title: form.title,
        content: form.content
      })
    });

    if (res.status) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
      dialogVisible.value = false;
      getArticles();
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
  form.title = '';
  form.content = '';
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
  getArticles();
});
</script>

<style scoped>
.article-management {
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

.content-preview {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
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
