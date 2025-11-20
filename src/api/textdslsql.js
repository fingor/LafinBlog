export const textDSLSQL = {
  async convert(text) {
    const t = (text || '').toLowerCase();
    const metrics = [];
    const roles = [];
    let comparison = null;
    let timeRange = null;
    if (t.includes('贷款人数')) metrics.push('loan_customer_count');
    if (t.includes('存款余额')) metrics.push('deposit_balance');
    if (t.includes('农业银行广东省分行')) roles.push('农业银行广东省分行');
    if (t.includes('广东省')) roles.push('广东省');
    if (t.includes('当月')) timeRange = 'current_month';
    if (t.includes('上月')) timeRange = timeRange ? timeRange : 'last_month';
    if (t.includes('比') || t.includes('相比') || t.includes('对比')) comparison = 'MONTH_ON_MONTH';
    if (metrics.length === 0) {
      return { success: false, error: '未识别到有效指标' };
    }
    const metric = metrics[0];
    const role = roles[0];
    let sql = '';
    if (comparison === 'MONTH_ON_MONTH') {
      sql = `select current_value, previous_value from fact_bank_metrics where metric_code='${metric}'`;
    } else {
      sql = `select '${role || ''}' as role_code, '${metric}' as metric_code, 100 as metric_value`;
    }
    return {
      success: true,
      sql,
      analysis: { metrics, roles, timeRange, comparison },
      confidence: 0.9
    };
  }
};