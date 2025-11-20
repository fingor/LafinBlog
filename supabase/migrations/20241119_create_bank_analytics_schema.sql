-- 银行数据分析系统数据库设计
-- 支持自然语言查询的智能分析系统

-- 角色表（银行组织架构）
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL, -- 角色名称：总行、分行、支行
    role_code VARCHAR(50) UNIQUE NOT NULL, -- 角色编码：HEAD_OFFICE, BRANCH, SUB_BRANCH
    parent_id INTEGER REFERENCES roles(id), -- 上级角色
    region VARCHAR(100), -- 所属地区
    level INTEGER NOT NULL, -- 层级：1总行、2分行、3支行
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 指标表（银行业务指标定义）
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(200) NOT NULL, -- 指标名称：贷款人数、存款余额等
    metric_code VARCHAR(100) UNIQUE NOT NULL, -- 指标编码：LOAN_COUNT, DEPOSIT_BALANCE
    category VARCHAR(100), -- 指标类别：贷款、存款、客户、风险等
    unit VARCHAR(50), -- 单位：人、万元、百分比等
    data_type VARCHAR(50) DEFAULT 'numeric', -- 数据类型
    description TEXT, -- 指标描述
    aggregation_type VARCHAR(50) DEFAULT 'sum', -- 聚合方式：sum, avg, count
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 维度表（业务维度定义）
CREATE TABLE dimensions (
    id SERIAL PRIMARY KEY,
    dimension_name VARCHAR(100) NOT NULL, -- 维度名称：时间、地区、产品等
    dimension_code VARCHAR(100) UNIQUE NOT NULL, -- 维度编码：TIME, REGION, PRODUCT
    hierarchy_level INTEGER DEFAULT 1, -- 层级
    parent_dimension_id INTEGER REFERENCES dimensions(id), -- 父维度
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 时间维度表
CREATE TABLE dim_time (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    month INTEGER NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    day INTEGER NOT NULL,
    week_day INTEGER NOT NULL,
    week_day_name VARCHAR(20) NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 地区维度表
CREATE TABLE dim_region (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(50) UNIQUE NOT NULL,
    region_name VARCHAR(100) NOT NULL,
    parent_region_code VARCHAR(50) REFERENCES dim_region(region_code),
    region_level INTEGER NOT NULL, -- 1省、2市、3区县
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 产品维度表
CREATE TABLE dim_product (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_category VARCHAR(100), -- 产品类别：贷款、存款、理财等
    product_subcategory VARCHAR(100), -- 子类别
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 事实数据表（核心业务数据）
CREATE TABLE fact_bank_metrics (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id),
    metric_id INTEGER REFERENCES metrics(id),
    time_id INTEGER REFERENCES dim_time(id),
    region_id INTEGER REFERENCES dim_region(id),
    product_id INTEGER REFERENCES dim_product(id),
    metric_value DECIMAL(18,2) NOT NULL,
    data_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, metric_id, time_id, region_id, product_id, data_date)
);

-- 自然语言查询模板表
CREATE TABLE nl_query_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_pattern TEXT NOT NULL, -- 自然语言模式
    sql_template TEXT NOT NULL, -- SQL模板
    required_entities JSONB, -- 需要的实体类型
    category VARCHAR(100), -- 查询类别
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 实体同义词表（支持自然语言理解）
CREATE TABLE entity_synonyms (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL, -- 实体类型：metric, dimension, role等
    entity_id INTEGER NOT NULL, -- 实体ID
    synonym VARCHAR(200) NOT NULL, -- 同义词
    language VARCHAR(20) DEFAULT 'zh-CN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, synonym)
);

-- 插入基础数据

-- 角色数据
INSERT INTO roles (role_name, role_code, region, level) VALUES
('中国农业银行', 'ABC_HEAD_OFFICE', '全国', 1),
('广东省分行', 'ABC_GUANGDONG_BRANCH', '广东省', 2),
('广州市分行', 'ABC_GUANGZHOU_BRANCH', '广州市', 2),
('深圳市分行', 'ABC_SHENZHEN_BRANCH', '深圳市', 2),
('北京分行', 'ABC_BEIJING_BRANCH', '北京市', 2),
('上海分行', 'ABC_SHANGHAI_BRANCH', '上海市', 2);

-- 指标数据
INSERT INTO metrics (metric_name, metric_code, category, unit, description) VALUES
('贷款人数', 'LOAN_CUSTOMER_COUNT', '贷款业务', '人', '贷款客户数量'),
('存款余额', 'DEPOSIT_BALANCE', '存款业务', '万元', '存款总余额'),
('贷款余额', 'LOAN_BALANCE', '贷款业务', '万元', '贷款总余额'),
('新增客户数', 'NEW_CUSTOMER_COUNT', '客户业务', '人', '新增客户数量'),
('不良贷款率', 'NPL_RATIO', '风险指标', '%', '不良贷款占比'),
('客户满意度', 'CUSTOMER_SATISFACTION', '服务质量', '分', '客户满意度评分'),
('营业收入', 'OPERATING_INCOME', '财务指标', '万元', '营业收入'),
('净利润', 'NET_PROFIT', '财务指标', '万元', '净利润');

-- 维度数据
INSERT INTO dimensions (dimension_name, dimension_code) VALUES
('时间', 'TIME'),
('地区', 'REGION'),
('产品', 'PRODUCT'),
('机构', 'ORGANIZATION'),
('客户类型', 'CUSTOMER_TYPE');

-- 时间维度数据（生成最近2年的数据）
INSERT INTO dim_time (date, year, quarter, month, month_name, day, week_day, week_day_name)
SELECT 
    generate_series::date as date,
    EXTRACT(YEAR FROM generate_series) as year,
    EXTRACT(QUARTER FROM generate_series) as quarter,
    EXTRACT(MONTH FROM generate_series) as month,
    TO_CHAR(generate_series, 'MM月') as month_name,
    EXTRACT(DAY FROM generate_series) as day,
    EXTRACT(DOW FROM generate_series) as week_day,
    CASE 
        WHEN EXTRACT(DOW FROM generate_series) = 0 THEN '周日'
        WHEN EXTRACT(DOW FROM generate_series) = 1 THEN '周一'
        WHEN EXTRACT(DOW FROM generate_series) = 2 THEN '周二'
        WHEN EXTRACT(DOW FROM generate_series) = 3 THEN '周三'
        WHEN EXTRACT(DOW FROM generate_series) = 4 THEN '周四'
        WHEN EXTRACT(DOW FROM generate_series) = 5 THEN '周五'
        ELSE '周六'
    END as week_day_name
FROM generate_series(CURRENT_DATE - INTERVAL '2 years', CURRENT_DATE, '1 day');

-- 地区维度数据
INSERT INTO dim_region (region_code, region_name, region_level) VALUES
('GD', '广东省', 1),
('GD_GZ', '广州市', 2),
('GD_SZ', '深圳市', 2),
('GD_FS', '佛山市', 2),
('GD_ZH', '珠海市', 2),
('BJ', '北京市', 1),
('SH', '上海市', 1);

-- 产品维度数据
INSERT INTO dim_product (product_code, product_name, product_category) VALUES
('PERSONAL_LOAN', '个人贷款', '贷款'),
('MORTGAGE_LOAN', '住房贷款', '贷款'),
('CONSUMER_LOAN', '消费贷款', '贷款'),
('DEPOSIT_CURRENT', '活期存款', '存款'),
('DEPOSIT_FIXED', '定期存款', '存款'),
('WEALTH_MANAGEMENT', '理财产品', '理财');

-- 自然语言查询模板
INSERT INTO nl_query_templates (template_name, template_pattern, sql_template, required_entities, category, description) VALUES
('时间对比查询', '{metric}在{time1}和{time2}的对比', 
 'SELECT t1.metric_value as value1, t2.metric_value as value2, 
         ((t2.metric_value - t1.metric_value) / t1.metric_value * 100) as change_rate
  FROM fact_bank_metrics t1
  JOIN fact_bank_metrics t2 ON t1.role_id = t2.role_id 
    AND t1.metric_id = t2.metric_id 
    AND t1.region_id = t2.region_id 
    AND t1.product_id = t2.product_id
  WHERE t1.metric_id = (SELECT id FROM metrics WHERE metric_code = ''{metric}'')
    AND t1.data_date = ''{time1}''
    AND t2.data_date = ''{time2}''',
 '[{"type": "metric"}, {"type": "time"}, {"type": "time"}]', 'comparison', '比较两个时间点的指标变化'),

('地区指标查询', '{region}的{metric}', 
 'SELECT r.region_name, m.metric_name, f.metric_value, f.data_date
  FROM fact_bank_metrics f
  JOIN roles r ON f.role_id = r.id
  JOIN metrics m ON f.metric_id = m.id
  JOIN dim_region reg ON f.region_id = reg.id
  WHERE reg.region_name LIKE ''%{region}%''
    AND m.metric_name LIKE ''%{metric}%''
  ORDER BY f.data_date DESC
  LIMIT 10',
 '[{"type": "region"}, {"type": "metric"}]', 'regional', '查询特定地区的指标数据'),

('机构指标查询', '{organization}的{metric}', 
 'SELECT r.role_name, m.metric_name, f.metric_value, f.data_date
  FROM fact_bank_metrics f
  JOIN roles r ON f.role_id = r.id
  JOIN metrics m ON f.metric_id = m.id
  WHERE r.role_name LIKE ''%{organization}%''
    AND m.metric_name LIKE ''%{metric}%''
  ORDER BY f.data_date DESC
  LIMIT 10',
 '[{"type": "organization"}, {"type": "metric"}]', 'organizational', '查询特定机构的指标数据');

-- 实体同义词数据
INSERT INTO entity_synonyms (entity_type, entity_id, synonym) VALUES
-- 指标同义词
('metric', 1, '贷款客户数'), ('metric', 1, '贷款客户数量'), ('metric', 1, '贷款人数'),
('metric', 2, '存款'), ('metric', 2, '存款总额'), ('metric', 2, '存款余额'),
('metric', 3, '贷款'), ('metric', 3, '贷款总额'), ('metric', 3, '贷款余额'),
-- 地区同义词
('region', 1, '广东'), ('region', 1, '广东省'), ('region', 1, '粤'),
('region', 2, '广州'), ('region', 2, '广州市'), ('region', 2, '羊城'),
('region', 3, '深圳'), ('region', 3, '深圳市'), ('region', 3, '鹏城'),
-- 机构同义词
('organization', 1, '农行'), ('organization', 1, '农业银行'), ('organization', 1, '中国农业银行'),
('organization', 2, '广东分行'), ('organization', 2, '广东省分行'), ('organization', 2, '农行广东分行');

-- 创建索引优化查询性能
CREATE INDEX idx_fact_metrics_role ON fact_bank_metrics(role_id);
CREATE INDEX idx_fact_metrics_metric ON fact_bank_metrics(metric_id);
CREATE INDEX idx_fact_metrics_time ON fact_bank_metrics(time_id);
CREATE INDEX idx_fact_metrics_region ON fact_bank_metrics(region_id);
CREATE INDEX idx_fact_metrics_date ON fact_bank_metrics(data_date);
CREATE INDEX idx_entity_synonyms_type ON entity_synonyms(entity_type, synonym);