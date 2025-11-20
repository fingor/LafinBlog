<template>
  <div class="smart-qa-container">
    <!-- 头部标题 -->
    <div class="header-section">
      <h1 class="title">智能数据问答</h1>
      <p class="subtitle">用自然语言查询银行数据，支持指标、维度、时间等多维度分析</p>
    </div>

    <!-- 查询输入区域 -->
    <div class="query-section">
      <div class="input-group">
        <div class="input-wrapper">
          <input
            v-model="currentQuery"
            type="text"
            class="query-input"
            placeholder="请输入您的查询，例如：农业银行广东省分行的当月贷款人数比上月增加了多少？"
            @keyup.enter="executeQuery"
            @input="onQueryInput"
          />
          <button 
            class="query-button" 
            @click="viewSQL"
            :disabled="isLoading || !currentQuery.trim()"
          >
            查看SQL
          </button>
          <button 
            class="query-button" 
            @click="executeQuery"
            :disabled="isLoading || !currentQuery.trim()"
          >
            <svg v-if="!isLoading" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div v-else class="loading-spinner"></div>
            {{ isLoading ? '查询中...' : '查询' }}
          </button>
        </div>
      </div>

      <!-- 快捷查询建议 -->
      <div class="quick-suggestions">
        <div class="suggestion-title">推荐查询：</div>
        <div class="suggestion-tags">
          <span 
            v-for="suggestion in quickSuggestions" 
            :key="suggestion"
            class="suggestion-tag"
            @click="useSuggestion(suggestion)"
          >
            {{ suggestion }}
          </span>
        </div>
      </div>
      
      <!-- SQL显示区域 -->
      <div class="sql-display-section" v-if="showSQL && (sqlPreview || (queryResult && queryResult.sql))">
        <div class="sql-header">
          <h4 class="sql-title">生成的SQL语句</h4>
          <button class="sql-copy-button" @click="copySQL">
            📋 复制
          </button>
        </div>
        <div class="sql-content">
          <pre>{{ sqlPreview || (queryResult && queryResult.sql) }}</pre>
        </div>
      </div>
      
      
    </div>

    <button class="history-fab" @click="historyDrawerVisible = true" title="查询历史">🕘</button>

    <el-drawer v-model="historyDrawerVisible" direction="rtl" size="30%" title="查询历史">
      <div class="history-list">
        <div 
          v-for="item in queryHistory" 
          :key="item.id"
          class="history-item"
          @click="useHistoryItem(item.query)"
        >
          <div class="history-query">{{ item.query }}</div>
          <div class="history-time">{{ formatTime(item.timestamp) }}</div>
        </div>
      </div>
    </el-drawer>

    <!-- 查询结果区域 -->
    <div class="results-section" v-if="queryResult">
      <!-- 加载状态 -->
      <div class="loading-state" v-if="queryResult.loading">
        <div class="loading-spinner"></div>
        <p class="loading-message">{{ queryResult.message }}</p>
      </div>
      
      <!-- 结果头部 -->
      <div class="result-header" v-if="!queryResult.loading">
        <div class="result-info">
          <h3 class="result-title">查询结果</h3>
          <p class="result-explanation">{{ queryResult.explanation }}</p>
          <div class="method-indicator" v-if="queryResult.method">
            <span class="method-badge" :class="queryResult.method">
              {{ queryResult.method === 'text-dsl-sql' ? '🤖 AI智能分析' : '📋 规则引擎' }}
            </span>
            <span class="confidence-badge" v-if="queryResult.confidence">
              置信度: {{ Math.round(queryResult.confidence * 100) }}%
            </span>
          </div>
        </div>
        <div class="result-actions">
          <button class="action-button" @click="exportResult">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出
          </button>
        </div>
      </div>

      <!-- 数据可视化 -->
      <div class="chart-container" v-if="queryResult.data && queryResult.data.length > 0">
        <div ref="chartRef" class="g2plot-chart"></div>
      </div>

      <!-- 数据表格 -->
      <div class="data-table-container" v-if="queryResult.data && queryResult.data.length > 0">
        <h4 class="table-title">详细数据</h4>
        <div class="data-table">
          <table>
            <thead>
              <tr>
                <th v-for="column in getTableColumns(queryResult.data)" :key="column">
                  {{ formatColumnName(column) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in queryResult.data" :key="index">
                <td v-for="column in getTableColumns(queryResult.data)" :key="column">
                  {{ formatCellValue(row[column]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="error-message" v-if="!queryResult.success">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <h4>查询失败</h4>
          <p>{{ queryResult.error }}</p>
          <div class="error-suggestion" v-if="queryResult.suggestion">
            <strong>建议：</strong>{{ queryResult.suggestion }}
          </div>
        </div>
      </div>
    </div>

    

    
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue';
import SmartQAAPIService from '../api/smartQAAPIService';
import nlToSQL from '../api/naturalLanguageToSQL';
 

export default {
  name: 'SmartQA',
  components: {},
  setup() {
    const currentQuery = ref('');
    const isLoading = ref(false);
    const showSuggestions = ref(true);
    const queryResult = ref(null);
    const queryHistory = ref([]);
    const showSQL = ref(false);
    const sqlPreview = ref('');
    const chartRef = ref(null);
    const historyDrawerVisible = ref(false);
    let ChartLib = { Line: null, Column: null, Pie: null };
    let chartInstance = null;

    const quickSuggestions = [
      '农业银行广东省分行的当月贷款人数是多少？',
      '本月和上月相比，存款余额有什么变化？',
      '广东省的贷款客户数最近趋势如何？',
      '各分行的营业收入对比',
      '最近三个月的净利润变化趋势',
      '农业银行广东省分行的当月贷款人数比上月增加了多少？',
      '广东省各分行的存款余额排名前十的机构',
      '今年和去年相比，贷款客户数有什么变化？'
    ];

    // 执行查询
    const executeQuery = async () => {
      if (!currentQuery.value.trim() || isLoading.value) return;

      isLoading.value = true;
      showSuggestions.value = true;
      
      // 设置加载状态消息
      queryResult.value = {
        loading: true,
        message: '正在分析您的查询...'
      };

      try {
        const result = await SmartQAAPIService.processNaturalLanguageQuery(currentQuery.value);
        queryResult.value = result;

        // 添加到历史记录
        if (result.success) {
          addToHistory(currentQuery.value);
        }
      } catch (error) {
        console.error('查询失败:', error);
        queryResult.value = {
          success: false,
          error: '查询过程中发生错误，请稍后重试',
          suggestion: '请检查网络连接，或尝试简化查询语句'
        };
      } finally {
        isLoading.value = false;
      }
    };

    const viewSQL = async () => {
      if (!currentQuery.value.trim() || isLoading.value) return;
      try {
        const res = await nlToSQL.convert(currentQuery.value);
        if (res && res.success && res.sql) {
          sqlPreview.value = res.sql;
          showSQL.value = true;
        } else {
          sqlPreview.value = '';
          showSQL.value = false;
        }
      } catch (e) {
        sqlPreview.value = '';
        showSQL.value = false;
      }
    };

    // 输入处理
    const onQueryInput = () => {
      showSuggestions.value = true;
    };

    // 使用建议
    const useSuggestion = (suggestion) => {
      currentQuery.value = suggestion;
    };

    

    // 添加到历史记录
    const addToHistory = (query) => {
      const historyItem = {
        id: Date.now(),
        query: query,
        timestamp: new Date().toISOString(),
        success: true
      };
      
      queryHistory.value.unshift(historyItem);
      
      // 只保留最近10条
      if (queryHistory.value.length > 10) {
        queryHistory.value = queryHistory.value.slice(0, 10);
      }
      
      // 保存到本地存储
      localStorage.setItem('smartQAHistory', JSON.stringify(queryHistory.value));
    };

    // 使用历史记录
    const useHistoryItem = (query) => {
      currentQuery.value = query;
      executeQuery();
    };

    const initChartLib = async () => {
      const lib = await import('@antv/g2plot');
      ChartLib.Line = lib.Line;
      ChartLib.Column = lib.Column;
      ChartLib.Pie = lib.Pie;
    };

    const normalizeChart = (res) => {
      const data = res?.data || [];
      const type = res?.chartType || 'column';
      if (!Array.isArray(data) || data.length === 0) return null;
      const first = data[0];
      if ('record_date' in first || 'data_date' in first) {
        const xField = 'record_date' in first ? 'record_date' : 'data_date';
        const yField = 'metric_value' in first ? 'metric_value' : 'value';
        return { type: 'line', data: data.map(d => ({ date: d[xField], value: d[yField] })), config: { xField: 'date', yField: 'value', smooth: true } };
      }
      if ('current_value' in first || 'previous_value' in first) {
        const vals = [];
        data.forEach(d => {
          if ('current_value' in d) vals.push({ name: '本期', value: d.current_value });
          if ('previous_value' in d) vals.push({ name: '上期', value: d.previous_value });
        });
        return { type: 'column', data: vals, config: { xField: 'name', yField: 'value' } };
      }
      if ('value1' in first && 'value2' in first) {
        const vals = [];
        data.forEach(d => {
          vals.push({ name: '前值', value: d.value1 });
          vals.push({ name: '现值', value: d.value2 });
        });
        return { type: 'column', data: vals, config: { xField: 'name', yField: 'value' } };
      }
      if ('role_name' in first || 'region_name' in first || 'role_code' in first) {
        const labelKey = 'role_name' in first ? 'role_name' : ('region_name' in first ? 'region_name' : 'role_code');
        const valueKey = 'metric_value' in first ? 'metric_value' : 'value';
        return { type: 'column', data: data.map(d => ({ name: d[labelKey], value: d[valueKey] })), config: { xField: 'name', yField: 'value', columnStyle: { radius: [4,4,0,0] } } };
      }
      return { type: type === 'pie' ? 'pie' : 'column', data: data.map((d, i) => ({ name: d.name || `项${i+1}`, value: d.value || d.metric_value || 0 })), config: { xField: 'name', yField: 'value' } };
    };

    const renderChart = async () => {
      if (!queryResult.value || !queryResult.value.data || !chartRef.value) return;
      if (!ChartLib.Column) await initChartLib();
      const chartData = normalizeChart(queryResult.value);
      if (!chartData) return;
      if (chartInstance && chartInstance.destroy) chartInstance.destroy();
      const cfg = { data: chartData.data, autoFit: true, height: 300, padding: 'auto', ...chartData.config };
      switch (chartData.type) {
        case 'line':
          chartInstance = new ChartLib.Line(chartRef.value, cfg);
          break;
        case 'pie':
          chartInstance = new ChartLib.Pie(chartRef.value, { ...cfg, angleField: cfg.angleField || 'value', colorField: cfg.colorField || 'name', radius: cfg.radius || 0.8 });
          break;
        case 'column':
        default:
          chartInstance = new ChartLib.Column(chartRef.value, cfg);
          break;
      }
      chartInstance.render();
    };
    

    // 获取表格列
    const getTableColumns = (data) => {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]);
    };

    // 格式化列名
    const formatColumnName = (column) => {
      const nameMap = {
        'metric_name': '指标名称',
        'metric_value': '指标值',
        'region_name': '地区名称',
        'role_name': '机构名称',
        'data_date': '数据日期',
        'value1': '前值',
        'value2': '现值',
        'change_rate': '变化率(%)'
      };
      return nameMap[column] || column;
    };

    // 格式化单元格值
    const formatCellValue = (value) => {
      if (typeof value === 'number') {
        if (value > 1000000) {
          return (value / 10000).toFixed(2) + '万';
        } else if (value > 10000) {
          return (value / 10000).toFixed(2) + '万';
        } else {
          return value.toLocaleString();
        }
      }
      return value;
    };

    // 格式化时间
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) {
        return '刚刚';
      } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
      } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前';
      } else {
        return date.toLocaleDateString();
      }
    };

    // 导出结果
    const exportResult = () => {
      if (!queryResult.value || !queryResult.value.data) return;

      const data = queryResult.value.data;
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `查询结果_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    

    // 复制SQL语句
    const copySQL = async () => {
      const sqlText = sqlPreview.value || (queryResult.value && queryResult.value.sql) || '';
      if (!sqlText) return;
      try {
        await navigator.clipboard.writeText(sqlText);
        console.log('SQL已复制到剪贴板');
      } catch (error) {
        console.error('复制失败:', error);
        const textArea = document.createElement('textarea');
        textArea.value = sqlText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    };

    // 转换为CSV
    const convertToCSV = (data) => {
      const headers = Object.keys(data[0]);
      const csvHeaders = headers.map(h => formatColumnName(h)).join(',');
      const csvRows = data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      );
      return [csvHeaders, ...csvRows].join('\n');
    };

    // 加载历史记录
    const loadHistory = () => {
      const saved = localStorage.getItem('smartQAHistory');
      if (saved) {
        try {
          queryHistory.value = JSON.parse(saved);
        } catch (error) {
          console.error('加载历史记录失败:', error);
        }
      }
    };

    onMounted(() => {
      loadHistory();
    });

    watch(() => queryResult.value, async () => {
      if (queryResult.value && queryResult.value.success && queryResult.value.data && queryResult.value.data.length) {
        await nextTick();
        renderChart();
      }
    }, { deep: true });

    return {
      currentQuery,
      isLoading,
      showSuggestions,
      queryResult,
      queryHistory,
      quickSuggestions,
      showSQL,
      sqlPreview,
      executeQuery,
      viewSQL,
      onQueryInput,
      useSuggestion,
      useHistoryItem,
      historyDrawerVisible,
      chartRef,
      getTableColumns,
      formatColumnName,
      formatCellValue,
      formatTime,
      exportResult,
      copySQL
    };
  }
};
</script>

<style scoped>
.smart-qa-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header-section {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #718096;
  margin-bottom: 2rem;
}

.query-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.input-group {
  margin-bottom: 1rem;
}

.input-wrapper {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.query-input {
  flex: 1;
  padding: 1rem 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.query-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.query-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.query-button:hover:not(:disabled) {
  background: #3182ce;
}

.query-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.icon {
  width: 16px;
  height: 16px;
}

.quick-suggestions {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.suggestion-title {
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.suggestion-tag {
  padding: 0.5rem 1rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-tag:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.results-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.result-header {
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.result-info {
  flex: 1;
}

.result-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.result-explanation {
  color: #718096;
  margin-bottom: 0;
}

.method-indicator {
  margin-top: 0.5rem;
}

.method-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.method-badge.text-dsl-sql {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.method-badge.rule-based {
  background: #f0f4f8;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.confidence-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  background: #e6fffa;
  color: #234e52;
  border: 1px solid #b2f5ea;
  margin-left: 0.5rem;
}

.result-actions {
  display: flex;
  gap: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-message {
  margin-top: 1rem;
  color: #4a5568;
  font-size: 1.1rem;
}

.sql-display-section {
  margin-top: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.sql-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.sql-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.sql-copy-button {
  padding: 0.25rem 0.75rem;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.sql-copy-button:hover {
  background: #3182ce;
}

.sql-content {
  background: #1a202c;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.sql-content pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.sql-toggle-section {
  margin-top: 0.5rem;
  text-align: center;
}

.sql-toggle-button {
  padding: 0.5rem 1rem;
  background: transparent;
  color: #4299e1;
  border: 1px solid #4299e1;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.sql-toggle-button:hover {
  background: #4299e1;
  color: white;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background: #edf2f7;
}

.chart-container {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
}

.data-table-container {
  margin-top: 2rem;
}

.table-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 1rem;
}

.data-table {
  overflow-x: auto;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  background: #f7fafc;
  font-weight: 600;
  color: #4a5568;
}

.data-table tr:hover {
  background: #f7fafc;
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  color: #c53030;
}

.error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-content h4 {
  margin: 0 0 0.5rem 0;
  color: #c53030;
}

.error-content p {
  margin: 0 0 1rem 0;
}

.error-suggestion {
  background: rgba(255, 255, 255, 0.5);
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 1.5rem;
}

.history-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background: #edf2f7;
}

.history-query {
  flex: 1;
  color: #4a5568;
  font-size: 0.9rem;
}

.history-time {
  color: #a0aec0;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.history-fab {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #4299e1;
  color: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  cursor: pointer;
}

@media (max-width: 768px) {
  .smart-qa-container {
    padding: 1rem;
  }
  
  .input-wrapper {
    flex-direction: column;
  }
  
  .query-input {
    width: 100%;
  }
  
  .query-button {
    width: 100%;
    justify-content: center;
  }
  
  .result-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .examples-grid {
    grid-template-columns: 1fr;
  }
}
</style>