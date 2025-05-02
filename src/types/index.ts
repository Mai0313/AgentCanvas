import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | MessageContent[];
  timestamp: Date;
  imageUrl?: string; // Add support for images
  isGeneratingImage?: boolean; // 添加標記，表示正在生成圖片
  isGeneratingCode?: boolean; // 添加標記，表示正在生成代碼到 MarkdownCanvas
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
