<template>
  <div class="chapter-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>章节管理系统</h2>
      <div class="header-actions">
        <el-button type="primary" @click="signIn">登录</el-button>
        <el-button type="danger" @click="signOut">登出</el-button>
        <el-button type="primary" @click="showCreateDialog">新增章节</el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="searchForm.courseId" placeholder="请选择课程" clearable style="width: 200px">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="章节标题">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入章节标题"
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
        :data="chapters"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="章节标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="所属课程" width="150">
          <template #default="{ row }">
            {{ row.course?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="rank" label="排序" width="80" />
        <el-table-column prop="video" label="视频" width="120">
          <template #default="{ row }">
            <el-link v-if="row.video" :href="row.video" target="_blank" type="primary">
              查看视频
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="章节内容" min-width="300" show-overflow-tooltip>
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
        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="form.courseId" placeholder="请选择课程" style="width: 100%">
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="章节标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入章节标题" />
        </el-form-item>
        <el-form-item label="排序" prop="rank">
          <el-input-number v-model="form.rank" :min="1" :max="999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="视频链接" prop="video">
          <el-input v-model="form.video" placeholder="请输入视频链接URL" />
        </el-form-item>
        <el-form-item label="章节内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入章节内容"
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
const chapters = ref([]);
const courses = ref([]);
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref();

// 搜索表单
const searchForm = reactive({
  courseId: '',
  title: ''
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
  courseId: '',
  title: '',
  content: '',
  video: '',
  rank: 1
});

// 表单验证规则
const rules = {
  courseId: [
    { required: true, message: '请选择所属课程', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入章节标题', trigger: 'blur' },
    { min: 1, max: 100, message: '章节标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  rank: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入章节内容', trigger: 'blur' },
    { min: 1, max: 5000, message: '内容长度在 1 到 5000 个字符', trigger: 'blur' }
  ]
};

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑章节' : '新增章节');

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
      getCourses();
      getChapters();
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
  chapters.value = [];
  courses.value = [];
  pagination.total = 0;
};

// 获取课程列表
const getCourses = async () => {
  try {
    const res = await $http('/admin/courses', {
      method: "GET"
    });

    if (res.status) {
      courses.value = res.data.courses;
    } else {
      ElMessage.error(res.message || '获取课程列表失败');
    }
  } catch (error) {
    console.error('获取课程列表错误:', error);
    ElMessage.error('获取课程列表失败');
  }
};

// 获取章节列表
const getChapters = async () => {
  if (!searchForm.courseId) {
    chapters.value = [];
    pagination.total = 0;
    return;
  }

  loading.value = true;
  try {
    const params = new URLSearchParams({
      currentPage: pagination.currentPage.toString(),
      pageSize: pagination.pageSize.toString(),
      courseId: searchForm.courseId
    });

    if (searchForm.title) {
      params.append('title', searchForm.title);
    }

    const res = await $http(`/admin/chapters?${params.toString()}`, {
      method: "GET"
    });

    if (res.status) {
      chapters.value = res.data.chapters;
      pagination.total = res.data.pagination.total;
    } else {
      ElMessage.error(res.message || '获取章节列表失败');
    }
  } catch (error) {
    console.error('获取章节列表错误:', error);
    ElMessage.error('获取章节列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getChapters();
};

// 重置搜索
const handleReset = () => {
  searchForm.courseId = '';
  searchForm.title = '';
  pagination.currentPage = 1;
  chapters.value = [];
  pagination.total = 0;
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  if (searchForm.courseId) {
    getChapters();
  }
};

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  if (searchForm.courseId) {
    getChapters();
  }
};

// 显示新增对话框
const showCreateDialog = () => {
  if (!searchForm.courseId) {
    ElMessage.warning('请先选择课程');
    return;
  }
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 显示编辑对话框
const handleEdit = (row) => {
  isEdit.value = true;
  form.id = row.id;
  form.courseId = row.courseId;
  form.title = row.title;
  form.content = row.content;
  form.video = row.video || '';
  form.rank = row.rank;
  dialogVisible.value = true;
};

// 删除章节
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除章节"${row.title}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const res = await $http(`/admin/chapters/${row.id}`, {
      method: 'DELETE'
    });

    if (res.status) {
      ElMessage.success('删除成功');
      getChapters();
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除章节错误:', error);
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

    const url = isEdit.value ? `/admin/chapters/${form.id}` : '/admin/chapters';
    const method = isEdit.value ? 'PUT' : 'POST';

    const res = await $http(url, {
      method,
      body: JSON.stringify({
        courseId: form.courseId,
        title: form.title,
        content: form.content,
        video: form.video,
        rank: form.rank
      })
    });

    if (res.status) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
      dialogVisible.value = false;
      getChapters();
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
  form.courseId = searchForm.courseId;
  form.title = '';
  form.content = '';
  form.video = '';
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
  getCourses();
});
</script>

<style scoped>
.chapter-management {
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
