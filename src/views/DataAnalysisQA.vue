<template>
  <div class="data-analysis-qa">
    <div class="container">
      <!-- 头部标题 -->
      <div class="header">
        <h1 class="title">数据分析问答系统</h1>
        <p class="subtitle">智能分析银行数据，回答您的业务问题</p>
      </div>

      <!-- 聊天区域 -->
      <div class="chat-container">
        <!-- 消息列表 -->
        <div class="messages-container" ref="messagesContainer">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            :class="['message', message.type]"
          >
            <div class="message-content">
              <div class="message-header">
                <span class="message-role">{{ message.role }}</span>
                <span class="message-time">{{ formatTime(message.time) }}</span>
              </div>
              <div class="message-text">{{ message.content }}</div>
              <!-- 图表展示 -->
              <div v-if="message.chart" class="chart-container">
                <div class="chart-header">
                  <button 
                    @click="toggleFullscreen(message.id)" 
                    class="fullscreen-btn"
                    title="全屏查看"
                  >
                    🔍
                  </button>
                </div>
                <div 
                  :ref="el => setChartRef(el, message.id)" 
                  class="chart" 
                  :data-message-id="message.id"
                  :id="`chart-${message.id}`"
                >
                  <div class="chart-loading">图表加载中...</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-container">
          <div class="input-wrapper">
            <textarea
              v-model="currentMessage"
              @keydown.enter.prevent="handleSend"
              placeholder="请输入您的数据分析问题，例如：显示最近6个月的存款趋势..."
              class="message-input"
              rows="3"
            ></textarea>
            <button 
              @click="handleSend" 
              :disabled="isLoading || !currentMessage.trim()"
              class="send-button"
            >
              <span v-if="!isLoading">发送</span>
              <span v-else>分析中...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 快捷问题 -->
      <div class="quick-questions">
        <h3>快捷问题</h3>
        <div class="question-buttons">
          <button 
            v-for="question in quickQuestions" 
            :key="question"
            @click="selectQuickQuestion(question)"
            class="quick-question-btn"
          >
            {{ question }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, nextTick, onMounted } from 'vue'

// 延迟导入图表库，确保在客户端环境
let Pie, Line, Column, Bar

// 动态导入图表库
const initChartLibrary = async () => {
  try {
    console.log('开始初始化图表库...')
    const g2plot = await import('@antv/g2plot')
    Pie = g2plot.Pie
    Line = g2plot.Line
    Column = g2plot.Column
    Bar = g2plot.Bar
    console.log('图表库初始化成功:', { Pie, Line, Column, Bar })
    return true
  } catch (error) {
    console.error('图表库初始化失败:', error)
    return false
  }
}

import DataAnalysisMockService from '../api/dataAnalysisMock.js'

export default {
  name: 'DataAnalysisQA',
  setup() {
    // 响应式数据
    const messages = reactive([])
    const currentMessage = ref('')
    const isLoading = ref(false)
    const messagesContainer = ref(null)
    const chartRefs = reactive({})
    const chartInstances = reactive({})
    const fullscreenChart = ref(null)
    const chartLibraryLoaded = ref(false)
    
    // 在组件挂载时初始化图表库
    onMounted(async () => {
      console.log('组件挂载，开始初始化图表库...')
      chartLibraryLoaded.value = await initChartLibrary()
      console.log('图表库初始化完成:', chartLibraryLoaded.value)
    })

    // 快捷问题
    const quickQuestions = [
      '显示最近6个月的存款趋势',
      '各类贷款产品的占比分布',
      '各分行的业务量对比',
      '客户年龄段分布情况',
      '月度收入支出对比'
    ]

    // 初始化欢迎消息
    const initWelcomeMessage = () => {
      messages.push({
        id: Date.now(),
        role: '系统',
        content: '欢迎使用数据分析问答系统！我可以帮您分析银行数据，回答各种业务问题。请输入您的问题或选择快捷问题。',
        type: 'system',
        time: new Date()
      })
    }

    // 格式化时间
    const formatTime = (time) => {
      return new Date(time).toLocaleTimeString('zh-CN')
    }

    // 设置图表引用
    const setChartRef = (el, messageId) => {
      if (el) {
        chartRefs[messageId] = el
      }
    }

    // 全屏切换功能
    const toggleFullscreen = (messageId) => {
      const chartElement = chartRefs[messageId]
      if (chartElement) {
        if (!document.fullscreenElement) {
          // 进入全屏
          if (chartElement.requestFullscreen) {
            chartElement.requestFullscreen()
          } else if (chartElement.webkitRequestFullscreen) {
            chartElement.webkitRequestFullscreen()
          } else if (chartElement.msRequestFullscreen) {
            chartElement.msRequestFullscreen()
          }
        } else {
          // 退出全屏
          if (document.exitFullscreen) {
            document.exitFullscreen()
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen()
          }
        }
      }
    }

    // 滚动到底部
    const scrollToBottom = async () => {
      await nextTick()
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    // 生成模拟数据
    const generateMockData = (question) => {
      const lowerQuestion = question.toLowerCase()
      
      // 使用Mock服务获取数据
      const mockData = DataAnalysisMockService.getDataByQuestion(question)
      
      // 根据数据类型返回相应的图表配置
      switch (mockData.type) {
        case 'line':
          if (question.includes('存款') || question.includes('收入')) {
            return {
              type: 'line',
              data: mockData.data.map((item, index) => ({
                ...item,
                month: item.month || item.date,
                value: item.totalDeposits || item.income || item.transactions || item.amount,
                type: 'line'
              })),
              config: {
                title: mockData.title,
                xField: 'month',
                yField: 'value',
                smooth: true,
                point: {
                  size: 5,
                  shape: 'diamond'
                }
              }
            }
          }
          return {
            type: 'line',
            data: mockData.data,
            config: {
              title: mockData.title,
              xField: 'month',
              yField: 'value',
              smooth: true
            }
          }
          
        case 'pie':
          return {
            type: 'pie',
            data: mockData.data.map(item => ({
              type: item.product || item.type,
              value: item.amount || item.value || item.count
            })),
            config: {
              title: mockData.title,
              angleField: 'value',
              colorField: 'type',
              radius: 0.8,
              label: {
                type: 'outer',
                content: '{name} {percentage}'
              }
            }
          }
          
        case 'column':
          return {
            type: 'column',
            data: mockData.data.map(item => ({
              branch: item.branch || item.aspect || item.product,
              value: item.businessVolume || item.score || item.sales || item.revenue
            })),
            config: {
              title: mockData.title,
              xField: 'branch',
              yField: 'value',
              columnStyle: {
                radius: [4, 4, 0, 0]
              }
            }
          }
          
        case 'bar':
          return {
            type: 'bar',
            data: mockData.data,
            config: {
              title: mockData.title,
              xField: 'count',
              yField: 'ageGroup',
              barStyle: {
                radius: [0, 4, 4, 0]
              }
            }
          }
          
        default:
          return {
            type: 'column',
            data: mockData.data,
            config: {
              title: mockData.title,
              xField: 'x',
              yField: 'y'
            }
          }
      }
    }

    // 创建图表
    const createChart = async (chartData, container, messageId) => {
      console.log('开始创建图表:', chartData, container, messageId)
      
      // 确保图表库已加载
      if (!chartLibraryLoaded.value) {
        console.log('图表库尚未加载，等待1秒后重试...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (!chartLibraryLoaded.value) {
          console.error('图表库加载失败')
          const loadingElement = container.querySelector('.chart-loading')
          if (loadingElement) {
            loadingElement.textContent = '图表库加载失败，请刷新页面重试'
          }
          return
        }
      }
      
      if (!container) {
        console.error('图表容器为空')
        return
      }
      
      try {
        // 找到图表容器
        const chartContainer = container.querySelector('.chart') || container
        console.log('找到图表容器:', chartContainer)
        
        // 确保容器有正确的尺寸和样式
        if (!chartContainer.style.height) {
          chartContainer.style.height = '300px'
          chartContainer.style.width = '100%'
          chartContainer.style.display = 'block'
        }
        
        // 移除加载提示
        const loadingElement = chartContainer.querySelector('.chart-loading')
        if (loadingElement) {
          loadingElement.style.display = 'none'
        }
        
        const { type, data, config } = chartData
        console.log('图表数据:', { type, data, config })
        
        // 验证数据
        if (!data || !Array.isArray(data) || data.length === 0) {
          throw new Error('图表数据无效或为空')
        }
        
        let chart = null

        // 创建基础配置（不在配置中传递 container）
        const baseConfig = {
          data,
          autoFit: true,
          height: 300,
          padding: 'auto'
        }

        // 合并用户配置
        const chartConfig = { ...baseConfig, ...config }
        console.log('创建图表配置:', chartConfig)

        // 正确的构造用法：第一个参数为容器，第二个参数为配置
        switch (type) {
          case 'line':
            chart = new Line(chartContainer, chartConfig)
            break
          case 'pie':
            chart = new Pie(chartContainer, chartConfig)
            break
          case 'column':
            chart = new Column(chartContainer, chartConfig)
            break
          case 'bar':
            chart = new Bar(chartContainer, chartConfig)
            break
          default:
            chart = new Column(chartContainer, chartConfig)
        }

        console.log('图表实例创建完成，开始渲染...')
        chart.render()
        
        // 保存图表实例以便后续销毁（避免覆盖 DOM 引用）
        if (messageId) {
          // 使用单独的实例映射
          if (!chartInstances) {
            // 兜底：如果未定义则在组件作用域内创建（避免报错）
            // 注意：实际定义会在 setup 返回中新增
          }
          chartInstances[messageId] = chart
        }
        
        console.log('图表创建成功:', type, messageId)
      } catch (error) {
        console.error('图表创建失败:', error)
        console.error('错误详情:', error.message, error.stack)
        // 显示错误信息
        const loadingElement = container.querySelector('.chart-loading')
        if (loadingElement) {
          loadingElement.textContent = `图表加载失败: ${error.message}`
          loadingElement.style.display = 'flex'
        }
      }
    }

    // 处理发送消息
    const handleSend = async () => {
      if (!currentMessage.value.trim() || isLoading.value) return

      // 添加用户消息
      const userMessage = {
        id: Date.now(),
        role: '用户',
        content: currentMessage.value,
        type: 'user',
        time: new Date()
      }
      messages.push(userMessage)

      const question = currentMessage.value
      currentMessage.value = ''
      isLoading.value = true

      await scrollToBottom()

      // 模拟API延迟
      setTimeout(() => {
        // 生成分析结果
        const chartData = generateMockData(question)
        
        // 添加系统回复
        const systemMessage = {
          id: Date.now() + 1,
          role: 'AI助手',
          content: `根据您的提问"${question}"，我为您生成了相应的数据分析图表：${chartData.config.title}`,
          type: 'system',
          time: new Date(),
          chart: chartData
        }
        messages.push(systemMessage)

        // 创建图表 - 异步版本
        nextTick(async () => {
          console.log('准备创建图表，messageId:', systemMessage.id)
          
          // 等待DOM更新
          setTimeout(async () => {
            try {
              // 直接查找图表容器
              const container = document.querySelector(`[data-message-id="${systemMessage.id}"]`)
              console.log('找到图表容器:', container)
              
              if (container) {
                console.log('开始创建图表...')
                await createChart(chartData, container, systemMessage.id)
              } else {
                console.error('找不到图表容器')
                // 创建备用容器
                const fallbackContainer = document.createElement('div')
                fallbackContainer.style.width = '100%'
                fallbackContainer.style.height = '300px'
                fallbackContainer.style.border = '2px solid red'
                fallbackContainer.innerHTML = '<div>备用图表容器</div>'
                
                const messagesContainer = document.querySelector('.messages-container')
                if (messagesContainer) {
                  messagesContainer.appendChild(fallbackContainer)
                  await createChart(chartData, fallbackContainer, systemMessage.id)
                }
              }
            } catch (error) {
              console.error('图表创建过程出错:', error)
            }
          }, 300)
        })

        isLoading.value = false
        scrollToBottom()
      }, 1500)
    }

    // 选择快捷问题
    const selectQuickQuestion = (question) => {
      currentMessage.value = question
      handleSend()
    }


    // 组件挂载时初始化
    onMounted(() => {
      console.log('DataAnalysisQA组件挂载完成')
      initWelcomeMessage()
    })

    return {
      messages,
      currentMessage,
      isLoading,
      messagesContainer,
      quickQuestions,
      formatTime,
      setChartRef,
      toggleFullscreen,
      handleSend,
      selectQuickQuestion,
      chartLibraryLoaded,
      chartInstances
    }
  }
}
</script>

<style scoped>
.data-analysis-qa {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.message {
  margin-bottom: 20px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.system {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 15px 20px;
  border-radius: 20px;
  position: relative;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message.system .message-content {
  background: white;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.message-role {
  font-weight: 600;
}

.message-time {
  opacity: 0.7;
  font-size: 0.8rem;
}

.message-text {
  line-height: 1.5;
}

.chart-container {
  margin-top: 15px;
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.chart-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.fullscreen-btn {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.fullscreen-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.chart {
  height: 300px;
  width: 100%;
  position: relative;
}

.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  font-size: 14px;
}

.input-container {
  padding: 20px;
  background: white;
  border-top: 1px solid #e9ecef;
}

.input-wrapper {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 15px;
  border: 2px solid #e9ecef;
  border-radius: 15px;
  font-size: 1rem;
  resize: vertical;
  min-height: 60px;
  transition: border-color 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.send-button {
  padding: 15px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 60px;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-questions {
  padding: 30px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.quick-questions h3 {
  margin-bottom: 20px;
  color: #495057;
  font-size: 1.2rem;
}

.question-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-question-btn {
  padding: 10px 20px;
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.quick-question-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-analysis-qa {
    padding: 10px;
  }
  
  .header {
    padding: 20px;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .input-wrapper {
    flex-direction: column;
  }
  
  .send-button {
    width: 100%;
  }
  
  .question-buttons {
    justify-content: center;
  }
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 全屏模式样式 */
.chart:fullscreen {
  background: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart:-webkit-full-screen {
  background: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart:-moz-full-screen {
  background: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart:-ms-fullscreen {
  background: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

</style>