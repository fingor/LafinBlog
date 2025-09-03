<template>
    <div class="ai-chat-container">
      <!-- 示例 -->
       <div class="example-container">
        <!-- 接入了天气地图API，可以查询天气 -->
         <p style="color: #999;font-size: 14px;">模拟了天气的mcp功能可以查询天气&nbsp;示例:今天珠海天气如何</p>
       </div>
      <!-- 消息展示区 -->
      <div ref="chatWindow" class="chat-window">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message', msg.role]"
        >
          <img
            :src="msg.role === 'user' ? userAvatar : botAvatar"
            class="avatar"
          />
          <div class="bubble theme-bg">
            <!-- 打字机效果实现 -->
            <template v-if="msg.role === 'assistant' && msg.isStreaming">
              <div v-html="formatMarkdown(streamingText)"></div>
              <span class="cursor">|</span>
            </template>
            <div v-else v-html="formatMarkdown(msg.content)"></div>
          </div>
        </div>
      </div>
  
      <!-- 输入控制区 -->
      <div class="input-area">
        <el-input
          v-model="userInput"
          placeholder="输入问题..."
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 6 }"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.shift.enter="handleShiftEnter"
          :disabled="isLoading"
          ref="textAreaRef"
        />
        <el-button type="primary" @click="sendMessage" :loading="isLoading"
          >发送</el-button
        >
      </div>
      <!-- <div class="input-area">
        <el-input
          v-model="userInput"
          placeholder="输入问题..."
          @keyup.enter="sendMessage"
          :disabled="isLoading"
        />
        <el-button type="primary" @click="sendMessage" :loading="isLoading"
          >发送</el-button
        >
      </div> -->
    </div>
  </template>
  
  <script setup>
  import { ref, nextTick, onMounted } from "vue";
  import MarkdownIt from "markdown-it";
  import hljs from "highlight.js";
  import "highlight.js/styles/github.css";
  import { fetchEventSource } from "@microsoft/fetch-event-source"; // 或 @fortaine/fetch-event-source
  const textAreaRef = ref(null); // 新增textarea引用
  
  const chatWindow = ref(null);
  const messages = ref([
    { role: "assistant", content: "Yo bro！我是海森堡，需要什么货？" },
  ]);
  const userInput = ref("");
  const isLoading = ref(false);
  const streamingText = ref("");
  const streamingMessageIndex = ref(-1);
  
  // 添加请求防重复机制
  let currentController = null;
  
  const userAvatar = new URL("@/assets/imgs/user-avatar.png", import.meta.url)
    .href;
  const botAvatar = new URL("@/assets/imgs/bot-avatar.png", import.meta.url).href;
  
  const mdParser = new MarkdownIt({
    html: true,
    linkify: true,
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
          }</code></pre>`;
        } catch (__) {}
      }
      return `<pre class="hljs"><code>${mdParser.utils.escapeHtml(
        str
      )}</code></pre>`;
    },
  });
  
  function formatMarkdown(text) {
    return mdParser.render(text);
  }
  
  async function sendMessage() {
    if (!userInput.value.trim() || isLoading.value) return;
    
    // 取消之前的请求
    if (currentController) {
      currentController.abort();
    }
    currentController = new AbortController();
  
    // 添加用户消息
    messages.value.push({
      role: "user",
      content: userInput.value,
    });
  
    const question = userInput.value;
    userInput.value = "";
    scrollToBottom();
  
    // 准备AI消息占位
    messages.value.push({
      role: "assistant",
      content: "",
      isStreaming: true,
    });
  
    streamingMessageIndex.value = messages.value.length - 1;
    streamingText.value = "";
    isLoading.value = true;
    
    try {
      await fetchEventSource("/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
        signal: currentController.signal,
        onmessage(ev) {
          // 检查是否为结束标记
          if (ev.data === "[DONE]") {
            finalizeStreaming(); // 结束流式传输
            return;
          }
          const data = JSON.parse(ev.data);
          streamingText.value += data.choices?.[0]?.delta?.content || "";
        },
        onerror(err) {
          console.error("SSE连接错误:", err);
          // 添加错误消息到聊天中
          if (streamingMessageIndex.value !== -1) {
            messages.value[streamingMessageIndex.value].content = "连接服务器失败，请检查网络或稍后重试";
            messages.value[streamingMessageIndex.value].isStreaming = false;
          }
          throw err;
        },
        onclose() {
          finalizeStreaming(); // 调用结束逻辑（如关闭加载状态）
        },
      });
    } catch (error) {
      console.error("发送消息失败:", error);
      isLoading.value = false;
      currentController = null;
      
      // 如果是取消操作，不显示错误
      if (error.name === 'AbortError') {
        return;
      }
      
      // 如果消息还在streaming状态，显示错误
      if (streamingMessageIndex.value !== -1 && messages.value[streamingMessageIndex.value].isStreaming) {
        messages.value[streamingMessageIndex.value].content = "发送失败，请重试";
        messages.value[streamingMessageIndex.value].isStreaming = false;
      }
    }
  }
  
  function finalizeStreaming() {
    messages.value[streamingMessageIndex.value].content = streamingText.value;
    messages.value[streamingMessageIndex.value].isStreaming = false;
    streamingText.value = "";
    isLoading.value = false;
    currentController = null;
    scrollToBottom();
  }
  
  function scrollToBottom() {
    nextTick(() => {
      const container = chatWindow.value;
      if (container) {
        container.scrollTop = container.scrollHeight + 100;
      }
    });
  }
  
  // 处理Shift+Enter换行
  function handleShiftEnter() {
    // 计算当前光标位置
    const textarea = textAreaRef.value?.textarea;
    if (!textarea) return;
  
    const cursorPos = textarea.selectionStart;
  
    // 在光标处插入换行符
    userInput.value =
      userInput.value.substring(0, cursorPos) +
      "\n" +
      userInput.value.substring(cursorPos);
  
    // 更新光标位置
    nextTick(() => {
      textarea.selectionStart = cursorPos + 1;
      textarea.selectionEnd = cursorPos + 1;
    });
  }
  </script>
  
  <style scoped>
  /* 新增输入框样式 */
  ::v-deep .el-textarea__inner {
    resize: none; /* 禁用手动调整大小 */
    font-family: inherit;
    line-height: 1.5;
    padding: 12px;
    box-sizing: border-box;
    transition: height 0.2s ease;
  }
  .ai-chat-container {
    height: 80vh;
    display: flex;
    flex-direction: column;
    max-width: 800px;
    margin: 0 auto;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .chat-window {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .message {
    display: flex;
    margin-bottom: 20px;
  }
  
  .user {
    flex-direction: row-reverse;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin: 0 12px;
  }
  
  .bubble {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 18px;
    line-height: 1.5;
    position: relative;
    color: white;
  }
  
  .user .bubble {
    background-color: #1890ff;
    border-top-right-radius: 4px;
  }
  
  .assistant .bubble {
    background-color: white;
    border: 1px solid #eee;
    border-top-left-radius: 4px;
  }
  
  .input-area {
    display: flex;
    flex-flow: column;
    padding: 15px;
    border-top: 1px solid #eee;
  }
  
  .el-input {
    flex: 1;
    margin-right: 12px;
  }
  
  .cursor {
    animation: blink 1s infinite;
  }
  
  @keyframes blink {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  
  /* Markdown样式增强 */
  ::v-deep .hljs {
    border-radius: 6px;
    padding: 12px;
    margin: 8px 0;
  }
  
  ::v-deep table {
    border-collapse: collapse;
    margin: 12px 0;
  }
  
  ::v-deep td,
  ::v-deep th {
    border: 1px solid #ddd;
    padding: 8px;
  }
  </style>
  