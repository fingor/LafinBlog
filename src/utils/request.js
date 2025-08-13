// const baseUrl = "https://api.fingor.cn"; // 可选：统一管理基础URL
// const baseUrl = import.meta.env.VITE_API_BASE_URL;
// const baseUrl = ""; // 开发环境使用空字符串，让请求走代理
// 动态处理 URL（开发环境用相对路径，生产环境用绝对路径）


export const $http = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  // 统一设置请求头
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    token,
    // ...(token && { Authorization: `Bearer ${token}` }), // 有token时自动添加
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const res = await response.json();
    // 移除自动提示，让业务层自己处理
    return res;
  } catch (error) {
    console.error("请求失败:", error);
    throw error; // 继续抛出错误供业务层处理
  }
};
