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
          <!-- <li v-for="(file, index) in files" :key="file.name + index">
            <div class="file-details">
              <span class="filename">{{ file.name }}</span>
              <span class="filesize">{{ formatBytes(file.size) }}</span>
            </div>
            <button class="remove-btn" @click="removeFile(index)">
              <i class="fas fa-times"></i>
            </button>
          </li> -->
          <!-- // 修改文件信息区域，添加进度条 -->
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
                  {{ fileStatus[file.name].progress }}% ({{
                    fileStatus[file.name].uploadedChunks
                  }}/{{ fileStatus[file.name].totalChunks }})
                </div>
              </div>
            </div>
            <button class="remove-btn" @click="removeFile(index)">
              X
              <!-- <i class="fas fa-times"></i> -->
            </button>
          </li>
        </ul>
      </div>

      <div class="flex-buttons">
        <button
          class="btn btn-primary"
          :disabled="uploading"
          @click="uploadFiles"
        >
          <i class="fas fa-upload"></i>
          {{ uploading ? "上传中..." : "开始上传" }}
        </button>
        <button
          class="btn btn-secondary"
          :disabled="uploading"
          @click="resetUploader"
        >
          <i class="fas fa-redo"></i> 重置
        </button>
      </div>
      <div v-if="uploadStatus" :class="['status', statusClass]">
        <i :class="statusIcon" style="margin-right: 10px"></i>
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

    <div class="features">
      <div class="feature">
        <div class="icon"><i class="fas fa-bolt"></i></div>
        <h3>分片上传</h3>
        <p>将大文件分割为小块上传，提高稳定性和上传效率</p>
      </div>
      <div class="feature">
        <div class="icon"><i class="fas fa-sync-alt"></i></div>
        <h3>断点续传</h3>
        <p>网络中断后可以从中断点继续上传，无需重传</p>
      </div>
      <div class="feature">
        <div class="icon"><i class="fas fa-chart-line"></i></div>
        <h3>进度监控</h3>
        <p>实时显示每个文件的上传进度和状态</p>
      </div>
      <div class="feature">
        <div class="icon"><i class="fas fa-shield-alt"></i></div>
        <h3>文件校验</h3>
        <p>自动检查文件完整性和大小，确保上传正确</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import SparkMD5 from "spark-md5";
import axios from "axios";

const files = ref([]);
const dragOver = ref(false);
const uploadStatus = ref("");
const uploadResults = ref([]);
const fileInput = ref(null);
const uploading = ref(false);
const progressMap = ref({});

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
  // 过滤重复文件
  const existingFileNames = files.value.map((f) => f.name);
  const uniqueFiles = newFiles.filter(
    (file) => !existingFileNames.includes(file.name)
  );

  if (uniqueFiles.length > 0) {
    files.value = [...files.value, ...uniqueFiles];
    uploadStatus.value = `已添加 ${uniqueFiles.length} 个文件`;
  }
};

// 移除单个文件
const removeFile = (index) => {
  const removedFile = files.value[index];
  files.value.splice(index, 1);
  delete progressMap.value[removedFile.name];
  uploadStatus.value = `已移除文件: ${removedFile.name}`;
};

// 重置上传器
const resetUploader = () => {
  files.value = [];
  uploadResults.value = [];
  uploadStatus.value = "";
  uploading.value = false;
  progressMap.value = {};
};
// 为文件生成唯一标识符
const generateFileIdentifier = (file) => {
  return `${file.name}-${file.size}-${file.lastModified}`;
};
// 初始化文件上传
const initFileUpload = async (file) => {
  try {
    const identifier = generateFileIdentifier(file);
    const response = await axios.post("/api/upload/init", {
      fileName: file.name,
      fileSize: file.size,
      identifier,
    });
    return response.data;
  } catch (error) {
    console.error("初始化上传失败:", error);
    throw new Error("无法初始化上传服务");
  }
};

// 分片上传模拟函数
// const uploadChunk = async (file, start, end) => {
//   return new Promise((resolve) => {
//     // 模拟上传延迟（实际应用中应替换为真实上传逻辑）
//     setTimeout(() => {
//       resolve({ success: true, bytesUploaded: end - start });
//     }, Math.random() * 300 + 200);
//   });
// };

// 上传文件分片
const uploadChunk = async (file, uploadId, chunk, index, totalChunks) => {
  try {
    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("chunkIndex", index);
    formData.append("totalChunks", totalChunks);
    formData.append("uploadId", uploadId);
    formData.append("originalname", file.name);

    const config = {
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

    await axios.post("/api/upload/chunk", formData, config);
    return { success: true };
  } catch (error) {
    console.error(`分片 ${index} 上传失败:`, error);
    return { success: false, error: error.message };
  }
};
// 完成文件上传
const completeFileUpload = async (file, uploadId, fileHash) => {
  try {
    const response = await axios.post("/api/upload/complete", {
      uploadId,
      fileName: file.name,
      identifier: generateFileIdentifier(file),
      fileHash,
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
// 计算文件的MD5哈希值（用于断点续传和文件完整性验证）
const calculateFileHash = (file) => {
  return new Promise((resolve) => {
    // 实际项目中应使用crypto.subtle.digest计算MD5
    // 这里简化为返回文件名+大小+时间的组合值
    setTimeout(() => {
      resolve(`${file.name}_${file.size}_${file.lastModified}`);
    }, 300);
  });
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
      uploadedChunks: 0,
      totalChunks: 0,
      status: "pending",
    };
  }

  Object.assign(fileStatus[fileName], {
    ...fileStatus[fileName],
    ...newStatus,
  });
};

// 更新分片上传状态函数
const updateChunkStatus = (fileName, uploaded, total) => {
  if (fileStatus[fileName]) {
    fileStatus[fileName].uploadedChunks = uploaded;
    fileStatus[fileName].progress = Math.round((uploaded / total) * 100);
  }
};

// 修改后的 uploadFile 方法（并行上传分片）
const uploadFile = async (file) => {
  const CHUNK_SIZE = 2 * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  try {
    // 初始化文件上传状态
    updateFileStatus(file.name, {
      totalChunks,
      uploadedChunks: 0,
      progress: 0,
      status: "uploading",
    });

    const identifier = generateFileIdentifier(file);
    const fileHash = await calculateFileHash(file);

    // 初始化上传
    const { uploadId, uploadedChunks = [] } = await initFileUpload(file);

    // 更新状态为已上传分片数
    updateChunkStatus(file.name, uploadedChunks.length, totalChunks);

    // 创建所有分片的上传任务
    const chunkTasks = [];

    for (let index = 0; index < totalChunks; index++) {
      if (uploadedChunks.includes(index)) continue;

      const start = index * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      chunkTasks.push(() =>
        chunkConcurrency(() =>
          uploadChunk(file, uploadId, chunk, index, totalChunks)
        ).then(() => {
          // 每个分片上传成功后更新状态
          updateChunkStatus(
            file.name,
            fileStatus[file.name].uploadedChunks + 1,
            totalChunks
          );
        })
      );
    }

    // 并行上传所有分片
    await Promise.all(chunkTasks.map((task) => task()));

    // 完成上传
    const result = await completeFileUpload(file, uploadId, fileHash);

    // 更新状态为完成
    updateFileStatus(file.name, {
      status: result.success ? "completed" : "failed",
    });

    return result;
  } catch (error) {
    // 更新状态为错误
    updateFileStatus(file.name, { status: "error" });

    return {
      success: false,
      error: error.message || "上传过程中发生错误",
    };
  }
};

// 修改后的 uploadFiles 方法（并行上传文件）
const uploadFiles = async () => {
  if (files.value.length === 0) {
    uploadStatus.value = "请先选择文件";
    return;
  }

  uploadStatus.value = "开始上传文件...";
  uploading.value = true;
  uploadResults.value = [];

  try {
    // 初始化所有文件状态
    files.value.forEach((file) => {
      updateFileStatus(file.name, {
        status: "pending",
        progress: 0,
      });
    });

    // 并行上传所有文件
    const uploadPromises = files.value.map((file) => uploadFile(file));
    const results = await Promise.allSettled(uploadPromises);

    // 处理结果
    results.forEach((result, index) => {
      const file = files.value[index];
      const value =
        result.status === "fulfilled"
          ? result.value
          : {
              success: false,
              error: result.reason?.message || "未知错误",
            };

      uploadResults.value.push({ file, ...value });

      if (value.success) {
        uploadStatus.value += `\n${file.name} 上传成功`;
      } else {
        uploadStatus.value += `\n${file.name} 上传失败: ${value.error}`;
      }
    });

    // 计算统计信息
    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;

    uploadStatus.value += `\n上传完成! 成功: ${successCount}, 失败: ${
      files.value.length - successCount
    }`;
  } catch (error) {
    console.error("上传过程出错:", error);
    uploadStatus.value = `上传失败: ${error.message}`;
  } finally {
    uploading.value = false;
  }
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

.container:hover {
  transform: translateY(-5px);
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
  transform: translateX(5px);
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
}

.progress-bar {
  height: 8px;
  background: #3498db;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #555;
  text-align: center;
  position: absolute;
  top: 0;
  width: 100%;
  line-height: 8px;
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
