<template>
  <div class="worker-demo">
    <h1>Web Worker Demo</h1>
    <div class="controls">
      <input type="number" v-model="number" min="1" max="42" />
      <button @click="calculateFibonacci">计算斐波那契数</button>
    </div>
    <div class="result" v-if="result !== null">结果: {{ result }}</div>
    <div class="loading" v-if="loading">计算中...</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      number: 10,
      result: null,
      worker: null,
      loading: false,
    };
  },
  methods: {
    // fibonacci(n) {
    //   if (n <= 1) return n;
    //   return this.fibonacci(n - 1) + this.fibonacci(n - 2);
    // },
    // calculateFibonacci() {
    //   this.loading = true;
    //   this.result = null;

    //   // 直接在主线程计算
    //   const result = this.fibonacci(this.number);
    //   this.result = result;
    //   this.loading = false;
    // },
    calculateFibonacci() {
      this.loading = true;
      this.result = null;
      // 创建 worker
      if (!this.worker) {
        // this.worker = new Worker(
        //   new URL("@/workers/fibonacci.worker.js", import.meta.url)
        // );
        this.worker = new Worker(
          new URL("../../workers/fibonacci.worker.js", import.meta.url)
        );
        // 监听 worker 返回的消息
        this.worker.onmessage = (e) => {
          this.result = e.data;
          this.loading = false;
        };
      }

      // 发送消息给 worker
      this.worker.postMessage(this.number);
    },
  },
  beforeUnmount() {
    // 组件销毁时终止 worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  },
};
</script>

<style scoped>
.worker-demo {
  padding: 20px;
}

.controls {
  margin: 20px 0;
}

input {
  margin-right: 10px;
  padding: 5px;
}

button {
  padding: 5px 10px;
}

.result,
.loading {
  margin-top: 20px;
}
</style>
