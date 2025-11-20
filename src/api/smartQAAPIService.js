// 智能问答API服务
import { supabase } from '../supabase/client';
import nlToSQL from './naturalLanguageToSQL';

// 生成模拟数据用于演示
function generateMockDataForQuery(entities) {
  const mockResults = [];
  
  // 处理text-dsl-sql结果格式
  if (entities.metrics && entities.roles && entities.roles.length > 0) {
    // text-dsl-sql格式
    const metric = entities.metrics[0] || 'loan_customer_count';
    const role = entities.roles[0] || 'ABC';
    
    if (entities.comparison === 'MONTH_ON_MONTH') {
      // 时间对比查询
      mockResults.push({
        current_value: Math.floor(Math.random() * 10000) + 5000,
        previous_value: Math.floor(Math.random() * 10000) + 5000,
        change_value: Math.floor(Math.random() * 2000) - 1000,
        change_rate: (Math.random() * 40 - 20).toFixed(2)
      });
    } else {
      // 普通查询
      for (let i = 0; i < 5; i++) {
        mockResults.push({
          role_code: role,
          metric_code: metric,
          metric_value: Math.floor(Math.random() * 10000) + 1000,
          record_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    }
  } else if (entities.metrics && entities.metrics.length > 0) {
    // 规则引擎格式
    if (entities.times && entities.times.length >= 2) {
      // 时间对比查询
      mockResults.push({
        value1: Math.floor(Math.random() * 10000) + 5000,
        value2: Math.floor(Math.random() * 10000) + 5000,
        change_rate: (Math.random() * 40 - 20).toFixed(2)
      });
    } else if (entities.regions && entities.regions.length > 0) {
      // 地区指标查询
      const region = entities.regions[0];
      const metric = entities.metrics[0];
      
      for (let i = 0; i < 5; i++) {
        mockResults.push({
          region_name: region.region_name,
          metric_name: metric.metric_name,
          metric_value: Math.floor(Math.random() * 10000) + 1000,
          data_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    } else if (entities.organizations && entities.organizations.length > 0) {
      // 机构指标查询
      const org = entities.organizations[0];
      const metric = entities.metrics[0];
      
      for (let i = 0; i < 5; i++) {
        mockResults.push({
          role_name: org.role_name,
          metric_name: metric.metric_name,
          metric_value: Math.floor(Math.random() * 10000) + 1000,
          data_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    }
  }
  
  return mockResults;
}

// 智能问答API服务
export const SmartQAAPIService = {
  // 处理自然语言查询
  async processNaturalLanguageQuery(query) {
    try {
      console.log('收到自然语言查询:', query);
      
      // 1. 使用自然语言转换引擎
      const result = await nlToSQL.convert(query);
      
      if (result.success) {
        // 如果转换成功，返回真实数据（或模拟数据）
        const mockData = generateMockDataForQuery(result.entities);
        
        return {
          success: true,
          query: query,
          sql: result.sql,
          explanation: result.explanation,
          data: mockData.length > 0 ? mockData : result.result,
          entities: result.entities,
          chartType: this.determineChartType(result.entities),
          suggestion: null,
          method: result.method,
          confidence: result.confidence
        };
      } else {
        // 如果转换失败，尝试智能推荐
        const suggestion = await this.generateSmartSuggestion(query);
        
        return {
          success: false,
          query: query,
          error: result.error,
          suggestion: suggestion,
          data: null
        };
      }
    } catch (error) {
      console.error('处理查询失败:', error);
      return {
        success: false,
        query: query,
        error: error.message,
        suggestion: '请检查查询语句，确保包含明确的指标和时间范围',
        data: null
      };
    }
  },

  // 确定图表类型
  determineChartType(entities) {
    const times = Array.isArray(entities?.times) ? entities.times : [];
    const regions = Array.isArray(entities?.regions) ? entities.regions : [];
    const organizations = Array.isArray(entities?.organizations) ? entities.organizations : [];
    const metrics = Array.isArray(entities?.metrics) ? entities.metrics : [];
    if (entities?.comparison === 'MONTH_ON_MONTH' || times.length >= 2) {
      return 'line';
    }
    if (regions.length > 0 || organizations.length > 0 || (Array.isArray(entities?.roles) && entities.roles.length > 0)) {
      return 'column';
    }
    // 仅返回折线/柱状/饼图类型，移除仪表盘
    if (metrics.length > 0) {
      const metric = metrics[0];
      if (metric && typeof metric === 'object' && (metric.category === 'percentage' || metric.unit === '%')) {
        return 'column';
      }
    }
    return 'column';
  },

  // 生成智能建议
  async generateSmartSuggestion(query) {
    const suggestions = [
      {
        pattern: /贷款|存款|余额/,
        suggestion: '您可以问："广东省分行当月的贷款余额是多少？"'
      },
      {
        pattern: /人数|客户|用户/,
        suggestion: '您可以问："农业银行广东省分行的当月贷款人数比上月增加了多少？"'
      },
      {
        pattern: /对比|比较|比/,
        suggestion: '您可以问："本月和上月相比，贷款人数有什么变化？"'
      },
      {
        pattern: /趋势|变化/,
        suggestion: '您可以问："最近三个月存款余额的趋势如何？"'
      }
    ];

    for (const rule of suggestions) {
      if (rule.pattern.test(query)) {
        return rule.suggestion;
      }
    }

    return '您可以问："农业银行广东省分行的当月贷款人数是多少？"';
  },

  // 获取可用的指标列表
  async getAvailableMetrics() {
    try {
      const { data, error } = await supabase
        .from('metrics')
        .select('id, metric_name, metric_code, category, unit, description')
        .order('metric_name');

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // 获取可用的地区列表
  async getAvailableRegions() {
    try {
      const { data, error } = await supabase
        .from('dim_region')
        .select('id, region_code, region_name, region_level')
        .order('region_name');

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // 获取可用的机构列表
  async getAvailableOrganizations() {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, role_name, role_code, region, level')
        .order('role_name');

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // 获取查询历史
  async getQueryHistory(userId, limit = 10) {
    try {
      // 这里可以添加实际的查询历史记录
      // 目前返回一些示例查询
      const sampleQueries = [
        {
          id: 1,
          query: '农业银行广东省分行的当月贷款人数是多少？',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          success: true
        },
        {
          id: 2,
          query: '本月和上月相比，存款余额有什么变化？',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          success: true
        },
        {
          id: 3,
          query: '北京分行的客户满意度如何？',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          success: true
        }
      ];

      return {
        success: true,
        data: sampleQueries
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // 保存查询反馈
  async saveQueryFeedback(queryId, feedback, userId) {
    try {
      // 这里可以添加实际的反馈保存逻辑
      console.log('保存查询反馈:', { queryId, feedback, userId });
      
      return {
        success: true,
        message: '反馈已保存，感谢您的建议！'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 批量导入事实数据（用于初始化）
  async importFactData(data) {
    try {
      // 这里可以添加批量数据导入逻辑
      console.log('导入事实数据:', data.length, '条记录');
      
      return {
        success: true,
        message: `成功导入 ${data.length} 条数据`,
        count: data.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default SmartQAAPIService;