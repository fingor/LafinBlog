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
  name: 'LineChart',
  props: {
    data: {
      type: Array,
      required: true
    },
    chartType: {
      type: String,
      default: 'line'
    },
    title: {
      type: String,
      default: '数据趋势图'
    }
  },
  setup(props) {
    const chartRef = ref(null);
    let chartInstance = null;

    // 处理图表数据
    const processChartData = () => {
      if (!props.data || props.data.length === 0) {
        return { categories: [], series: [] };
      }

      // 自动识别数据字段
      const firstRow = props.data[0];
      const fields = Object.keys(firstRow);
      
      // 寻找可能的X轴字段（时间、日期、名称等）
      const xField = fields.find(field => 
        field.toLowerCase().includes('date') ||
        field.toLowerCase().includes('time') ||
        field.toLowerCase().includes('month') ||
        field.toLowerCase().includes('name')
      ) || fields[0];

      // 寻找数值字段作为Y轴
      const yFields = fields.filter(field => 
        field !== xField && 
        (typeof firstRow[field] === 'number' || !isNaN(parseFloat(firstRow[field])))
      );

      const categories = props.data.map(item => item[xField]);
      
      const series = yFields.map(field => ({
        name: field,
        data: props.data.map(item => parseFloat(item[field]) || 0),
        smooth: true,
        lineStyle: {
          width: 3
        },
        symbol: 'circle',
        symbolSize: 6
      }));

      return { categories, series };
    };

    // 初始化图表
    const initChart = async () => {
      if (!chartRef.value) return;

      await nextTick();
      
      const { categories, series } = processChartData();
      
      // 使用原生Canvas绘制图表
      const canvas = document.createElement('canvas');
      canvas.width = chartRef.value.clientWidth;
      canvas.height = 400;
      chartRef.value.innerHTML = '';
      chartRef.value.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      drawChart(ctx, canvas, categories, series);
    };

    // 绘制图表
    const drawChart = (ctx, canvas, categories, series) => {
      const padding = { top: 40, right: 40, bottom: 60, left: 80 };
      const chartWidth = canvas.width - padding.left - padding.right;
      const chartHeight = canvas.height - padding.top - padding.bottom;

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 计算数据范围
      let maxValue = 0;
      let minValue = 0;
      series.forEach(s => {
        s.data.forEach(value => {
          maxValue = Math.max(maxValue, value);
          minValue = Math.min(minValue, value);
        });
      });

      // 添加一些边距
      const valueRange = maxValue - minValue;
      maxValue += valueRange * 0.1;
      minValue = Math.max(0, minValue - valueRange * 0.1);

      // 绘制网格线
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      
      // 水平网格线
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
      }

      // 垂直网格线
      const stepX = chartWidth / (categories.length - 1);
      for (let i = 0; i < categories.length; i++) {
        const x = padding.left + stepX * i;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();
      }

      // 绘制坐标轴
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 2;
      
      // X轴
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartHeight);
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.stroke();

      // Y轴
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.stroke();

      // 绘制数据线
      series.forEach((s, seriesIndex) => {
        const colors = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#38b2ac'];
        const color = colors[seriesIndex % colors.length];
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();

        s.data.forEach((value, index) => {
          const x = padding.left + stepX * index;
          const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // 绘制数据点
        ctx.fillStyle = color;
        s.data.forEach((value, index) => {
          const x = padding.left + stepX * index;
          const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      });

      // 绘制标签
      ctx.fillStyle = '#4a5568';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';

      // X轴标签
      categories.forEach((category, index) => {
        const x = padding.left + stepX * index;
        ctx.fillText(String(category), x, padding.top + chartHeight + 20);
      });

      // Y轴标签
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const value = minValue + ((maxValue - minValue) / 5) * (5 - i);
        const y = padding.top + (chartHeight / 5) * i;
        ctx.fillText(value.toFixed(0), padding.left - 10, y + 4);
      }

      // 绘制图例
      ctx.textAlign = 'left';
      series.forEach((s, index) => {
        const colors = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#38b2ac'];
        const color = colors[index % colors.length];
        const legendY = 20 + index * 20;
        
        ctx.fillStyle = color;
        ctx.fillRect(padding.left + chartWidth - 100, legendY - 6, 12, 12);
        
        ctx.fillStyle = '#4a5568';
        ctx.fillText(s.name, padding.left + chartWidth - 80, legendY + 2);
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