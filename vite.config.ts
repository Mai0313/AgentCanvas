import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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

          // Split language modules into separate chunks
          // Common web languages
          if (
            id.includes("/javascript") ||
            id.includes("/typescript") ||
            id.includes("/jsx") ||
            id.includes("/tsx")
          ) {
            return "lang-web";
          }

          // Backend languages group
          if (
            id.includes("/python") ||
            id.includes("/java") ||
            id.includes("/csharp") ||
            id.includes("/php") ||
            id.includes("/ruby")
          ) {
            return "lang-backend";
          }

          // System languages group
          if (
            id.includes("/cpp") ||
            id.includes("/c") ||
            id.includes("/rust") ||
            id.includes("/go") ||
            id.includes("/swift")
          ) {
            return "lang-system";
          }

          // Data and markup languages
          if (
            id.includes("/json") ||
            id.includes("/xml") ||
            id.includes("/yaml") ||
            id.includes("/html") ||
            id.includes("/css") ||
            id.includes("/scss") ||
            id.includes("/less") ||
            id.includes("/markdown") ||
            id.includes("/mdx")
          ) {
            return "lang-markup";
          }

          // Other less common languages
          if (
            id.includes("/kotlin") ||
            id.includes("/scala") ||
            id.includes("/haskell") ||
            id.includes("/r") ||
            id.includes("/julia") ||
            id.includes("/wasm") ||
            id.includes("/lua")
          ) {
            return "lang-other";
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
    },
  },
});
