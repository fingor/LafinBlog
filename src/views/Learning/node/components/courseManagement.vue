<template>
  <div class="course-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>课程管理系统</h2>
      <div class="header-actions">
        <el-button type="primary" @click="signIn">登录</el-button>
        <el-button type="danger" @click="signOut">登出</el-button>
        <el-button type="primary" @click="showCreateDialog">新增课程</el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="课程名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入课程名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="请选择分类" clearable style="width: 150px">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="推荐">
          <el-select v-model="searchForm.recommended" placeholder="请选择" clearable style="width: 100px">
            <el-option label="是" value="true" />
            <el-option label="否" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="入门">
          <el-select v-model="searchForm.introductory" placeholder="请选择" clearable style="width: 100px">
            <el-option label="是" value="true" />
            <el-option label="否" value="false" />
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
        :data="courses"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="课程名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            {{ row.category?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="讲师" width="120">
          <template #default="{ row }">
            {{ row.user?.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="image" label="封面" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.image"
              :src="row.image"
              style="width: 60px; height: 40px"
              fit="cover"
              :preview-src-list="[row.image]"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="recommended" label="推荐" width="80">
          <template #default="{ row }">
            <el-tag :type="row.recommended ? 'success' : 'info'">
              {{ row.recommended ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="introductory" label="入门" width="80">
          <template #default="{ row }">
            <el-tag :type="row.introductory ? 'warning' : 'info'">
              {{ row.introductory ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="课程内容" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="content-preview">{{ row.content }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
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
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <!-- 隐藏图片字段，避免图片地址验证错误 -->
        <!-- <el-form-item label="封面图片" prop="image">
          <el-input v-model="form.image" placeholder="请输入图片URL" />
        </el-form-item> -->
        <el-form-item label="推荐">
          <el-switch v-model="form.recommended" />
        </el-form-item>
        <el-form-item label="入门课程">
          <el-switch v-model="form.introductory" />
        </el-form-item>
        <el-form-item label="课程内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入课程内容"
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
const courses = ref([]);
const categories = ref([]);
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();

// 搜索表单
const searchForm = reactive({
  name: '',
  categoryId: '',
  recommended: '',
  introductory: ''
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
  categoryId: '',
  name: '',
  image: '',
  recommended: false,
  introductory: false,
  content: ''
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入课程名称', trigger: 'blur' },
    { min: 1, max: 100, message: '课程名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入课程内容', trigger: 'blur' },
    { min: 1, max: 5000, message: '内容长度在 1 到 5000 个字符', trigger: 'blur' }
  ]
};

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑课程' : '新增课程');

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
      getCourses();
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
  courses.value = [];
  categories.value = [];
  pagination.total = 0;
};

// 获取分类列表
const getCategories = async () => {
  try {
    const res = await $http('/admin/categories', {
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
  }
};

// 获取课程列表
const getCourses = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      currentPage: pagination.currentPage.toString(),
      pageSize: pagination.pageSize.toString()
    });

    if (searchForm.name) {
      params.append('name', searchForm.name);
    }
    if (searchForm.categoryId) {
      params.append('categoryId', searchForm.categoryId);
    }
    if (searchForm.recommended) {
      params.append('recommended', searchForm.recommended);
    }
    if (searchForm.introductory) {
      params.append('introductory', searchForm.introductory);
    }

    const res = await $http(`/admin/courses?${params.toString()}`, {
      method: "GET"
    });

    if (res.status) {
      courses.value = res.data.courses;
      pagination.total = res.data.pagination.total;
    } else {
      ElMessage.error(res.message || '获取课程列表失败');
    }
  } catch (error) {
    console.error('获取课程列表错误:', error);
    ElMessage.error('获取课程列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getCourses();
};

// 重置搜索
const handleReset = () => {
  searchForm.name = '';
  searchForm.categoryId = '';
  searchForm.recommended = '';
  searchForm.introductory = '';
  pagination.currentPage = 1;
  getCourses();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getCourses();
};

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  getCourses();
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
  form.categoryId = row.categoryId;
  form.name = row.name;
  form.image = ''; // 编辑时也设置为空，避免图片地址验证错误
  form.recommended = row.recommended;
  form.introductory = row.introductory;
  form.content = row.content;
  dialogVisible.value = true;
};

// 删除课程
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除课程"${row.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const res = await $http(`/admin/courses/${row.id}`, {
      method: 'DELETE'
    });

    if (res.status) {
      ElMessage.success('删除成功');
      getCourses();
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除课程错误:', error);
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

    const url = isEdit.value ? `/admin/courses/${form.id}` : '/admin/courses';
    const method = isEdit.value ? 'PUT' : 'POST';

    const res = await $http(url, {
      method,
      body: JSON.stringify({
        categoryId: form.categoryId,
        name: form.name,
        image: null, // 传递 null 值，避免 Sequelize URL 验证错误
        recommended: form.recommended,
        introductory: form.introductory,
        content: form.content
      })
    });

    if (res.status) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
      dialogVisible.value = false;
      getCourses();
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
  form.categoryId = '';
  form.name = '';
  form.image = ''; // 确保图片字段为空
  form.recommended = false;
  form.introductory = false;
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
  getCategories();
  getCourses();
});
</script>

<style scoped>
.course-management {
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
