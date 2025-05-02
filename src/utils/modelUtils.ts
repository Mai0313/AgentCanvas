import { ModelSetting, APIType } from "../types";

/**
 * Creates model settings with environment variables
 * @param model Optional model name to override default
 * @returns ModelSetting object with all required properties
 */
export function getDefaultModelSettings(
  model: string = "gpt-4o",
): ModelSetting {
  // In Vite, we can use default values instead of requiring environment variables
  // This allows the application to run without throwing errors when env vars are missing
  return {
    api_type: (import.meta.env.VITE_API_TYPE as APIType) || "openai",
    model,
    baseUrl: import.meta.env.VITE_BASE_URL || "https://api.openai.com/v1",
    apiKey: import.meta.env.VITE_API_KEY || "",
    temperature: parseFloat(import.meta.env.VITE_TEMPERATURE || "0.7"),
    maxTokens: parseInt(import.meta.env.VITE_MAX_TOKENS || "2000"),
    azureDeployment: import.meta.env.VITE_AZURE_DEPLOYMENT || "",
    azureApiVersion: import.meta.env.VITE_AZURE_API_VERSION || "",
  };
}
