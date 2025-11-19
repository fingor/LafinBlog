import Mock from 'mockjs'

// 银行数据分析Mock服务
export const DataAnalysisMockService = {
  // 生成存款趋势数据
  generateDepositTrend: (months = 6) => {
    return Mock.mock({
      [`data|${months}`]: [{
        'month|+1': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        'totalDeposits|1000000-5000000': 1000000,
        'avgDeposit|5000-20000': 10000,
        'growthRate|0.5-15.0': 5.0,
        'newAccounts|100-500': 200
      }]
    }).data.map(item => ({
      month: item.month,
      totalDeposits: Math.round(item.totalDeposits),
      avgDeposit: Math.round(item.avgDeposit),
      growthRate: Math.round(item.growthRate * 10) / 10,
      newAccounts: item.newAccounts
    }))
  },

  // 生成贷款产品分布数据
  generateLoanDistribution: () => {
    return Mock.mock({
      'data|5': [{
        'product|+1': ['个人住房贷款', '个人消费贷款', '企业经营贷款', '信用卡分期', '其他贷款'],
        'amount|500000-2000000': 1000000,
        'count|50-200': 100,
        'avgAmount|10000-50000': 20000,
        'defaultRate|0.1-3.0': 1.0
      }]
    }).data.map(item => ({
      product: item.product,
      amount: Math.round(item.amount),
      count: item.count,
      avgAmount: Math.round(item.avgAmount),
      defaultRate: Math.round(item.defaultRate * 10) / 10
    }))
  },

  // 生成分行业务量数据
  generateBranchBusiness: (branchCount = 8) => {
    return Mock.mock({
      [`data|${branchCount}`]: [{
        'branch|+1': ['北京分行', '上海分行', '广州分行', '深圳分行', '杭州分行', '南京分行', '成都分行', '武汉分行', '西安分行', '重庆分行'],
        'businessVolume|1000-3000': 2000,
        'customerCount|5000-15000': 10000,
        'revenue|500000-2000000': 1000000,
        'satisfaction|85-98': 92
      }]
    }).data.map(item => ({
      branch: item.branch,
      businessVolume: item.businessVolume,
      customerCount: item.customerCount,
      revenue: Math.round(item.revenue),
      satisfaction: Math.round(item.satisfaction)
    }))
  },

  // 生成客户年龄分布数据
  generateCustomerAgeDistribution: () => {
    return Mock.mock({
      'data|6': [{
        'ageGroup|+1': ['18-25岁', '26-35岁', '36-45岁', '46-55岁', '56-65岁', '65岁以上'],
        'count|100-800': 400,
        'percentage|5-25': 15,
        'avgBalance|5000-50000': 20000,
        'activeRate|60-90': 75
      }]
    }).data.map(item => ({
      ageGroup: item.ageGroup,
      count: item.count,
      percentage: Math.round(item.percentage * 10) / 10,
      avgBalance: Math.round(item.avgBalance),
      activeRate: Math.round(item.activeRate)
    }))
  },

  // 生成收入支出对比数据
  generateIncomeExpenseComparison: (months = 6) => {
    return Mock.mock({
      [`data|${months}`]: [{
        'month|+1': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        'income|5000-15000': 10000,
        'expense|3000-12000': 8000,
        'profit|1000-5000': 2000,
        'profitMargin|10-40': 20
      }]
    }).data.map(item => ({
      month: item.month,
      income: Math.round(item.income),
      expense: Math.round(item.expense),
      profit: Math.round(item.profit),
      profitMargin: Math.round(item.profitMargin * 10) / 10
    }))
  },

  // 生成风险分析数据
  generateRiskAnalysis: () => {
    return Mock.mock({
      'data|4': [{
        'riskType|+1': ['信用风险', '市场风险', '操作风险', '流动性风险'],
        'riskLevel|+1': ['低', '中', '高'],
        'score|1-10': 5,
        'trend|+1': ['下降', '稳定', '上升'],
        'impact|1000-10000': 5000
      }]
    }).data.map(item => ({
      riskType: item.riskType,
      riskLevel: item.riskLevel,
      score: item.score,
      trend: item.trend,
      impact: Math.round(item.impact)
    }))
  },

  // 生成客户满意度数据
  generateCustomerSatisfaction: () => {
    return Mock.mock({
      'data|5': [{
        'aspect|+1': ['服务态度', '办理效率', '产品丰富度', '网点环境', '数字化服务'],
        'score|75-95': 85,
        'respondents|50-200': 100,
        'improvement|1-10': 5
      }]
    }).data.map(item => ({
      aspect: item.aspect,
      score: item.score,
      respondents: item.respondents,
      improvement: item.improvement
    }))
  },

  // 生成交易趋势数据
  generateTransactionTrend: (days = 30) => {
    return Mock.mock({
      [`data|${days}`]: [{
        'date|+1': function() {
          const date = new Date()
          date.setDate(date.getDate() - this.$index)
          return date.toISOString().split('T')[0]
        },
        'transactions|1000-5000': 2500,
        'amount|100000-1000000': 500000,
        'successRate|95-99': 97
      }]
    }).data.map(item => ({
      date: item.date,
      transactions: item.transactions,
      amount: Math.round(item.amount),
      successRate: item.successRate
    }))
  },

  // 生成产品对比数据
  generateProductComparison: () => {
    return Mock.mock({
      'data|4': [{
        'product|+1': ['储蓄产品', '理财产品', '基金产品', '保险产品'],
        'sales|100-500': 250,
        'revenue|50000-200000': 100000,
        'customerSatisfaction|80-95': 88,
        'marketShare|15-35': 25
      }]
    }).data.map(item => ({
      product: item.product,
      sales: item.sales,
      revenue: Math.round(item.revenue),
      customerSatisfaction: item.customerSatisfaction,
      marketShare: Math.round(item.marketShare * 10) / 10
    }))
  },

  // 根据问题类型获取相应的数据
  getDataByQuestion: (question) => {
    const lowerQuestion = question.toLowerCase()
    
    if (lowerQuestion.includes('存款') && lowerQuestion.includes('趋势')) {
      return {
        type: 'line',
        title: '存款趋势分析',
        data: DataAnalysisMockService.generateDepositTrend()
      }
    }
    
    if (lowerQuestion.includes('贷款') && lowerQuestion.includes('分布')) {
      return {
        type: 'pie',
        title: '贷款产品分布',
        data: DataAnalysisMockService.generateLoanDistribution()
      }
    }
    
    if (lowerQuestion.includes('分行') && lowerQuestion.includes('业务')) {
      return {
        type: 'column',
        title: '分行业务量对比',
        data: DataAnalysisMockService.generateBranchBusiness()
      }
    }
    
    if (lowerQuestion.includes('客户') && lowerQuestion.includes('年龄')) {
      return {
        type: 'bar',
        title: '客户年龄分布',
        data: DataAnalysisMockService.generateCustomerAgeDistribution()
      }
    }
    
    if (lowerQuestion.includes('收入') && lowerQuestion.includes('支出')) {
      return {
        type: 'line',
        title: '收入支出对比',
        data: DataAnalysisMockService.generateIncomeExpenseComparison()
      }
    }
    
    if (lowerQuestion.includes('风险')) {
      return {
        type: 'radar',
        title: '风险分析',
        data: DataAnalysisMockService.generateRiskAnalysis()
      }
    }
    
    if (lowerQuestion.includes('满意度')) {
      return {
        type: 'column',
        title: '客户满意度分析',
        data: DataAnalysisMockService.generateCustomerSatisfaction()
      }
    }
    
    if (lowerQuestion.includes('交易') && lowerQuestion.includes('趋势')) {
      return {
        type: 'line',
        title: '交易趋势分析',
        data: DataAnalysisMockService.generateTransactionTrend()
      }
    }
    
    if (lowerQuestion.includes('产品') && lowerQuestion.includes('对比')) {
      return {
        type: 'column',
        title: '产品对比分析',
        data: DataAnalysisMockService.generateProductComparison()
      }
    }
    
    // 默认返回存款趋势数据
    return {
      type: 'line',
      title: '默认数据分析',
      data: DataAnalysisMockService.generateDepositTrend()
    }
  }
}

export default DataAnalysisMockService