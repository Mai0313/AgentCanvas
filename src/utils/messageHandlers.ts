import { v4 as uuidv4 } from "uuid";
import { Message, ModelSetting } from "../types";
import { chatCompletion, generateImageAndText } from "../services/openai";

/**
 * 處理消息複製功能
 */
export const copyMessage = (content: string, setError: (error: string | null) => void): void => {
  navigator.clipboard.writeText(content).catch((err) => {
    console.error("無法複製內容：", err);
    setError("無法複製到剪貼簿。");
  });
};

/**
 * 處理消息編輯功能
 */
export const editMessage = (
  messageId: string,
  newContent: string,
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
): void => {
  setMessages((prev) => {
    const updatedMessages = [...prev];
    const messageIndex = updatedMessages.findIndex((m) => m.id === messageId);

    if (messageIndex !== -1) {
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: newContent,
      };
    }

    return updatedMessages;
  });
};

/**
 * 處理消息刪除功能
 */
export const deleteMessage = (
  messageId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
): void => {
  setMessages((prev) => {
    const messageIndex = prev.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return prev;

    const updatedMessages = [...prev];
    updatedMessages.splice(messageIndex, 1);
    return updatedMessages;
  });
};

/**
 * 生成圖片處理
 */
export const handleImageGeneration = async (
  messageText: string,
  assistantMessageId: string,
  settings: ModelSetting,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
): Promise<void> => {
  // 處理圖片生成
  const { imageUrl, textResponse } = await generateImageAndText(messageText, settings);

  // 更新消息，包含圖片和描述
  setMessages((prev) => {
    const updatedMessages = [...prev];
    const messageIndex = updatedMessages.findIndex((m) => m.id === assistantMessageId);
    if (messageIndex !== -1) {
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: textResponse,
        imageUrl: imageUrl,
        isGeneratingImage: false, // 移除生成中狀態
      };
    }
    return updatedMessages;
  });
};

/**
 * 處理標準聊天模式的消息生成
 */
export const handleStandardChatMode = async (
  messages: Message[],
  userMessage: Message,
  assistantMessageId: string,
  settings: ModelSetting,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
): Promise<void> => {
  await chatCompletion([...messages, userMessage], settings, (token) => {
    setMessages((prev) => {
      const updatedMessages = [...prev];
      const messageIndex = updatedMessages.findIndex((m) => m.id === assistantMessageId);
      if (messageIndex !== -1) {
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: updatedMessages[messageIndex].content + token,
        };
      }
      return updatedMessages;
    });
  });
};

/**
 * 重新生成消息功能
 */
export const regenerateMessage = async (
  messageId: string,
  modelName: string | undefined,
  messages: Message[],
  settings: ModelSetting,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setStreamingMessageId: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
): Promise<void> => {
  // 找到當前消息及其索引
  const messageIndex = messages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) return;

  // 找到該助手消息之前的用戶消息
  let userMessageIndex = messageIndex - 1;
  while (userMessageIndex >= 0 && messages[userMessageIndex].role !== "user") {
    userMessageIndex--;
  }

  if (userMessageIndex < 0) {
    setError("找不到用戶提問，無法重新生成回應。");
    return;
  }

  // 刪除當前的助手消息
  const updatedMessages = [...messages];
  updatedMessages.splice(messageIndex, 1);
  setMessages(updatedMessages);

  // 重新生成回應
  setIsLoading(true);
  setError(null);

  try {
    const assistantMessageId = uuidv4();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setStreamingMessageId(assistantMessageId);

    // 收集上下文消息，直到並包括用戶消息
    const contextMessages = messages.slice(0, userMessageIndex + 1);

    // 如果指定了模型，則使用該模型
    const settingsToUse = modelName ? { ...settings, model: modelName } : settings;

    await chatCompletion(contextMessages, settingsToUse, (token) => {
      setMessages((prev) => {
        const updatedMsgs = [...prev];
        const msgIndex = updatedMsgs.findIndex((m) => m.id === assistantMessageId);

        if (msgIndex !== -1) {
          updatedMsgs[msgIndex] = {
            ...updatedMsgs[msgIndex],
            content: updatedMsgs[msgIndex].content + token,
          };
        }

        return updatedMsgs;
      });
    });
  } catch (err: any) {
    setError(err.message || "重新生成回應時出錯。請檢查您的設置並重試。");
    console.error("重新生成回應錯誤:", err);
  } finally {
    setIsLoading(false);
    setStreamingMessageId(null);
  }
};
