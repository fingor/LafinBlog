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
  name: 'GaugeChart',
  props: {
    data: {
      type: Array,
      required: true
    },
    chartType: {
      type: String,
      default: 'gauge'
    },
    title: {
      type: String,
      default: '仪表盘'
    }
  },
  setup(props) {
    const chartRef = ref(null);

    // 处理图表数据
    const processChartData = () => {
      if (!props.data || props.data.length === 0) {
        return { value: 0, maxValue: 100, label: '指标' };
      }

      const firstRow = props.data[0];
      const fields = Object.keys(firstRow);
      
      // 寻找数值字段
      const valueField = fields.find(field => 
        typeof firstRow[field] === 'number' || !isNaN(parseFloat(firstRow[field]))
      ) || fields[0];

      // 寻找标签字段
      const labelField = fields.find(field => 
        field !== valueField && typeof firstRow[field] === 'string'
      );

      const value = parseFloat(firstRow[valueField]) || 0;
      const maxValue = value > 100 ? Math.ceil(value * 1.2) : 100;
      const label = labelField ? firstRow[labelField] : '指标值';

      return { value, maxValue, label };
    };

    // 初始化图表
    const initChart = async () => {
      if (!chartRef.value) return;

      await nextTick();
      
      const { value, maxValue, label } = processChartData();
      
      const canvas = document.createElement('canvas');
      canvas.width = chartRef.value.clientWidth;
      canvas.height = 400;
      chartRef.value.innerHTML = '';
      chartRef.value.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      drawChart(ctx, canvas, value, maxValue, label);
    };

    // 绘制图表
    const drawChart = (ctx, canvas, value, maxValue, label) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 80;
      
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 计算角度
      const angle = (value / maxValue) * Math.PI;
      const startAngle = Math.PI; // 从左侧开始
      const endAngle = startAngle + angle;

      // 绘制背景弧
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + Math.PI);
      ctx.lineWidth = 30;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      // 绘制进度弧
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineWidth = 30;
      
      // 根据值设置颜色
      const percentage = value / maxValue;
      let color;
      if (percentage < 0.3) {
        color = '#f56565'; // 红色
      } else if (percentage < 0.7) {
        color = '#ed8936'; // 橙色
      } else {
        color = '#48bb78'; // 绿色
      }
      
      ctx.strokeStyle = color;
      ctx.stroke();

      // 绘制中心圆
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.7, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制指针
      const pointerAngle = endAngle;
      const pointerLength = radius * 0.8;
      const pointerX = centerX + Math.cos(pointerAngle) * pointerLength;
      const pointerY = centerY + Math.sin(pointerAngle) * pointerLength;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(pointerX, pointerY);
      ctx.strokeStyle = '#1a202c';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 绘制中心点
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#1a202c';
      ctx.fill();

      // 绘制刻度
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 1;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4a5568';
      
      for (let i = 0; i <= 10; i++) {
        const tickAngle = startAngle + (i / 10) * Math.PI;
        const tickStartX = centerX + Math.cos(tickAngle) * (radius - 10);
        const tickStartY = centerY + Math.sin(tickAngle) * (radius - 10);
        const tickEndX = centerX + Math.cos(tickAngle) * radius;
        const tickEndY = centerY + Math.sin(tickAngle) * radius;
        
        ctx.beginPath();
        ctx.moveTo(tickStartX, tickStartY);
        ctx.lineTo(tickEndX, tickEndY);
        ctx.stroke();
        
        // 绘制刻度值
        const labelX = centerX + Math.cos(tickAngle) * (radius + 20);
        const labelY = centerY + Math.sin(tickAngle) * (radius + 20);
        const value = (maxValue / 10) * i;
        ctx.fillText(value.toFixed(0), labelX, labelY + 4);
      }

      // 绘制数值
      ctx.fillStyle = '#1a202c';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(value.toFixed(1), centerX, centerY + 10);
      
      // 绘制标签
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#718096';
      ctx.fillText(label, centerX, centerY + 35);

      // 绘制百分比
      const percentageText = ((value / maxValue) * 100).toFixed(1);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(`${percentageText}%`, centerX, centerY - 30);
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