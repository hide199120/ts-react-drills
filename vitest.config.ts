import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// SOLUTIONS=1 のときは solutions/ 側（模範解答＋同じテスト）を実行する
const root = process.env.SOLUTIONS ? "solutions" : "exercises";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./setup.ts"],
    include: [`${root}/**/*.test.{ts,tsx}`],
    typecheck: {
      include: [`${root}/**/*.test-d.ts`],
      tsconfig: `./tsconfig.${root}.json`,
      // 未着手の課題の型エラーで他の課題の結果が埋もれないようにする
      ignoreSourceErrors: true,
    },
  },
});
