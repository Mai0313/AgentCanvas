import { v4 as uuidv4 } from "uuid";

import { Message, ModelSetting } from "../types";

import { chatCompletion } from "./openai";

/**
 * 開啟 Markdown 畫布
 */
export const openMarkdownCanvas = (
  messageId: string,
  content: string,
  setMarkdownContent: React.Dispatch<React.SetStateAction<string>>,
  setEditingMessageId: React.Dispatch<React.SetStateAction<string | null>>,
  setIsMarkdownCanvasOpen: React.Dispatch<React.SetStateAction<boolean>>,
  isMarkdownCanvasOpen: boolean,
): void => {
  // 先關閉已存在的畫布以重置狀態
  if (isMarkdownCanvasOpen) {
    setIsMarkdownCanvasOpen(false);
    setEditingMessageId(null);
  }

  // 短暫延遲以確保在不同消息的代碼塊之間平順過渡
  setTimeout(() => {
    setMarkdownContent(content);
    setEditingMessageId(messageId);
    setIsMarkdownCanvasOpen(true);
  }, 50);
};

/**
 * 關閉 Markdown 畫布
 */
export const closeMarkdownCanvas = (
  setIsMarkdownCanvasOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setEditingMessageId: React.Dispatch<React.SetStateAction<string | null>>,
): void => {
  setIsMarkdownCanvasOpen(false);
  setEditingMessageId(null);
};

/**
 * 保存 Markdown 內容
 */
export const saveMarkdownContent = (
  editedContent: string,
  editingMessageId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setMarkdownContent: React.Dispatch<React.SetStateAction<string>>,
): void => {
  setMessages((prev) => {
    const updatedMessages = [...prev];
    const messageIndex = updatedMessages.findIndex(
      (m) => m.id === editingMessageId,
    );

    if (messageIndex !== -1) {
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: editedContent,
      };
    }

    return updatedMessages;
  });

  setMarkdownContent(editedContent);
};

/**
 * 處理 Canvas 模式下的代碼生成
 */
export const handleCanvasMode = async (
  userMessage: Message,
  settings: ModelSetting,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  assistantMessageId: string,
  setMarkdownContent: React.Dispatch<React.SetStateAction<string>>,
  setEditingMessageId: React.Dispatch<React.SetStateAction<string | null>>,
  setIsMarkdownCanvasOpen: React.Dispatch<React.SetStateAction<boolean>>,
  userLanguage?: string, // 新增參數
): Promise<void> => {
  // 步驟 1: 僅生成代碼塊 - 這將直接輸出到 MarkdownCanvas
  let codeBlock = "";
  const codeSystemMessage: Message = {
    id: "system-code-msg",
    role: "system",
    content: `You are a canvas assistant.
      Provide only a single code block solution with language formatting (e.g., \`\`\`javascript).
      Start directly with the code block and do not include any explanations or comments outside the code block.
      Make the solution concise and complete.
      `,
  };

  // 為 MarkdownCanvas 內容創建單獨的消息 ID
  const codeMessageId = uuidv4();

  // 立即打開 MarkdownCanvas 以準備流式輸出
  setMarkdownContent("");
  setEditingMessageId(codeMessageId);
  setIsMarkdownCanvasOpen(true);

  // 使用靜態的占位文本，不再使用 isGeneratingCode 標記
  // 改為在 component 中通過 context 判斷
  setMessages((prev) => {
    const updatedMessages = [...prev];
    const messageIndex = updatedMessages.findIndex(
      (m) => m.id === assistantMessageId,
    );

    if (messageIndex !== -1) {
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: "Generating...", // 使用靜態占位符，防止內容跳動
      };
    }

    return updatedMessages;
  });

  // 步驟1：生成代碼
  try {
    // 第一步：生成代碼並在過程中累積結果
    console.log("用戶語言:", userLanguage);
    console.log("用戶消息ID:", userMessage.id);
    await chatCompletion(
      [codeSystemMessage, userMessage],
      settings,
      "en-US",
      (token) => {
        codeBlock += token;

        // 每收到一個token就更新MarkdownCanvas內容 - 實現真正的流式輸出
        setMarkdownContent(codeBlock);
      },
    );

    // 創建一個代表生成代碼的消息（用於上下文）
    const explanationMessage: Message = {
      id: "assistant-code-explanation",
      role: "assistant",
      content: `You will receive the original question from the user and a generated code block.
        Generated Code Block:
        ${codeBlock}
        Give context on how it works and any important implementation details related to the user's question.
        Don't repeat the code itself, just provide the explanation.
        `,
    };

    // 代碼生成完成，重置ChatBox消息狀態，準備接收解釋文本
    let explanationContent = ""; // 用來累積解釋文本

    // 更新消息狀態，清空內容但保留標記，防止在切換時出現"Loading content..."
    setMessages((prev) => {
      const updatedMessages = [...prev];
      const messageIndex = updatedMessages.findIndex(
        (m) => m.id === assistantMessageId,
      );

      if (messageIndex !== -1) {
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: "", // 清空內容，準備接收解釋文本
        };
      }

      return updatedMessages;
    });

    // 步驟3：生成解釋文本
    await chatCompletion(
      [explanationMessage, userMessage],
      settings,
      userLanguage,
      (token) => {
        // 累積解釋文本
        explanationContent += token;

        // 更新ChatBox中顯示的解釋文本
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const messageIndex = updatedMessages.findIndex(
            (m) => m.id === assistantMessageId,
          );

          if (messageIndex !== -1) {
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              content: explanationContent, // 使用累積的完整內容而不是追加，避免頻繁更新造成的閃爍
            };
          }

          return updatedMessages;
        });
      },
    );
  } catch (error) {
    console.error("Canvas模式處理錯誤:", error);

    // 發生錯誤時，更新消息以顯示錯誤
    setMessages((prev) => {
      const updatedMessages = [...prev];
      const messageIndex = updatedMessages.findIndex(
        (m) => m.id === assistantMessageId,
      );

      if (messageIndex !== -1) {
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          content: "生成代碼或解釋時發生錯誤，請重試。",
        };
      }

      return updatedMessages;
    });
  }
};

/**
 * Canvas模式：用於後續提問（已存在代碼，user追問）
 * 1. 先回答用戶問題（用現有代碼+用戶問題作為上下文）
 * 2. 再判斷是否需要生成新的代碼塊（可選）
 * 3. 若有新代碼則stream到MarkdownCanvas
 */
export const handleCanvasModeNext = async (
  userMessage: Message, // 用戶追問
  existingCode: string, // 當前MarkdownCanvas中的代碼
  settings: ModelSetting,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  assistantMessageId: string,
  setMarkdownContent: React.Dispatch<React.SetStateAction<string>>,
  setEditingMessageId: React.Dispatch<React.SetStateAction<string | null>>,
  setIsMarkdownCanvasOpen: React.Dispatch<React.SetStateAction<boolean>>,
  userLanguage?: string,
): Promise<void> => {
  // 步驟1：先回答用戶問題
  const answerSystemMessage: Message = {
    id: "system-answer-msg",
    role: "system",
    content: `You will receive a pair of code block and user question.
      Please answer the user's question based on this code block.`,
  };
  const codeContextMessage: Message = {
    id: "assistant-code-context",
    role: "assistant",
    content: `Current Code Block:
      ${existingCode}
      User's Question:
      ${userMessage.content}
      Notice
      - You are not allowed to respond with any code block, other agents will handle it.
      - Just provide the answer in plain text.
      For example, if you think the code should be updated, you can make a update suggestion in bullet points; then another agent will handle the code update.
      `,
  };

  let answerContent = "";

  setMessages((prev) => {
    const updated = [...prev];
    const idx = updated.findIndex((m) => m.id === assistantMessageId);

    if (idx !== -1) {
      updated[idx] = {
        ...updated[idx],
        content: "Generating...",
      };
    }

    return updated;
  });

  try {
    // 1. 先生成回答
    await chatCompletion(
      [answerSystemMessage, codeContextMessage],
      settings,
      userLanguage,
      (token) => {
        answerContent += token;
        setMessages((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((m) => m.id === assistantMessageId);

          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              content: answerContent,
            };
          }

          return updated;
        });
      },
    );

    // 2. 生成新代碼塊
    let newCodeBlock = "";
    const codeUpdateMessage: Message = {
      id: "assistant-code-update",
      role: "assistant",
      content: `Current Code Block:
        ${existingCode}
        Update Suggestion:
        ${answerContent}
        Please provide only the updated code block in full as a complete replacement.
        Use language formatting (e.g., \`\`\`js).
        Do not include any explanation or comments outside the code block.
        `,
    };
    const codeMessageId = uuidv4();

    setMarkdownContent("");
    setEditingMessageId(codeMessageId);
    setIsMarkdownCanvasOpen(true);
    await chatCompletion(
      [codeUpdateMessage],
      settings,
      userLanguage,
      (token) => {
        newCodeBlock += token;
        setMarkdownContent(newCodeBlock);
      },
    );
  } catch (error) {
    console.error("Canvas模式(追問)處理錯誤:", error);
    setMessages((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((m) => m.id === assistantMessageId);

      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          content: "生成回答或代碼時發生錯誤，請重試。",
        };
      }

      return updated;
    });
  }
};
