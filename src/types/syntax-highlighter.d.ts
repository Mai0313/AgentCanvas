/**
 * Type declarations for react-syntax-highlighter language modules
 * This helps TypeScript recognize the dynamically imported language modules
 */

declare module "react-syntax-highlighter/dist/esm/languages/prism/*" {
  const language: any;
  export default language;
}
