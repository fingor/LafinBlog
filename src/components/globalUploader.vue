<template>
  <div>
    <!-- 文件选择输入框 -->
    <form @submit.prevent="handleSubmit">
      <input type="file" @change="handleFileChange" ref="fileInput" />
      <!-- 文件预览信息 -->
      <div v-if="selectedFile">
        <p>
          Selected File: {{ selectedFile.name }} ({{
            formatBytes(selectedFile.size)
          }})
        </p>
        <!-- 进度条显示 -->
        <progress :value="uploadProgress" max="100"></progress>
      </div>
      <!-- 提交按钮 -->
      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import axios from "axios";

export default {
  setup() {
    const fileInput = ref(null);
    const selectedFile = ref(null);
    const uploadProgress = ref(0);
    const uploadedChunks = ref(new Set());
    const CHUNK_SIZE = 5 * 1024 * 1024; // 每个分片大小为5MB

    /**
     * 处理文件选择事件
     * @param event 文件选择事件
     */
    const handleFileChange = (event) => {
      selectedFile.value = event.target.files[0];
      console.log(
        `Selected file: ${selectedFile.value.name}, Size: ${formatBytes(
          selectedFile.value.size
        )}`
      );
    };

    /**
     * 格式化字节为可读格式
     * @param bytes 字节数
     * @returns {string} 可读格式的文件大小
     */
    const formatBytes = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    /**
     * 检查某个分片是否已经上传
     * @param fileName 文件名
     * @param chunkNumber 分片编号
     * @returns {Promise<boolean>}
     */
    const isChunkUploaded = async (fileName, chunkNumber) => {
      try {
        const response = await axios.get(
          `/check-chunk-uploaded?fileName=${fileName}&chunkNumber=${chunkNumber}`
        );
        return response.data.uploaded;
      } catch (error) {
        console.error("Error checking chunk upload status:", error);
        return false;
      }
    };

    /**
     * 上传文件分片
     * @param chunk 分片数据
     * @param fileName 文件名
     * @param chunkNumber 当前分片编号
     * @param totalChunks 总分片数
     * @returns {Promise<void>}
     */
    const uploadChunk = async (chunk, fileName, chunkNumber, totalChunks) => {
      const formData = new FormData();
      formData.append("file", new Blob([chunk]), fileName);
      formData.append("chunkNumber", chunkNumber);
      formData.append("totalChunks", totalChunks);

      try {
        const response = await axios.post("/upload", formData, {
          onUploadProgress: (progressEvent) => {
            const percentage =
              (chunkNumber / totalChunks) * 100 +
              (progressEvent.loaded / progressEvent.total) *
                (100 / totalChunks);
            uploadProgress.value = Math.min(percentage, 100);
          },
        });
        if (response.status !== 200) {
          console.error("Failed to upload chunk");
        } else {
          uploadedChunks.value.add(chunkNumber); // 记录已上传的分片
        }
      } catch (error) {
        console.error("Error uploading chunk:", error);
      }
    };

    /**
     * 合并所有分片
     * @param fileName 文件名
     * @param totalChunks 总分片数
     * @returns {Promise<void>}
     */
    const mergeChunks = async (fileName, totalChunks) => {
      try {
        const response = await axios.post("/merge", { fileName, totalChunks });
        if (response.status === 200) {
          console.log("All chunks merged successfully.");
        } else {
          console.error("Failed to merge chunks.");
        }
      } catch (error) {
        console.error("Error merging chunks:", error);
      }
    };

    /**
     * 表单提交处理函数
     * @returns {Promise<void>}
     */
    const handleSubmit = async () => {
      if (!selectedFile.value) return;

      const file = selectedFile.value;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      let start = 0;
      let chunkNumber = 1;

      while (start < file.size) {
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        if (!(await isChunkUploaded(file.name, chunkNumber))) {
          await uploadChunk(chunk, file.name, chunkNumber, totalChunks);
        }

        start = end;
        chunkNumber++;
      }

      await mergeChunks(file.name, totalChunks);
      uploadProgress.value = 100;
    };

    /**
     * 加载保存的上传进度
     */
    const loadSavedProgress = () => {
      const savedProgress = JSON.parse(localStorage.getItem("uploadProgress"));
      if (
        savedProgress &&
        savedProgress.fileName === selectedFile.value?.name
      ) {
        uploadedChunks.value = new Set(savedProgress.uploadedChunks);
        uploadProgress.value = savedProgress.progress;
      }
    };

    /**
     * 定时保存上传进度
     */
    const saveUploadProgress = () => {
      localStorage.setItem(
        "uploadProgress",
        JSON.stringify({
          fileName: selectedFile.value?.name,
          uploadedChunks: Array.from(uploadedChunks.value),
          progress: uploadProgress.value,
        })
      );
    };

    onMounted(() => {
      loadSavedProgress(); // 页面加载时恢复上传进度
      setInterval(saveUploadProgress, 5000); // 每5秒保存一次上传进度
    });

    return {
      fileInput,
      selectedFile,
      uploadProgress,
      handleFileChange,
      formatBytes,
      handleSubmit,
    };
  },
};
</script>
