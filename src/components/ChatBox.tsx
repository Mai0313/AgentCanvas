import React, { useState, useRef, useEffect } from "react";

import { Message, ModelSetting, MessageContent } from "../types";
import sendMessageIcon from "../assets/icon/send-message.svg";

import MessageItem from "./MessageItem";
// 導入圖標

interface ChatBoxProps {
  messages: Message[];
  settings: ModelSetting;
  onSendMessage: (content: string | MessageContent[]) => void;
  isLoading: boolean;
  streamingMessageId?: string | null;
  editingMessageId?: string | null;
  longestCodeBlockPosition?: { start: number; end: number } | null;
  toggleMarkdownCanvas: (messageId: string, content: string) => void;
  // 新增的消息操作功能
  onCopy?: (content: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string, modelName?: string) => void;
  fetchModels?: () => Promise<string[]>; // 動態獲取可用模型的函數
  currentModel?: string; // 當前使用的模型
  isLoadingModels?: boolean; // 是否正在載入模型
}

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  settings,
  onSendMessage,
  isLoading,
  streamingMessageId,
  editingMessageId,
  longestCodeBlockPosition,
  toggleMarkdownCanvas,
  onCopy,
  onEdit,
  onDelete,
  onRegenerate,
  fetchModels,
  currentModel,
  isLoadingModels,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [pastedImages, setPastedImages] = useState<
    { url: string; file: File }[]
  >([]);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 檢測用戶是否位於對話底部
  const isNearBottom = () => {
    const container = messagesContainerRef.current;

    if (!container) return true;

    const threshold = 100; // 像素閾值

    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  };

  // 追踪用戶是否手動滾動的狀態
  const userScrolledRef = useRef(false);

  // 追踪是否應該自動滾動的狀態（只有特定情況才啟用）
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // 監聽滾動事件，判斷是否應該自動滾動
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    const handleScroll = () => {
      // 僅當用戶滾動到接近底部時，才重新啟用自動滾動
      if (isNearBottom()) {
        setAutoScrollEnabled(true);
        userScrolledRef.current = false;
      } else {
        // 用戶不在底部，禁用自動滾動
        setAutoScrollEnabled(false);
        userScrolledRef.current = true;
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 消息更新時的滾动處理
  useEffect(() => {
    // 只在以下情況才滾動到底部：
    // 1. 新消息到達（如發送新消息）且未被用戶手動禁用自動滾動
    // 2. Streaming 內容更新且用戶之前就在底部（autoScrollEnabled 為 true）
    const hasNewMessages = messages.length > prevMessagesLength;
    const isStreaming = !!streamingMessageId;

    // 如果是全新的消息（不是更新現有消息），重置滾動狀態
    if (hasNewMessages && messages.length !== prevMessagesLength) {
      // 發送新消息時，無條件滾動到底部一次
      scrollToBottom();
      setAutoScrollEnabled(true);
      userScrolledRef.current = false;
    }
    // 如果是 streaming 更新，只在用戶未手動滾動時才滾動
    else if (isStreaming && autoScrollEnabled && !userScrolledRef.current) {
      scrollToBottom();
    }

    setPrevMessagesLength(messages.length);
  }, [messages, streamingMessageId, prevMessagesLength, autoScrollEnabled]);

  // 添加用戶手動滾動的監聽器
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    const handleUserScroll = () => {
      // 如果正在 streaming 並且用戶向上滾動，標記為用戶主動滾動
      if (streamingMessageId && !isNearBottom()) {
        userScrolledRef.current = true;
        setAutoScrollEnabled(false);
      }
      // 如果用戶滾動到接近底部，重置標記
      else if (isNearBottom()) {
        userScrolledRef.current = false;
        setAutoScrollEnabled(true);
      }
    };

    // 使用節流函數來減少滾動事件的頻繁觸發
    let scrollTimeout: NodeJS.Timeout | null = null;
    const throttledScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleUserScroll();
          scrollTimeout = null;
        }, 100);
      }
    };

    container.addEventListener("scroll", throttledScroll);

    return () => {
      container.removeEventListener("scroll", throttledScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [streamingMessageId]);

  // 新增：監聽自定義事件，從 MarkdownCanvas 獲取選中的文字
  useEffect(() => {
    const handleSetQuotedText = (event: Event) => {
      const customEvent = event as CustomEvent<{ quotedText: string }>;

      if (customEvent.detail && customEvent.detail.quotedText) {
        setQuotedText(customEvent.detail.quotedText);
      }
    };

    //

    // 註冊全局事件監聽器
    document.addEventListener(
      "setQuotedText",
      handleSetQuotedText as EventListener,
    );

    // 組件卸載時移除事件監聽器
    return () => {
      document.removeEventListener(
        "setQuotedText",
        handleSetQuotedText as EventListener,
      );
    };
  }, []);

  // Handle paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            e.preventDefault(); // Prevent default paste behavior

            const file = items[i].getAsFile();

            if (!file) continue;

            try {
              // Read the file as base64
              const reader = new FileReader();

              reader.onload = (event) => {
                if (event.target && event.target.result) {
                  const imageUrl = event.target.result as string;

                  setPastedImages((prev) => [...prev, { url: imageUrl, file }]);
                }
              };
              reader.readAsDataURL(file);
            } catch (error) {
              console.error("Error processing pasted image:", error);
            }
          }
        }
      }
    };

    const textarea = textAreaRef.current;

    if (textarea) {
      // Using 'as unknown as EventListener' to handle type incompatibility
      textarea.addEventListener(
        "paste",
        handlePaste as unknown as EventListener,
      );
    }

    return () => {
      if (textarea) {
        // Using 'as unknown as EventListener' to handle type incompatibility
        textarea.removeEventListener(
          "paste",
          handlePaste as unknown as EventListener,
        );
      }
    };
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputValue.trim() || pastedImages.length > 0) {
      // Regular text message or text with images
      let messageToSend: string | MessageContent[] = inputValue.trim();

      if (quotedText) {
        messageToSend = `> ${quotedText}\n\n${messageToSend}`;
      }

      // If we have pasted images, format as a MessageContent array
      if (pastedImages.length > 0) {
        const contentArray: MessageContent[] = [];

        // Add text content if any
        if (messageToSend) {
          contentArray.push({
            type: "text",
            text: messageToSend,
          });
        }

        // Add all pasted images
        pastedImages.forEach((image) => {
          contentArray.push({
            type: "image_url",
            image_url: {
              url: image.url,
            },
          });
        });

        messageToSend = contentArray;
      }

      onSendMessage(messageToSend);

      setInputValue("");
      setQuotedText(null);
      setPastedImages([]);
      // 用戶發送消息後設置為自動滾動到底部
      setAutoScrollEnabled(true);
      userScrolledRef.current = false;
    }
  };

  // Handle text selection for Ask GPT feature
  const handleAskGpt = (selectedText: string) => {
    setQuotedText(selectedText);
    // Focus the input field after setting the quoted text
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  // Function to remove quoted text
  const removeQuotedText = () => {
    setQuotedText(null);
  };

  // Function to remove a pasted image
  const removeImage = (index: number) => {
    setPastedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="chat-box">
      <div ref={messagesContainerRef} className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h2>Start a conversation with {settings.model}</h2>
            <p>Type your message below to begin</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              currentModel={currentModel}
              isEditing={editingMessageId === message.id}
              isLoadingModels={isLoadingModels}
              isStreaming={streamingMessageId === message.id}
              longestCodeBlockPosition={
                message.id === editingMessageId ? longestCodeBlockPosition : null
              }
              message={message}
              toggleMarkdownCanvas={() => {
                if (typeof message.content === "string") {
                  toggleMarkdownCanvas(message.id, message.content);
                }
              }}
              onDelete={onDelete}
              onEdit={onEdit}
              onAskGpt={handleAskGpt}
              // 傳遞新的消息操作功能
              onCopy={onCopy}
              onRegenerate={onRegenerate}
              // 傳遞模型相關數據
              fetchModels={fetchModels}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        {quotedText && (
          <div className="quoted-text-container">
            <div className="quoted-text">
              <div className="quote-marker" />
              <div className="quote-content">
                {quotedText.length > 100
                  ? quotedText.substring(0, 100) + "..."
                  : quotedText}
              </div>
              <button
                className="quote-remove-button"
                onClick={removeQuotedText}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {pastedImages.length > 0 && (
          <div className="pasted-images-container">
            {pastedImages.map((image, index) => (
              <div key={index} className="pasted-image-item">
                <img
                  alt={`Pasted ${index + 1}`}
                  className="pasted-image-preview"
                  src={image.url}
                />
                <button
                  className="image-remove-button"
                  onClick={() => removeImage(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="input-row">
          <textarea
            ref={textAreaRef}
            disabled={isLoading}
            placeholder={
              quotedText
                ? "Ask about the selected text..."
                : pastedImages.length > 0
                  ? "Add a description for your image..."
                  : "Type your message or paste an image (Ctrl+V)..."
            }
            rows={3}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onCompositionEnd={() => setIsComposing(false)}
            onCompositionStart={() => setIsComposing(true)}
            onKeyDown={(e) => {
              // Only handle Enter key when not in IME composition
              if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            aria-label='Send message'
            type='submit'
            className='send-button'
            // Fix the mixed operator precedence with parentheses
            disabled={(!inputValue.trim() && pastedImages.length === 0) || isLoading}
          >
            <img alt="Send" className="icon-2xl" src={sendMessageIcon} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
