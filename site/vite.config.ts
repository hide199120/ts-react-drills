import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { drillPlugin } from "./drill-plugin";

const root = path.resolve(import.meta.dirname, "..");

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), drillPlugin()],
  server: {
    port: 5180,
    open: true,
    fs: { allow: [root] },
    watch: {
      // 課題ファイルの保存でページ全体がリロードされないようにする（結果は WebSocket で届く）
      ignored: ["**/node_modules/**", "**/.study/**", "**/solutions/**"],
    },
  },
});
