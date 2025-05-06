import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | MessageContent[];
  imageUrl?: string; // Add support for images
  // Removed: isGeneratingImage and isGeneratingCode flags
  // These are now managed via GenerationStatusContext
}

export interface MessageContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export type APIType = "openai" | "azure";

export interface ModelSetting {
  api_type: APIType;
  model: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  // Azure OpenAI specific settings
  azureDeployment?: string;
  azureApiVersion?: string;
}
