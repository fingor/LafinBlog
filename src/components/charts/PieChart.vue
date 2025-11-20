<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="chart-actions">
        <button class="chart-action" @click="exportChart">📊</button>
      </div>
    </div>
    <div ref="chartRef" class="chart-content"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue';

export default {
  name: 'PieChart',
  props: {
    data: {
      type: Array,
      required: true
    },
    chartType: {
      type: String,
      default: 'pie'
    },
    title: {
      type: String,
      default: '饼图'
    }
  },
  setup(props) {
    const chartRef = ref(null);

    // 处理图表数据
    const processChartData = () => {
      if (!props.data || props.data.length === 0) {
        return { labels: [], values: [] };
      }

      const firstRow = props.data[0];
      const fields = Object.keys(firstRow);
      
      // 寻找标签字段（通常是字符串类型的第一个字段）
      const labelField = fields.find(field => 
        typeof firstRow[field] === 'string'
      ) || fields[0];

      // 寻找数值字段
      const valueField = fields.find(field => 
        field !== labelField && 
        (typeof firstRow[field] === 'number' || !isNaN(parseFloat(firstRow[field])))
      ) || fields[1];

      const labels = props.data.map(item => item[labelField]);
      const values = props.data.map(item => parseFloat(item[valueField]) || 0);

      return { labels, values };
    };

    // 初始化图表
    const initChart = async () => {
      if (!chartRef.value) return;

      await nextTick();
      
      const { labels, values } = processChartData();
      
      const canvas = document.createElement('canvas');
      canvas.width = chartRef.value.clientWidth;
      canvas.height = 400;
      chartRef.value.innerHTML = '';
      chartRef.value.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      drawChart(ctx, canvas, labels, values);
    };

    // 绘制图表
    const drawChart = (ctx, canvas, labels, values) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 60;

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 计算总和
      const total = values.reduce((sum, value) => sum + value, 0);
      
      // 颜色数组
      const colors = [
        '#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#38b2ac',
        '#f56565', '#ed64a6', '#d69e2e', '#4fd1c7', '#667eea'
      ];

      // 绘制饼图
      let currentAngle = -Math.PI / 2; // 从顶部开始
      
      values.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        // 绘制扇形
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        
        // 绘制边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制标签线和文字
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
        
        // 绘制连接线
        const lineStartX = centerX + Math.cos(labelAngle) * radius;
        const lineStartY = centerY + Math.sin(labelAngle) * radius;
        
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(labelX, labelY);
        ctx.stroke();
        
        // 绘制标签文字
        ctx.fillStyle = '#1a202c';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        
        const percentage = ((value / total) * 100).toFixed(1);
        const labelText = `${labels[index]} (${percentage}%)`;
        
        ctx.fillText(labelText, labelX, labelY - 5);
        ctx.fillText(value.toLocaleString(), labelX, labelY + 10);
        
        currentAngle += sliceAngle;
      });

      // 绘制中心圆
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 在中心显示总数
      ctx.fillStyle = '#1a202c';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('总计', centerX, centerY - 5);
      ctx.fillText(total.toLocaleString(), centerX, centerY + 15);

      // 绘制图例
      const legendX = 20;
      let legendY = 20;
      
      labels.forEach((label, index) => {
        // 颜色块
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(legendX, legendY, 12, 12);
        
        // 文字
        ctx.fillStyle = '#4a5568';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, legendX + 20, legendY + 10);
        
        legendY += 20;
      });
    };

    // 导出图表
    const exportChart = () => {
      if (!chartRef.value) return;
      
      const canvas = chartRef.value.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `${props.title}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    };

    // 监听数据变化
    watch(() => props.data, () => {
      initChart();
    }, { deep: true });

    onMounted(() => {
      initChart();
      
      // 响应式处理
      window.addEventListener('resize', () => {
        setTimeout(initChart, 100);
      });
    });

    return {
      chartRef,
      exportChart
    };
  }
};
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 0.5rem;
}

.chart-action {
  padding: 0.5rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-action:hover {
  background: #edf2f7;
}

.chart-content {
  width: 100%;
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-content canvas {
  max-width: 100%;
  height: auto;
}

@media (max-width: 768px) {
  .chart-container {
    padding: 1rem;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>