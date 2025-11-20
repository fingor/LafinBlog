// 自然语言到SQL转换引擎
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { textDSLSQL } from './textDSLSQL';

// 实体类型定义
const ENTITY_TYPES = {
  METRIC: 'metric',
  REGION: 'region', 
  ORGANIZATION: 'organization',
  TIME: 'time',
  COMPARISON: 'comparison'
};

// 时间关键词映射
const TIME_KEYWORDS = {
  '当月': 'current_month',
  '上月': 'last_month',
  '本月': 'current_month',
  '上个月': 'last_month',
  '今年': 'current_year',
  '去年': 'last_year',
  '今天': 'today',
  '昨天': 'yesterday'
};

// 对比关键词
const COMPARISON_KEYWORDS = {
  '比': 'compare',
  '对比': 'compare',
  '相比': 'compare',
  '多于': 'greater_than',
  '少于': 'less_than',
  '增加': 'increase',
  '减少': 'decrease',
  '多了': 'increase',
  '少了': 'decrease'
};

class NaturalLanguageToSQL {
  constructor() {
    this.entityCache = new Map();
    this.templateCache = new Map();
  }

  // 主要转换方法
  async convert(naturalLanguage) {
    try {
      console.log('开始转换自然语言:', naturalLanguage);
      
      // 首先尝试使用text-dsl-sql技术
      console.log('尝试使用text-dsl-sql技术...');
      let dslResult;
      
      try {
        dslResult = await textDSLSQL.convert(naturalLanguage);
      } catch (dslError) {
        console.warn('text-dsl-sql转换出错:', dslError);
        dslResult = { success: false, error: dslError.message };
      }
      
      if (dslResult.success && dslResult.sql) {
        console.log('text-dsl-sql转换成功:', dslResult);
        
        // 执行DSL生成的SQL
        const result = await this.executeQuery(dslResult.sql);
        
        return {
          success: true,
          sql: dslResult.sql,
          entities: dslResult.analysis,
          result: result,
          explanation: this.generateDSLExplanation(dslResult, result),
          method: 'text-dsl-sql',
          confidence: dslResult.confidence || 0.8
        };
      }
      
      console.log('text-dsl-sql转换失败，使用传统规则引擎...');
      
      // 传统规则引擎作为后备方案
      try {
        // 1. 预处理文本
        const processedText = this.preprocessText(naturalLanguage);
        
        // 2. 实体识别
        const entities = await this.extractEntities(processedText);
        console.log('识别到的实体:', entities);
        
        // 验证必需实体
        if (entities.metrics.length === 0 && entities.organizations.length === 0) {
          throw new Error('无法识别查询中的关键信息（指标或机构）');
        }
        
        // 3. 查询模板匹配
        const template = await this.matchTemplate(processedText, entities);
        console.log('匹配的模板:', template);
        
        // 4. 生成SQL
        const sql = this.generateSQL(template, entities);
        console.log('生成的SQL:', sql);
        
        // 5. 执行查询
        const result = await this.executeQuery(sql);
        
        return {
          success: true,
          sql: sql,
          entities: entities,
          result: result,
          explanation: this.generateExplanation(entities, result),
          method: 'rule-based',
          confidence: 0.6
        };
      } catch (ruleError) {
        console.error('规则引擎也失败:', ruleError);
        return {
          success: false,
          error: ruleError.message || '查询转换失败',
          suggestion: this.generateSuggestion(naturalLanguage),
          fallback: true
        };
      }
    } catch (error) {
      console.error('自然语言转换失败:', error);
      return {
        success: false,
        error: error.message || '未知错误',
        suggestion: this.generateSuggestion(naturalLanguage),
        fallback: true
      };
    }
  }

  // 文本预处理
  preprocessText(text) {
    // 移除标点符号，统一格式
    return text
      .replace(/[，。！？；：""''（）]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // 实体识别
  async extractEntities(text) {
    const entities = {
      metrics: [],
      regions: [],
      organizations: [],
      times: [],
      comparisons: []
    };
    if (isSupabaseConfigured) {
      const { data: synonyms } = await supabase
        .from('entity_synonyms')
        .select('entity_type, entity_id, synonym');
      if (synonyms) {
        for (const synonym of synonyms) {
          if (text.includes(synonym.synonym.toLowerCase())) {
            const entityData = await this.getEntityData(synonym.entity_type, synonym.entity_id);
            switch (synonym.entity_type) {
              case 'metric':
                entities.metrics.push({ id: synonym.entity_id, synonym: synonym.synonym, ...entityData });
                break;
              case 'region':
                entities.regions.push({ id: synonym.entity_id, synonym: synonym.synonym, ...entityData });
                break;
              case 'organization':
                entities.organizations.push({ id: synonym.entity_id, synonym: synonym.synonym, ...entityData });
                break;
            }
          }
        }
      }
    } else {
      const localMetricMap = [
        { keyword: '贷款人数', metric_code: 'loan_customer_count', metric_name: '贷款人数' },
        { keyword: '存款余额', metric_code: 'deposit_balance', metric_name: '存款余额' },
        { keyword: '净利润', metric_code: 'net_profit', metric_name: '净利润' }
      ];
      const localRegionMap = [
        { keyword: '广东省', region_name: '广东省', region_code: 'GD' }
      ];
      const localOrgMap = [
        { keyword: '农业银行广东省分行', role_name: '农业银行广东省分行', role_code: 'ABC_GD' }
      ];
      for (const m of localMetricMap) {
        if (text.includes(m.keyword.toLowerCase())) entities.metrics.push(m);
      }
      for (const r of localRegionMap) {
        if (text.includes(r.keyword.toLowerCase())) entities.regions.push(r);
      }
      for (const o of localOrgMap) {
        if (text.includes(o.keyword.toLowerCase())) entities.organizations.push(o);
      }
    }

    // 识别时间实体
    for (const [keyword, type] of Object.entries(TIME_KEYWORDS)) {
      if (text.includes(keyword)) {
        entities.times.push({
          type: type,
          keyword: keyword,
          date: this.getDateByKeyword(type)
        });
      }
    }

    // 识别对比关系
    for (const [keyword, type] of Object.entries(COMPARISON_KEYWORDS)) {
      if (text.includes(keyword)) {
        entities.comparisons.push({
          type: type,
          keyword: keyword
        });
      }
    }

    return entities;
  }

  // 获取实体详细信息
  async getEntityData(entityType, entityId) {
    const cacheKey = `${entityType}_${entityId}`;
    if (this.entityCache.has(cacheKey)) {
      return this.entityCache.get(cacheKey);
    }

    let data = null;
    
    switch (entityType) {
      case 'metric':
        if (isSupabaseConfigured) {
          const { data: metric } = await supabase.from('metrics').select('*').eq('id', entityId).single();
          data = metric;
        }
        break;
      
      case 'region':
        if (isSupabaseConfigured) {
          const { data: region } = await supabase.from('dim_region').select('*').eq('id', entityId).single();
          data = region;
        }
        break;
      
      case 'organization':
        if (isSupabaseConfigured) {
          const { data: role } = await supabase.from('roles').select('*').eq('id', entityId).single();
          data = role;
        }
        break;
    }

    if (data) {
      this.entityCache.set(cacheKey, data);
    }
    
    return data;
  }

  // 根据关键词获取日期
  getDateByKeyword(keyword) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    
    switch (keyword) {
      case 'current_month':
        return `${year}-${month.toString().padStart(2, '0')}-01`;
      case 'last_month':
        const lastMonth = month === 1 ? 12 : month - 1;
        const lastMonthYear = month === 1 ? year - 1 : year;
        return `${lastMonthYear}-${lastMonth.toString().padStart(2, '0')}-01`;
      case 'current_year':
        return `${year}-01-01`;
      case 'last_year':
        return `${year - 1}-01-01`;
      case 'today':
        return today.toISOString().split('T')[0];
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      default:
        return today.toISOString().split('T')[0];
    }
  }

  // 模板匹配
  async matchTemplate(text, entities) {
    let templates = null;
    if (isSupabaseConfigured) {
      const res = await supabase.from('nl_query_templates').select('*');
      templates = res.data;
    } else {
      templates = [
        { id: 1, required_entities: [{ type: 'metric' }], template_pattern: '{organization}{metric}{time1}', sql_template: 'select \"{metric}\" as metric_code, 100 as metric_value' }
      ];
    }

    if (!templates) {
      throw new Error('未找到查询模板');
    }

    // 根据实体类型和查询模式匹配最佳模板
    let bestTemplate = null;
    let bestScore = 0;

    for (const template of templates) {
      const score = this.calculateTemplateScore(template, entities, text);
      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }

    if (!bestTemplate) {
      throw new Error('无法匹配合适的查询模板');
    }

    return bestTemplate;
  }

  // 计算模板匹配分数
  calculateTemplateScore(template, entities, text) {
    let score = 0;
    const requiredEntities = template.required_entities || [];
    
    // 检查必需实体是否都存在
    for (const required of requiredEntities) {
      const entityType = required.type;
      if (entities[entityType + 's'] && entities[entityType + 's'].length > 0) {
        score += 10;
      }
    }

    // 检查文本模式匹配
    if (template.template_pattern) {
      const pattern = template.template_pattern.toLowerCase();
      if (text.includes(pattern.replace(/\{[^}]+\}/g, ''))) {
        score += 5;
      }
    }

    return score;
  }

  // 生成SQL
  generateSQL(template, entities) {
    let sql = template.sql_template;
    
    // 替换实体占位符
    if (entities.metrics.length > 0) {
      const metric = entities.metrics[0];
      sql = sql.replace(/\{metric\}/g, metric.metric_code);
    }

    if (entities.regions.length > 0) {
      const region = entities.regions[0];
      sql = sql.replace(/\{region\}/g, region.region_name);
    }

    if (entities.organizations.length > 0) {
      const org = entities.organizations[0];
      sql = sql.replace(/\{organization\}/g, org.role_name);
    }

    if (entities.times.length > 0) {
      entities.times.forEach((time, index) => {
        sql = sql.replace(new RegExp(`\\{time${index + 1}\\}`, 'g'), time.date);
      });
    }

    return sql;
  }

  // 执行查询
  async executeQuery(sql) {
    try {
      if (!isSupabaseConfigured) {
        return [];
      }
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
      if (error) {
        throw new Error(`SQL执行失败: ${error.message}`);
      }
      return data;
    } catch (error) {
      return [];
    }
  }

  // 生成解释文本
  generateExplanation(entities, result) {
    let explanation = '查询结果：';
    
    if (entities.metrics.length > 0) {
      explanation += entities.metrics[0].metric_name;
    }

    if (entities.regions.length > 0) {
      explanation += `在${entities.regions[0].region_name}`;
    }

    if (entities.organizations.length > 0) {
      explanation += `${entities.organizations[0].role_name}的`;
    }

    if (result && result.length > 0) {
      explanation += `查询到${result.length}条记录`;
    }

    return explanation;
  }

  // 生成DSL解释文本
  generateDSLExplanation(dslResult, result) {
    const { analysis, sql } = dslResult;
    let explanation = '智能分析结果：';
    
    if (analysis.metrics && analysis.metrics.length > 0) {
      explanation += `查询指标「${analysis.metrics.join(', ')}」`;
    }

    if (analysis.roles && analysis.roles.length > 0) {
      explanation += `在「${analysis.roles.join(', ')}」`;
    }

    if (analysis.timeRange) {
      explanation += `时间范围「${analysis.timeRange}」`;
    }

    if (analysis.comparison) {
      explanation += `对比类型「${analysis.comparison}」`;
    }

    if (result && result.length > 0) {
      explanation += `，查询到${result.length}条记录`;
    }

    return explanation;
  }

  // 生成建议
  generateSuggestion(failedQuery) {
    const suggestions = [
      '请确保查询包含明确的指标名称，如"贷款人数"、"存款余额"等',
      '请指定查询的时间范围，如"当月"、"上月"、"今年"等',
      '可以指定地区或机构，如"广东省分行"、"北京分行"等',
      '支持对比查询，如"本月比上月增加了多少"'
    ];

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }
}

export default new NaturalLanguageToSQL();