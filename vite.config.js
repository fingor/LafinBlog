import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量（mode 对应启动命令中的 --mode 参数，默认是 'development'）
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [vue()],
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    server: {
      proxy: {
        "/admin": {
          target: env.VITE_API_BASE_URL, // 正确读取环境变量
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/admin/, '') // 按需配置
        },
        "/api": {
          target: env.VITE_API_BASE_URL, // 正确读取环境变量
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""), // 按需配置
        },
      },
    },
  };
});
