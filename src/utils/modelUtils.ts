import { ModelSetting, APIType } from "../types";

/**
 * Creates model settings with environment variables
 * @param model Optional model name to override default
 * @returns ModelSetting object with all required properties
 * @throws Error if required environment variables are missing
 */
export function getDefaultModelSettings(
  model: string = "gpt-4o",
): ModelSetting {
  // Validate that required environment variables exist
  if (!process.env.REACT_APP_API_TYPE)
    throw new Error("Missing REACT_APP_API_TYPE environment variable");
  if (!process.env.REACT_APP_BASE_URL)
    throw new Error("Missing REACT_APP_BASE_URL environment variable");
  if (!process.env.REACT_APP_API_KEY)
    throw new Error("Missing REACT_APP_API_KEY environment variable");
  if (!process.env.REACT_APP_TEMPERATURE)
    throw new Error("Missing REACT_APP_TEMPERATURE environment variable");
  if (!process.env.REACT_APP_MAX_TOKENS)
    throw new Error("Missing REACT_APP_MAX_TOKENS environment variable");

  // Now TypeScript knows these values can't be undefined
  return {
    api_type: process.env.REACT_APP_API_TYPE as APIType,
    model,
    baseUrl: process.env.REACT_APP_BASE_URL,
    apiKey: process.env.REACT_APP_API_KEY,
    temperature: parseFloat(process.env.REACT_APP_TEMPERATURE),
    maxTokens: parseInt(process.env.REACT_APP_MAX_TOKENS),
    azureDeployment: process.env.REACT_APP_AZURE_DEPLOYMENT || "",
    azureApiVersion: process.env.REACT_APP_AZURE_API_VERSION || "",
  };
}
