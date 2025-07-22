<template>
  <div class="container">
    <header>
      <h1>Vue3 大文件分片上传解决方案</h1>
      <div class="subtitle">支持拖拽上传的大文件分片上传技术</div>
    </header>

    <div class="upload-container">
      <div class="file-select">
        <div
          class="drop-area"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="handleDrop"
          :class="{ 'drag-over': dragOver }"
        >
          <div class="upload-icon">
            <i class="fas fa-cloud-upload-alt"></i>
          </div>
          <p>
            将文件拖到此处，或<em @click="openFileBrowser">点击选择文件</em>
          </p>
          <p class="hint">支持多选，最大文件大小: 2GB</p>
          <input
            ref="fileInput"
            type="file"
            multiple
            class="file-input"
            @change="handleFileSelect"
          />
        </div>
      </div>

      <div v-if="files.length" class="file-info">
        <div class="selected-count">
          <span
            >{{ files.length }} 个文件已选择，总计
            {{ formatBytes(totalFileSize) }}</span
          >
          <span class="add-more" @click="openFileBrowser">
            <i class="fas fa-plus"></i> 添加更多
          </span>
        </div>
        <ul>
          <li v-for="(file, index) in files" :key="file.name + index">
            <div class="file-details">
              <span class="filename">{{ file.name }}</span>
              <span class="filesize">{{ formatBytes(file.size) }}</span>
              <div v-if="fileStatus[file.name]" class="progress-container">
                <div
                  class="progress-bar"
                  :style="{ width: fileStatus[file.name].progress + '%' }"
                ></div>
                <div class="progress-text">
                  {{ getDisplayStatus(fileStatus[file.name].status) }}:
                  {{ fileStatus[file.name].progress }}%
                  <template v-if="fileStatus[file.name].status === 'hashing'">
                    ({{ fileStatus[file.name].hashProgress }}%)
                  </template>
                  <!-- <template
                    v-else-if="fileStatus[file.name].status === 'waiting'"
                  >
                    (就绪)
                  </template> -->
                  <template v-else>
                    <!-- ({{ fileStatus[file.name].uploadedChunksCount }}/{{ fileStatus[file.name].totalChunks }}) -->
                    ({{ fileStatus[file.name].uploadedChunks.length }}/{{
                      fileStatus[file.name].totalChunks
                    }})
                  </template>
                </div>
              </div>
            </div>
            <div class="control-buttons">
              <!-- 合并上传和暂停按钮 -->
              <button
                class="control-btn"
                @click="
                  fileStatus[file.name]?.status === 'uploading' ||
                  fileStatus[file.name]?.status === 'paused'
                    ? toggleUpload(file)
                    : startUpload(file)
                "
                :disabled="fileStatus[file.name]?.status === 'hashing'"
              >
                {{ getButtonText(file) }}
              </button>
              <button
                class="remove-btn"
                @click="handleRemove(index, file)"
                :disabled="fileStatus[file.name]?.status === 'hashing'"
              >
                X
              </button>
            </div>
          </li>
        </ul>
      </div>

      <div class="flex-buttons">
        <button
          class="btn btn-primary"
          :disabled="uploading || !allHashesCalculated || isCalculating"
          @click="uploadFiles"
        >
          <i class="fas fa-upload"></i>
          {{ getUploadButtonText() }}
        </button>
        <button
          class="btn btn-secondary"
          :disabled="uploading || isCalculating"
          @click="resetUploader"
        >
          <i class="fas fa-redo"></i> 重置
        </button>
      </div>
      <div v-if="uploadStatus">
        {{ uploadStatus }}
      </div>
      <div v-if="uploadResults.length" class="results-container">
        <h3><i class="fas fa-clipboard-check"></i> 上传结果</h3>
        <div
          v-for="(result, index) in uploadResults"
          :key="index"
          class="result-item"
        >
          <div class="result-detail">
            <span class="filename">{{ result.file.name }}</span>
            <span v-if="result.success" class="success">
              <i class="fas fa-check-circle"></i> 上传成功
            </span>
            <span v-else class="error">
              <i class="fas fa-exclamation-circle"></i> 上传失败
            </span>
          </div>
          <div v-if="result.success" class="file-url">
            <small>{{ result.url }}</small>
          </div>
          <div v-if="!result.success" class="error-message">
            错误: {{ result.error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import axios from "axios";

const files = ref([]);
const dragOver = ref(false);
const uploadStatus = ref("");
const uploadResults = ref([]);
const fileInput = ref(null);
const uploading = ref(false);
const progressMap = ref({});
const uploadControllers = reactive({}); // 存储每个文件的 AbortController
const pausedFiles = reactive({}); // 存储暂停状态
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks

// 添加状态映射对象
const statusMap = {
  pending: "等待中",
  hashing: "计算哈希",
  waiting: "等待上传",
  uploading: "上传中",
  paused: "已暂停",
  completed: "已完成",
  error: "错误",
  canceled: "已取消",
  hash_error: "哈希计算失败",
};
// 添加一个获取显示状态的方法
const getDisplayStatus = (status) => {
  return statusMap[status] || status;
};
// 计算属性
const totalFileSize = computed(() => {
  return files.value.reduce((total, file) => total + file.size, 0);
});
// 格式化文件大小
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};
// 打开文件浏览器
const openFileBrowser = () => {
  fileInput.value.click();
};
// 处理文件选择
const handleFileSelect = (e) => {
  addFiles(Array.from(e.target.files));
  e.target.value = "";
};
// 处理拖放文件
const handleDrop = (e) => {
  dragOver.value = false;
  addFiles(Array.from(e.dataTransfer.files));
};
// 添加文件到列表
const addFiles = (newFiles) => {
  console.log("newFiles", newFiles);

  // 过滤重复文件
  const existingFileNames = files.value.map((f) => f.name);
  const uniqueFiles = newFiles.filter(
    (file) => !existingFileNames.includes(file.name)
  );

  if (uniqueFiles.length > 0) {
    files.value = [...files.value, ...uniqueFiles];
    uploadStatus.value = `已添加 ${uniqueFiles.length} 个文件`;

    // 新增：文件添加后立即开始计算哈希
    uniqueFiles.forEach((file) => {
      // 初始化为计算哈希状态
      updateFileStatus(file.name, {
        status: "hashing",
        hashProgress: 0,
      });

      // 启动哈希计算
      calculateFileHash(file).catch((error) => {
        console.error(`文件 ${file.name} 哈希计算失败:`, error);
        updateFileStatus(file.name, {
          status: "hash_error",
        });
      });
    });
  }
};
// 获取按钮文本
const getButtonText = (file) => {
  const status = fileStatus[file.name]?.status;

  if (status === "uploading") {
    return "暂停";
  }
  if (status === "paused") {
    return "恢复";
  }
  if (status === "completed") {
    return "已完成";
  }
  return "上传";
};
const startUpload = (file) => {
  updateFileStatus(file.name, { status: "uploading" });
  uploadFile(file);
};
// uploadFile 方法（并行上传分片，支持断点续传）
const uploadFile = async (
  file,
  uploadIdParam = null,
  fileHashParam = null,
  uploadedChunksParam = [],
  totalChunksParam = null
) => {
  const totalChunks = totalChunksParam || Math.ceil(file.size / CHUNK_SIZE);

  try {
    // 初始化文件上传状态
    updateFileStatus(file.name, {
      totalChunks,
      uploadedChunks: uploadedChunksParam,
      progress: Math.round((uploadedChunksParam.length / totalChunks) * 100),
      status: "uploading",
    });

    // 获取文件哈希和上传ID
    const fileHash = fileHashParam || (await calculateFileHash(file));
    const { uploadId, uploadedChunks = [] } = uploadIdParam
      ? {
          uploadId: uploadIdParam,
          uploadedChunks: uploadedChunksParam,
        }
      : await initFileUpload(file, fileHash);

    // 保存上传ID和文件哈希到状态
    updateFileStatus(file.name, {
      uploadId,
      fileHash,
      uploadedChunks:
        uploadedChunksParam.length > 0 ? uploadedChunksParam : uploadedChunks,
      progress: Math.round(
        ((uploadedChunksParam.length > 0 ? uploadedChunksParam : uploadedChunks)
          .length /
          totalChunks) *
          100
      ),
      status: "uploading",
    });

    // 创建所有分片的上传任务
    const chunkTasks = [];
    for (let index = 0; index < totalChunks; index++) {
      // 跳过已上传的分片
      if (uploadedChunks.includes(index) || uploadedChunksParam.includes(index))
        continue;

      const start = index * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      chunkTasks.push(() =>
        chunkConcurrency(async () => {
          // 在每个分片上传前检查是否被暂停
          if (pausedFiles[file.name]) {
            throw new Error("Upload paused");
          }

          const result = await uploadChunk(
            file,
            uploadId,
            chunk,
            index,
            totalChunks
          );

          // 上传成功后再次检查是否被暂停
          if (pausedFiles[file.name]) {
            throw new Error("Upload paused");
          }

          return result;
        }).then(() => {
          // 更新已上传的分片索引
          const newUploaded = [...fileStatus[file.name].uploadedChunks, index];
          updateFileStatus(file.name, {
            uploadedChunks: newUploaded,
            progress: Math.round((newUploaded.length / totalChunks) * 100),
            status: "uploading",
          });
        })
      );
    }

    // 并行上传所有分片，但要处理暂停异常
    // 每个分片开始前检查是否已暂停
    if (pausedFiles[file.name]) {
      return { success: false, aborted: true };
    }

    // 创建 Promise 数组用于存储正在进行的上传任务
    const activeUploads = [];

    for (const task of chunkTasks) {
      // 再次检查是否已暂停
      if (pausedFiles[file.name]) {
        break;
      }

      activeUploads.push(task());

      // 等待当前分片上传完成
      try {
        await Promise.race([
          Promise.all(activeUploads),
          new Promise((_, reject) => {
            const checkPaused = setInterval(() => {
              if (pausedFiles[file.name]) {
                clearInterval(checkPaused);
                reject(new Error("Upload paused"));
              }
            }, 100);
          }),
        ]);
      } catch (error) {
        if (error.message === "Upload paused") {
          return { success: false, aborted: true };
        }
        throw error;
      }
    }

    // 如果已暂停，直接返回
    if (pausedFiles[file.name]) {
      return { success: false, aborted: true };
    }

    // 检查是否被暂停，如果暂停则不完成上传
    if (pausedFiles[file.name]) {
      return { success: false, aborted: true };
    }

    // 完成上传
    const result = await completeFileUpload(
      file,
      uploadId,
      fileHash,
      totalChunks
    );

    // 更新状态
    updateFileStatus(file.name, {
      status: result.success ? "completed" : "error",
    });

    // 添加到上传结果
    uploadResults.value.push({ file, ...result });
    return result;
  } catch (error) {
    if (error.name === "AbortError" || pausedFiles[file.name]) {
      updateFileStatus(file.name, { status: "paused" });
    } else {
      updateFileStatus(file.name, { status: "error" });
    }
    return {
      success: false,
      error: error.message || "上传过程中发生错误",
    };
  }
};
// uploadFiles 方法
const uploadFiles = async () => {
  if (files.value.length === 0) {
    uploadStatus.value = "请先选择文件";
    return;
  }

  // 检查网络状态
  if (!navigator.onLine) {
    uploadStatus.value = "网络不可用，请检查网络连接";
    return;
  }

  uploadStatus.value = "开始上传文件...";
  uploading.value = true;

  try {
    const unuploadedFiles = files.value.filter((file) => {
      const status = fileStatus[file.name]?.status;
      return (
        !status ||
        status === "waiting" ||
        status === "paused" ||
        status === "error" ||
        status === "canceled"
      );
    });

    if (unuploadedFiles.length === 0) {
      uploadStatus.value = "没有需要上传的文件";
      uploading.value = false;
      return;
    }

    uploadStatus.value = `开始上传 ${unuploadedFiles.length} 个文件...`;

    // 存储上传结果
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const file of unuploadedFiles) {
      try {
        // 上传文件并获取结果
        const result = await uploadFile(file);
        results.push(result);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`文件 ${file.name} 上传失败:`, error);
        errorCount++;
        updateFileStatus(file.name, {
          status: "error",
          error: error.message || "上传失败",
        });
      }
    }

    // 根据结果更新状态
    if (errorCount === 0) {
      uploadStatus.value = `所有文件上传完成! (共 ${successCount} 个)`;
    } else if (successCount === 0) {
      uploadStatus.value = `上传失败! 所有文件均未成功上传`;
    } else {
      uploadStatus.value = `上传完成，成功 ${successCount} 个, 失败 ${errorCount} 个`;
    }
  } catch (globalError) {
    console.error("上传过程出错:", globalError);
    uploadStatus.value = `上传失败: ${globalError.message}`;
  } finally {
    uploading.value = false;
  }
};
// 初始化文件上传
// 1.获取上传 ID 2.断点续传支持 3.文件查重
const initFileUpload = async (file, fileHash) => {
  try {
    const response = await axios.post("/api/uploadsBig/init", {
      fileName: file.name,
      fileSize: file.size,
      fileHash,
    });
    return response.data;
  } catch (error) {
    console.error("初始化上传失败:", error);
    throw new Error("无法初始化上传服务");
  }
};
// 上传文件分片
const uploadChunk = async (file, uploadId, chunk, index, totalChunks) => {
  // 为每个文件创建新的 AbortController
  if (!uploadControllers[file.name]) {
    uploadControllers[file.name] = new AbortController();
  }
  try {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("chunkIndex", index);
    formData.append("totalChunks", totalChunks);
    formData.append("uploadId", uploadId);
    formData.append("originalname", file.name);

    const config = {
      signal: uploadControllers[file.name].signal,
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        );
        progressMap.value[file.name] = {
          ...progressMap.value[file.name],
          chunkProgress: {
            ...progressMap.value[file.name]?.chunkProgress,
            [index]: progress,
          },
        };
      },
    };

    await axios.post("/api/uploadsBig/chunk", formData, config);
    return { success: true };
  } catch (error) {
    if (error.name === "AbortError") {
      return { success: false, aborted: true };
    }
    console.error(`分片 ${index} 上传失败:`, error);
    return { success: false, error: error.message };
  }
};
// 完成文件上传
const completeFileUpload = async (file, uploadId, fileHash, totalChunks) => {
  try {
    const response = await axios.post("/api/uploadsBig/complete", {
      uploadId,
      fileName: file.name,
      fileHash,
      totalChunks,
    });
    return {
      success: true,
      url: response.data.url,
    };
  } catch (error) {
    console.error("文件上传完成失败:", error);
    return {
      success: false,
      error: error.response?.data?.message || "上传完成失败",
    };
  }
};
// 计算是否所有文件都已完成哈希计算
const allHashesCalculated = computed(() => {
  return files.value.every(
    (file) =>
      fileStatus[file.name]?.status !== "hashing" &&
      fileStatus[file.name]?.status !== "pending"
  );
});
// 计算是否有文件正在计算哈希
const isCalculating = computed(() => {
  return files.value.some(
    (file) => fileStatus[file.name]?.status === "hashing"
  );
});
// 更新上传按钮的文本
const getUploadButtonText = () => {
  if (uploading.value) return "上传中...";
  if (isCalculating.value)
    return `计算哈希中 (${completedHashFiles.value}/${files.value.length})`;
  if (!allHashesCalculated.value) return "准备哈希计算...";
  return "一键上传";
};
// 计算已完成哈希的文件数量
const completedHashFiles = computed(() => {
  return files.value.filter(
    (file) => fileStatus[file.name]?.status !== "hashing"
  ).length;
});

// 计算文件的MD5哈希值（用于断点续传和文件完整性验证）
const calculateFileHash = (file) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("@/workers/hash.worker.js", import.meta.url)
    );
    console.log("开始计算哈希:", worker);
    worker.postMessage({
      file,
      chunkSize: CHUNK_SIZE, // 2MB chunks
    });

    worker.onmessage = (e) => {
      const { type, progress, hash } = e.data;

      if (type === "progress") {
        updateFileStatus(file.name, {
          hashProgress: progress,
        });
      } else if (type === "complete") {
        updateFileStatus(file.name, {
          status: "waiting",
          progress: 0,
        });
        resolve(hash);
        worker.terminate();
      } else if (type === "error") {
        updateFileStatus(file.name, {
          status: "hash_error",
        });
        reject(new Error("计算哈希时发生错误"));
        worker.terminate();
      }
    };
  });
};
// 封装文件清理的公共逻辑
const cleanupFileResources = async (file) => {
  try {
    // 中断上传请求
    if (uploadControllers[file.name]) {
      uploadControllers[file.name].abort();
      delete uploadControllers[file.name];
    }

    // 如果文件有uploadId，通知服务器清理分片
    if (file.uploadId) {
      await axios.post("/api/uploadsBig/cancel", {
        fileName: file.name,
        uploadId: file.uploadId,
      });
    }

    // 清理状态
    delete pausedFiles[file.name];
    delete fileStatus[file.name];

    return true;
  } catch (error) {
    console.error(`清理文件资源失败: ${error}`);
    return false;
  }
};
// 合并的移除和取消方法
const handleRemove = async (index, file) => {
  try {
    // 如果文件正在上传中，先取消上传
    if (fileStatus[file.name]?.status === "uploading") {
      await cancelUpload(file);
    } else {
      await cleanupFileResources(file);
    }

    // 从列表中移除文件
    files.value.splice(index, 1);
    uploadStatus.value = `已移除文件: ${file.name}`;
  } catch (error) {
    console.error(`移除文件失败: ${error}`);
    uploadStatus.value = `移除文件失败: ${file.name}`;
  }
};
// 修改重置方法
const resetUploader = async () => {
  try {
    // 中断所有进行中的上传
    Object.values(uploadControllers).forEach((controller) => {
      controller.abort();
    });

    // 获取所有未完成的上传ID
    const incompleteFiles = files.value.filter(
      (file) => fileStatus[file.name]?.status !== "completed"
    );

    // 通知服务器清理所有未完成文件的分片
    await Promise.all(
      incompleteFiles.map((file) =>
        axios
          .post("/api/uploadsBig/cancel", {
            fileName: file.name,
            uploadId: file.uploadId,
          })
          .catch((err) => console.error(`清理文件 ${file.name} 失败:`, err))
      )
    );

    // 重置所有状态
    files.value = [];
    uploadResults.value = [];
    uploadStatus.value = "";
    uploading.value = false;
    progressMap.value = {};
    Object.keys(uploadControllers).forEach(
      (key) => delete uploadControllers[key]
    );
    Object.keys(pausedFiles).forEach((key) => delete pausedFiles[key]);
  } catch (error) {
    console.error("重置失败:", error);
  }
};
// 切换文件上传状态
const toggleUpload = async (file) => {
  const status = fileStatus[file.name]?.status;

  if (status === "uploading") {
    // 暂停操作
    pausedFiles[file.name] = true;

    // 中止当前请求
    if (uploadControllers[file.name]) {
      uploadControllers[file.name].abort();
      delete uploadControllers[file.name];
    }

    // 立即更新状态
    updateFileStatus(file.name, {
      status: "paused",
      // 保持已上传分片的进度
      progress: fileStatus[file.name].progress,
      uploadedChunks: fileStatus[file.name].uploadedChunks || [],
    });
  } else if (status === "paused") {
    // 恢复操作
    pausedFiles[file.name] = false;
    uploadControllers[file.name] = new AbortController();

    // 更新状态为上传中
    updateFileStatus(file.name, {
      status: "uploading",
      progress: fileStatus[file.name].progress,
      uploadedChunks: fileStatus[file.name].uploadedChunks || [],
    });

    await resumeUpload(file);
  } else {
    await startUpload(file);
  }
};
// 恢复上传
const resumeUpload = async (file) => {
  try {
    pausedFiles[file.name] = false;
    updateFileStatus(file.name, { status: "uploading" });

    // 获取文件的上传状态
    const status = fileStatus[file.name];

    // 继续上传剩余分片
    await uploadFile(
      file,
      status.uploadId,
      status.fileHash,
      status.uploadedChunks,
      status.totalChunks
    );
  } catch (error) {
    console.error(`恢复上传失败: ${error}`);
    updateFileStatus(file.name, { status: "error" });
  }
};
// 取消单个文件上传
const cancelUpload = async (file) => {
  const success = await cleanupFileResources(file);
  if (success) {
    updateFileStatus(file.name, { status: "canceled" });
  }
};
// 添加并发控制函数
const createConcurrencyPool = (limit) => {
  let activeCount = 0;
  const queue = [];
  const run = async (task) => {
    if (activeCount >= limit) {
      await new Promise((resolve) => queue.push(resolve));
    }
    activeCount++;
    try {
      return await task();
    } finally {
      activeCount--;
      if (queue.length) queue.shift()();
    }
  };
  return run;
};
// 每个文件的并发控制 (6个分片并行)
const chunkConcurrency = createConcurrencyPool(6);
// 记录每个文件的上传状态
const fileStatus = reactive({});
// 更新文件上传状态函数
const updateFileStatus = (fileName, newStatus) => {
  if (!fileStatus[fileName]) {
    fileStatus[fileName] = {
      progress: 0,
      uploadedChunks: [],
      totalChunks: 0,
      status: "pending",
      uploadId: null,
      fileHash: null,
    };
  }

  Object.assign(fileStatus[fileName], {
    ...fileStatus[fileName],
    ...newStatus,
  });
};
</script>

<style scoped>
.container {
  width: 100%;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(52, 152, 219, 0.15);
  overflow: hidden;
  padding: 30px;
  transition: transform 0.3s ease;
}

header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f4f9;
}

h1 {
  color: #2c3e50;
  margin-bottom: 5px;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #3498db, #2c3e50);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #7f8c8d;
  font-size: 18px;
  font-weight: 400;
  margin-top: 10px;
}

.upload-container {
  background: #f8faff;
  border: 2px dashed #d0e6ff;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  margin: 20px 0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-container:before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(52, 152, 219, 0.05),
    rgba(46, 204, 113, 0.05),
    rgba(52, 152, 219, 0.05)
  );
  z-index: 0;
}

.upload-container:hover {
  border-color: #3498db;
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.15);
}

.file-select {
  margin: 20px 0;
  position: relative;
  z-index: 1;
}

.drop-area {
  padding: 50px 30px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px dashed #b8d6f0;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  backdrop-filter: blur(5px);
}

.drop-area.drag-over {
  background: rgba(227, 242, 253, 0.85);
  border-color: #3498db;
  transform: scale(1.02);
}

.drop-area p {
  margin: 15px 0;
  font-size: 18px;
  color: #3a556a;
}

.drop-area em {
  font-weight: 600;
  color: #3498db;
  font-style: normal;
  text-decoration: underline;
  cursor: pointer;
  transition: all 0.2s;
}

.drop-area em:hover {
  color: #2980b9;
  transform: translateY(-1px);
}

.hint {
  font-size: 14px;
  color: #5d7c9c;
  margin-top: 10px;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.flex-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 25px 0 15px;
  flex-wrap: wrap;
}

.btn {
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1;
  position: relative;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2980b9, #2573a7);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #ecf0f1, #d5dbdb);
  color: #2c3e50;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #d5dbdb, #cacfd2);
  transform: translateY(-3px);
}

.file-info {
  margin: 25px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8f0fe;
  text-align: left;
  backdrop-filter: blur(3px);
}

.selected-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 15px;
  border-bottom: 1px solid #e6edf6;
  font-size: 15px;
  color: #436280;
  font-weight: 500;
}

.add-more {
  color: #3498db;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.add-more:hover {
  text-decoration: underline;
}

.file-info ul {
  list-style: none;
  max-height: 300px;
  margin-bottom: 15px;
  overflow-x: hidden;
  overflow-y: auto;
}

.file-info li {
  padding: 14px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
  background: #f8fafc;
  margin-bottom: 10px;
}

.file-info li:hover {
  background-color: #f0f7ff;
}

.file-details {
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 50px);
}

.filename {
  font-weight: 600;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #2c3e50;
}

.filesize {
  font-size: 0.85em;
  color: #6b8aab;
  background: #edf5ff;
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}

.remove-btn {
  padding: 8px 12px;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #f9f9f9;
  color: #e74c3c;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #fceded;
  border-color: #e74c3c;
  transform: rotate(90deg);
}

.upload-actions {
  text-align: center;
  margin-top: 25px;
}

.start-upload {
  background: linear-gradient(135deg, #27ae60, #219654);
  padding: 16px 40px;
  font-size: 18px;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(39, 174, 96, 0.4);
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.start-upload:hover {
  background: linear-gradient(135deg, #219654, #1e8449);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.5);
}

.status {
  padding: 16px;
  margin: 25px 0;
  border-radius: 10px;
  text-align: center;
  font-size: 17px;
  font-weight: 500;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  z-index: 1;
  backdrop-filter: blur(3px);
}

.status::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  opacity: 0.15;
}

.uploading {
  background: rgba(225, 240, 250, 0.7);
  color: #3498db;
  border: 1px solid #c9e3f8;
}

.uploading::before {
  background: linear-gradient(90deg, #3498db, #85c1e9, #3498db);
  animation: progressBar 3s infinite linear;
}

.success {
  background: rgba(225, 247, 236, 0.7);
  color: #27ae60;
  border: 1px solid #c3e6cb;
}

.error {
  background: rgba(253, 237, 238, 0.7);
  color: #e74c3c;
  border: 1px solid #f5c6cb;
}

@keyframes progressBar {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 40px;
}

.feature {
  background: rgba(255, 255, 255, 0.9);
  padding: 25px 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid #e8f0fe;
  transition: all 0.3s;
  backdrop-filter: blur(3px);
}

.feature:hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: 0 12px 25px rgba(52, 152, 219, 0.15);
  border-color: #3498db;
}

.feature .icon {
  font-size: 40px;
  margin-bottom: 15px;
  color: #3498db;
  width: 80px;
  height: 80px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(52, 152, 219, 0.1);
}

.feature h3 {
  font-size: 19px;
  margin-bottom: 12px;
  color: #2c3e50;
  font-weight: 600;
}

.feature p {
  font-size: 15px;
  color: #617b98;
  line-height: 1.5;
}

.results-container {
  margin-top: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid #e8f0fe;
  text-align: left;
  backdrop-filter: blur(3px);
}

.results-container h3 {
  margin-bottom: 18px;
  color: #2c3e50;
  padding-bottom: 10px;
  border-bottom: 1px solid #e6edf6;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.result-item {
  padding: 18px;
  margin: 15px 0;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.9);
  border-left: 4px solid #3498db;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
}

.result-item:hover {
  transform: translateX(5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.05);
  border-left-width: 6px;
}

.result-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filename {
  font-weight: 500;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 10px;
  color: #2c3e50;
}

.success {
  color: #27ae60;
  font-weight: 600;
  white-space: nowrap;
  font-size: 15px;
}

.error {
  color: #e74c3c;
  font-weight: 600;
  white-space: nowrap;
  font-size: 15px;
}

.file-url {
  background: #edf6ff;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 12px;
  word-break: break-all;
  border: 1px dashed #b8d9f5;
}

.error-message {
  background: #fceded;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 12px;
  color: #e74c3c;
  border: 1px dashed #f5c2c7;
}

.upload-icon {
  font-size: 64px;
  color: #3498db;
  margin-bottom: 15px;
  opacity: 0.8;
  animation: float 3s ease-in-out infinite;
}
.progress-container {
  width: 100%;
  background: #eaeaea;
  border-radius: 4px;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  display: flex;
  padding-left: 5px;
}

.progress-bar {
  height: 8px;
  background: #3498db;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
}
.control-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.control-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: #e9ecef;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #dee2e6;
}

.control-btn.cancel {
  background: #ffd5d5;
  color: #dc3545;
}

.control-btn.cancel:hover {
  background: #ffc1c1;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 20px;
  }

  h1 {
    font-size: 28px;
  }

  .upload-container {
    padding: 20px 15px;
  }

  .drop-area {
    padding: 40px 20px;
  }

  .flex-buttons {
    flex-direction: column;
  }

  .features {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
}
</style>
