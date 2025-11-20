// Supabase客户端配置
import { createClient } from '@supabase/supabase-js';

// 获取环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey !== 'your-anon-key'
);

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库操作工具类
export const DatabaseUtils = {
  // 执行原始SQL查询（需要设置数据库函数）
  async executeSQL(sql) {
    try {
      const { data, error } = await supabase.rpc('execute_sql_query', { 
        query: sql 
      });
      
      if (error) {
        throw new Error(`SQL执行失败: ${error.message}`);
      }
      
      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 获取表结构信息
  async getTableSchema(tableName) {
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', tableName);

      if (error) {
        throw error;
      }

      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 批量插入数据
  async batchInsert(tableName, data) {
    try {
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(data);

      if (error) {
        throw error;
      }

      return { success: true, data: inserted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 获取数据库统计信息
  async getDatabaseStats() {
    try {
      const stats = {};
      
      // 获取各表记录数
      const tables = ['metrics', 'dim_region', 'roles', 'fact_bank_metrics'];
      
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          stats[table] = count;
        }
      }

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default DatabaseUtils;