import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | MessageContent[];
  imageUrl?: string; // Add support for images
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
