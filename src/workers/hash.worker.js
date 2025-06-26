self.importScripts(
  "https://cdn.jsdelivr.net/npm/spark-md5@3.0.2/spark-md5.min.js"
);

self.onmessage = async (e) => {
  const { file, chunkSize } = e.data;
  const totalChunks = Math.ceil(file.size / chunkSize);
  const spark = new self.SparkMD5.ArrayBuffer();

  try {
    // 添加初始进度
    self.postMessage({
      type: "progress",
      progress: 0,
    });
    // 流程​​：文件(File) → 切片(Blob) → 读取为ArrayBuffer → 交给SparkMD5计算哈希
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      // File 对象是 Blob 的子类，所以它拥有 Blob 的所有属性和方法。
      // File 对象还包含额外的信息，比如文件名（name）、最后修改时间（lastModified）等。
      // 当你对File进行slice时，得到的是一个普通的Blob（没有name等属性），但它的内容就是文件的一部分，所以这里定义名字叫chunkBlob
      const chunkBlob = file.slice(start, end);

      const chunkBuffer = await readFileChunk(chunkBlob);
      spark.append(chunkBuffer); //为什么要读成 ArrayBuffer？因为 SparkMD5 这个库需要 ArrayBuffer 来进行哈希计算

      const progress = Math.round(((i + 1) / totalChunks) * 100);
      self.postMessage({
        type: "progress",
        progress,
      });
    }

    self.postMessage({
      type: "complete",
      hash: spark.end(),
      fileName: file.name,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error.message,
    });
  }
};

function readFileChunk(blob) {
  return new Promise((resolve, reject) => {
    // FileReader 用于读取 Blob（包括 File）的内容
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("读取文件分片失败"));
    // readAsArrayBuffer（读取为 ArrayBuffer）,因为spark-md5需要ArrayBuffer格式而不是blob格式
    reader.readAsArrayBuffer(blob);
  });
}
