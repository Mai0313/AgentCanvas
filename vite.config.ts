import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  preview: {
    // 允許所有主機
    allowedHosts: ["mtktma.mediatek.inc", "mtktma"],
  },
  build: {
    chunkSizeWarningLimit: 800, // Increase the warning limit to 800KB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group React related packages
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router-dom/")
          ) {
            return "react-vendor";
          }

          // Group Syntax highlighting related packages
          if (
            id.includes("node_modules/react-syntax-highlighter/") ||
            id.includes("node_modules/prismjs/")
          ) {
            return "syntax-highlighter";
          }

          // 修改此處: 將所有語言模組合併到一個 chunk 中而不是分成多個
          if (
            id.includes(
              "node_modules/react-syntax-highlighter/dist/esm/languages/",
            )
          ) {
            return "lang-all";
          }

          // Group BlockNote editor packages
          if (id.includes("node_modules/@blocknote/")) {
            return "blocknote";
          }

          // Group UI framework packages
          if (
            id.includes("node_modules/@heroui/") ||
            id.includes("node_modules/@mantine/")
          ) {
            return "ui-framework";
          }
        },
      },
    },
    minify: "terser", // Use Terser for better minification results
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true, // Remove debugger statements in production
      },
      // 修改此處: 保留類別名稱和構造函數以避免問題
      keep_classnames: true,
      keep_fnames: true,
    },
  },
});
