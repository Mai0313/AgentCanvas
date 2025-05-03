/**
 * Utility for lazy loading language modules for syntax highlighting
 * This helps reduce initial bundle size by only loading language definitions when needed
 */

// Map common language aliases to their correct module names
const languageAliases: Record<string, string> = {
  // JavaScript and related
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",

  // Web languages
  html: "markup",
  xml: "markup",
  svg: "markup",
  css: "css",
  scss: "scss",
  less: "less",

  // Backend languages
  py: "python",
  rb: "ruby",
  java: "java",
  cs: "csharp",
  php: "php",

  // System languages
  c: "c",
  cpp: "cpp",
  rs: "rust",
  go: "go",
  swift: "swift",

  // Data formats
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  mdx: "markdown",

  // Other languages
  sh: "bash",
  bash: "bash",
  sql: "sql",
};

// Keep track of languages that have already been loaded
const loadedLanguages = new Set<string>();

/**
 * Dynamically load a language module for syntax highlighting
 *
 * @param language The language identifier to load
 * @returns A promise that resolves when the language is loaded
 */
export async function loadLanguage(language: string): Promise<void> {
  // Skip if already loaded
  if (loadedLanguages.has(language)) {
    return;
  }

  // Normalize the language name
  const normalizedLanguage =
    languageAliases[language.toLowerCase()] || language.toLowerCase();

  try {
    // Try to dynamically import the language
    // This uses the Vite dynamic import which will create a separate chunk
    switch (normalizedLanguage) {
      // Web languages - high priority, commonly used
      case "javascript":
        await import(
          "react-syntax-highlighter/dist/esm/languages/prism/javascript"
        );
        break;
      case "typescript":
        await import(
          "react-syntax-highlighter/dist/esm/languages/prism/typescript"
        );
        break;
      case "jsx":
        await import("react-syntax-highlighter/dist/esm/languages/prism/jsx");
        break;
      case "tsx":
        await import("react-syntax-highlighter/dist/esm/languages/prism/tsx");
        break;
      case "css":
        await import("react-syntax-highlighter/dist/esm/languages/prism/css");
        break;
      case "html":
      case "markup":
        await import(
          "react-syntax-highlighter/dist/esm/languages/prism/markup"
        );
        break;

      // Backend languages
      case "python":
        await import(
          "react-syntax-highlighter/dist/esm/languages/prism/python"
        );
        break;
      case "java":
        await import("react-syntax-highlighter/dist/esm/languages/prism/java");
        break;
      case "csharp":
        await import(
          "react-syntax-highlighter/dist/esm/languages/prism/csharp"
        );
        break;
      case "php":
        await import("react-syntax-highlighter/dist/esm/languages/prism/php");
        break;
      case "ruby":
        await import("react-syntax-highlighter/dist/esm/languages/prism/ruby");
        break;

      // System languages
      case "c":
        await import("react-syntax-highlighter/dist/esm/languages/prism/c");
        break;
      case "cpp":
        await import("react-syntax-highlighter/dist/esm/languages/prism/cpp");
        break;
      case "rust":
        await import("react-syntax-highlighter/dist/esm/languages/prism/rust");
        break;
      case "go":
        await import("react-syntax-highlighter/dist/esm/languages/prism/go");
        break;
      case "swift":
        await import("react-syntax-highlighter/dist/esm/languages/prism/swift");
        break;

      // Data formats
      case "json":
        await import("react-syntax-highlighter/dist/esm/languages/prism/json");
        break;
      case "yaml":
        await import("react-syntax-highlighter/dist/esm/languages/prism/yaml");
        break;
      case "markdown":
        await import(
          "react-syntax-highlighter/dist/esm/languages/prism/markdown"
        );
        break;

      // Other languages
      case "bash":
        await import("react-syntax-highlighter/dist/esm/languages/prism/bash");
        break;
      case "sql":
        await import("react-syntax-highlighter/dist/esm/languages/prism/sql");
        break;

      // Default case for unsupported languages
      default:
        console.log(
          `Language '${normalizedLanguage}' not specifically supported for dynamic loading`,
        );

        return;
    }

    // Mark as loaded
    loadedLanguages.add(language);
    loadedLanguages.add(normalizedLanguage);

    console.log(`Successfully loaded language: ${normalizedLanguage}`);
  } catch (error) {
    console.error(
      `Failed to load language module for '${normalizedLanguage}':`,
      error,
    );
  }
}

/**
 * Preload commonly used language modules
 * Can be called during idle time to improve user experience for common languages
 */
export function preloadCommonLanguages(): void {
  // Preload only the most commonly used languages
  setTimeout(() => {
    ["javascript", "typescript", "html", "css"].forEach((lang) => {
      loadLanguage(lang).catch(() => {
        // Silently fail preloading
      });
    });
  }, 2000); // Delay preloading to prioritize initial page load
}
