import type {
  ChatCompletionMessageParam,
  ChatCompletionChunk,
} from "openai/resources";

import { AzureOpenAI, OpenAI } from "openai";
import { Stream } from "openai/streaming";

import { Message, ModelSetting } from "../types";

// Initialize the appropriate client based on api_type
const createClient = (settings: ModelSetting) => {
  if (settings.api_type === "azure") {
    return new AzureOpenAI({
      apiKey: settings.apiKey,
      baseURL: settings.baseUrl + "/openai",
      deployment: settings.azureDeployment || settings.model,
      apiVersion: settings.azureApiVersion,
      dangerouslyAllowBrowser: true,
    });
  } else {
    return new OpenAI({
      apiKey: settings.apiKey,
      baseURL: settings.baseUrl,
      dangerouslyAllowBrowser: true,
    });
  }
};

// Enhanced function to fetch available models with loading state callbacks
export const fetchModels = async (
  settings: ModelSetting,
  callbacks?: {
    onStart?: () => void;
    onSuccess?: (data: Array<{ id: string }>) => void;
    onError?: (error: any) => void;
    onComplete?: () => void;
  },
) => {
  if (!settings.apiKey || !settings.baseUrl) {
    throw new Error("API key and base URL are required to fetch models");
  }

  try {
    // Call the start callback if provided
    if (callbacks?.onStart) callbacks.onStart();

    const client = createClient(settings);
    const modelsList = await client.models.list();

    // Call the success callback if provided
    if (callbacks?.onSuccess) callbacks.onSuccess(modelsList.data);

    return modelsList.data;
  } catch (error) {
    console.error("Failed to fetch models:", error);

    // Call the error callback if provided
    if (callbacks?.onError) callbacks.onError(error);

    throw error;
  } finally {
    // Call the complete callback if provided
    if (callbacks?.onComplete) callbacks.onComplete();
  }
};

export const chatCompletion = async (
  messages: Message[],
  settings: ModelSetting,
  userLanguage?: string,
  onToken?: (token: string) => void,
): Promise<string> => {
  try {
    const client = createClient(settings);

    // Format messages according to OpenAI API requirements
    const formattedMessages = messages.map((m) => {
      // For string contents, return simple object
      if (typeof m.content === "string") {
        return {
          role: m.role as "user" | "assistant",
          content: `Here is the User's Question
            ${m.content}
            You MUST respond in ${userLanguage || "en-US"} language.
            `,
        };
      } else {
        // For array content with text and images, format according to OpenAI API
        return {
          role: m.role as "user" | "assistant",
          content: m.content.map((item) => {
            if (item.type === "text") {
              return {
                type: "text",
                text: `Here is the User's Question
                  ${item.text}
                  You MUST respond in ${userLanguage || "en-US"} language.`,
              };
            } else if (item.type === "image_url" && item.image_url) {
              return { type: "image_url", image_url: item.image_url };
            }

            return item;
          }),
        };
      }
    });

    // 基本請求配置
    const requestOptions = {
      model: settings.model,
      messages: formattedMessages as any, // Type assertion to bypass strict checking
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    };

    console.log("Sending request to:", settings.baseUrl);

    // 檢查是否需要串流模式
    if (onToken) {
      // Create streaming request with proper typing
      const streamingOptions = {
        ...requestOptions,
        stream: true,
      };

      // Explicitly type the response as a Stream of ChatCompletionChunk
      const stream = (await client.chat.completions.create(
        streamingOptions,
      )) as unknown as Stream<ChatCompletionChunk>;

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content) {
          onToken(content);
          fullResponse += content;
        }
      }

      return fullResponse;
    } else {
      const responses = await client.chat.completions.create(
        requestOptions as any,
      );

      return responses.choices[0].message.content || "";
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

/**
 * Detect the task type from user message
 * @param message User message to analyze
 * @param settings Model settings
 * @returns Task type: "canvas", "image", or "chat"
 */
export const detectTaskType = async (
  message: string,
  settings: ModelSetting,
): Promise<"canvas" | "image" | "chat"> => {
  try {
    const client = createClient(settings);

    // System message to instruct the AI
    const assistantMessage: ChatCompletionMessageParam = {
      role: "assistant",
      content: `
        Please divide the user's message into three task types: 'canvas', 'image', or 'chat'.
        1. Determine if the user is asking for generating an image
          YES -> response with 'image'
          NO -> continue
        2. Will the answer be answered within a few lines?
          YES -> response with 'chat'
          NO -> continue
        3. Will the answer contain any code blocks or markdown?
          YES -> response with 'canvas'
          NO -> continue
        4. Otherwise, response with 'chat'

        Notice:
          - Canvas is a popout window that allows users to write code or markdown.
          - Respond with ONLY one of these exact words: 'canvas', 'image', or 'chat'.

        Here are some examples:
        Q: Tell me what this image is about?
        A: chat

        Q: Generate a picture of a cat.
        A: image

        Q: Write a function to calculate the sum of two numbers.
        A: canvas

        Q: Write me a plan for a trip to Japan.
        A: canvas
        `,
    };

    // User message to analyze
    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: message,
    };

    // Create the request with low temperature for more deterministic results
    const response = await client.chat.completions.create({
      model: settings.model,
      messages: [assistantMessage, userMessage],
      temperature: 0.1, // Low temperature for more deterministic response
      max_tokens: 10, // We only need a short response
    });

    // Extract and clean the response
    const taskType =
      response.choices[0].message.content?.trim().toLowerCase() || "chat";

    // Ensure we only return one of our expected types
    if (taskType === "canvas") return "canvas";
    if (taskType === "image") return "image";

    return "chat"; // Default to chat for any other response
  } catch (error) {
    console.error("Error detecting task type:", error);

    // Default to chat mode if there's an error
    return "chat";
  }
};

/**
 * Detect the user's language from the first message
 * @param message User's first message
 * @param settings Model settings
 * @returns Language code, e.g., zh-TW, en-US, ja-JP
 */
export const detectUserLang = async (
  message: string,
  settings: ModelSetting,
): Promise<string> => {
  try {
    const client = createClient(settings);
    const assistantMessage: ChatCompletionMessageParam = {
      role: "assistant",
      content:
        "Detect the language of the following user message. Respond ONLY with the language code (e.g., zh-TW, en-US, ja-JP, ko-KR, fr-FR, etc). No explanation, no extra text.",
    };
    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: message,
    };
    const response = await client.chat.completions.create({
      model: settings.model,
      messages: [assistantMessage, userMessage],
      temperature: 0.1,
      max_tokens: 10,
    });
    const lang = response.choices[0].message.content?.trim();

    return lang || "en-US";
  } catch (error) {
    console.error("Error detecting user language:", error);

    return "en-US";
  }
};

/**
 * Refine a user prompt for better image generation
 * @param originalPrompt The original prompt from the user
 * @param settings Model settings
 * @returns A refined prompt optimized for image generation
 */
export const refineImagePrompt = async (
  originalPrompt: string,
  settings: ModelSetting,
): Promise<string> => {
  try {
    const client = createClient(settings);

    // System message to instruct the AI how to refine the prompt
    const assistantMessage: ChatCompletionMessageParam = {
      role: "assistant",
      content:
        "You are a prompt engineering expert specializing in optimizing image generation prompts. " +
        "Your task is to refine the user's input into a detailed, clear prompt that will produce high-quality images. " +
        "Include details about style, lighting, composition, colors, and other visual elements as appropriate. " +
        "Make the prompt specific and vivid, but maintain the user's original intent. " +
        "Respond with ONLY the refined prompt text, no explanations or additional text.",
    };

    // User message with the original prompt
    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: originalPrompt,
    };

    // Request the refined prompt with focused temperature
    const response = await client.chat.completions.create({
      model: settings.model,
      messages: [assistantMessage, userMessage],
      temperature: 0.7, // Balanced between creativity and consistency
      max_tokens: 500, // Allow for a detailed prompt
    });

    // Extract the refined prompt
    const refinedPrompt =
      response.choices[0].message.content?.trim() || originalPrompt;

    return refinedPrompt;
  } catch (error) {
    console.error("Error refining image prompt:", error);

    // Fall back to the original prompt if refinement fails
    return originalPrompt;
  }
};

/**
 * Generate an image based on the prompt and then use the image in chat completion to get a description
 * @param prompt The prompt for image generation
 * @param settings Model settings
 * @param onToken Optional callback for streaming text response tokens
 * @returns Object containing the image URL and text response
 */
export const generateImageAndText = async (
  prompt: string,
  settings: ModelSetting,
  userLanguage?: string,
  onToken?: (token: string) => void,
): Promise<{ imageUrl: string; textResponse: string }> => {
  try {
    const client = createClient(settings);

    // Step 1: Refine the user's prompt for better image generation
    const refinedPrompt = await refineImagePrompt(prompt, settings);

    // Step 2: Generate the image using the refined prompt
    const imageResponse = await client.images.generate({
      prompt: refinedPrompt,
      n: 1,
      model: "dall-e-3", // Using DALL-E 3 model
      response_format: "url", // Request URL rather than base64
      size: "1024x1024", // Add size parameter for better quality
    });

    // Add a check to ensure imageResponse.data is defined
    if (!imageResponse.data) {
      throw new Error("No data received from the API");
    }

    // Extract the URL from the response
    const imageUrl = imageResponse.data[0]?.url;

    if (!imageUrl) {
      throw new Error("No image URL received from the API");
    }

    console.log("Image generated successfully, now getting description");

    // Step 3: Use the image in chat completion to generate a description
    const imageAssistantMessage: Message = {
      id: "image-assistant",
      role: "assistant",
      content: `The image has been generated by you. Please describe the image in detail what it generates.`,
    };

    // Create message content with both text and image URL reference
    const userMessage: Message = {
      id: "image-user-message",
      role: "user",
      content: [
        {
          type: "text",
          text: `Please describe this image that was generated based on the prompt: "${prompt}" in users language.`,
        },
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
          },
        },
      ],
    };

    // Send the message with the image to chat completion
    const textResponse = await chatCompletion(
      [imageAssistantMessage, userMessage],
      settings,
      userLanguage,
      onToken,
    );

    return {
      imageUrl,
      textResponse: textResponse || "Image generated successfully.",
    };
  } catch (error) {
    console.error("Error generating image and text:", error);
    throw error;
  }
};

/**
 * Generate a title for a code block based on the user's message
 * @param message User's first message
 * @param settings Model settings
 * @returns Title for the code block
 */
export const generateCodeBlockTitle = async (
  message: string,
  settings: ModelSetting,
): Promise<string> => {
  try {
    const client = createClient(settings);
    const assistantMessage: ChatCompletionMessageParam = {
      role: "assistant",
      content: `You are an assistant that helps name code snippets concisely.`,
    };
    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: `Given this code snippet, provide a short, file name that describes what the code does.
        Don't include words like "code", "function", "class", etc.
        For example: xxx.py
        Here is the code block:\n${message}
        `,
    };
    const response = await client.chat.completions.create({
      model: settings.model,
      messages: [assistantMessage, userMessage],
      temperature: 0.1,
      max_tokens: 10,
    });
    const title = response.choices[0].message.content?.trim();

    console.log("Generated title:", title);

    return title || "Unknown Code Snippet";
  } catch (error) {
    console.error("Error generating code block title:", error);

    return "Unknown Code Snippet";
  }
};
