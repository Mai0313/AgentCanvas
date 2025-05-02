import React, { useState, useRef, useEffect } from "react";
import { Message, ModelSetting, MessageContent } from "../types";
import MessageItem from "./MessageItem";

// Import HeroUI components
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/react";

// Search icon for the input field
const SendIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M20.33 3.66996C20.1408 3.48383 19.9035 3.35608 19.6442 3.30093C19.3849 3.24577 19.1135 3.26635 18.867 3.35996L4.36701 8.83996C4.10848 8.94357 3.88648 9.12511 3.73108 9.35905C3.57567 9.59298 3.49429 9.86831 3.50001 10.15C3.50656 10.4195 3.5938 10.6769 3.74685 10.8923C3.89989 11.1077 4.11258 11.2711 4.36001 11.36L10.05 13.32L12.01 19.02C12.094 19.2645 12.2543 19.4759 12.468 19.6281C12.6817 19.7803 12.9384 19.8647 13.2 19.87H13.27C13.5523 19.8676 13.8243 19.7821 14.0536 19.6259C14.283 19.4698 14.4591 19.2503 14.56 19L20.64 4.49996C20.7667 4.26632 20.8154 3.99549 20.7779 3.7296C20.7403 3.4637 20.6184 3.21711 20.43 3.01996C20.39 2.96996 20.38 2.91996 20.33 3.66996ZM13.22 18.58L11.39 13.29C11.3335 13.1518 11.2254 13.0368 11.09 12.97L5.78001 11.11L18.62 6.18996L13.22 18.58Z"
        fill="currentColor"
      />
    </svg>
  );
};

// Image icon for image paste indicator
const ImageIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M21.68 16.96L18.22 9.06C17.94 8.42 17.49 7.86 16.9 7.45C16.31 7.03 15.61 6.79 14.9 6.75H9.10001C8.39001 6.79 7.69001 7.03 7.10001 7.45C6.51001 7.86 6.06001 8.42 5.78001 9.06L2.32001 16.96C2.00001 17.67 1.91001 18.48 2.07001 19.25C2.23001 20.03 2.63001 20.72 3.20001 21.21C3.68001 21.63 4.28001 21.89 4.90001 21.95C5.52001 22 6.15001 21.86 6.70001 21.55L7.62001 20.97C8.20001 20.65 8.87001 20.5 9.54001 20.5H14.46C15.13 20.5 15.8 20.65 16.38 20.97L17.3 21.55C17.85 21.86 18.48 22 19.1 21.95C19.72 21.89 20.32 21.63 20.8 21.21C21.37 20.72 21.77 20.03 21.93 19.25C22.09 18.48 22 17.67 21.68 16.96ZM19.8 20.1C19.4 20.44 18.81 20.49 18.35 20.21L17.43 19.64C16.61 19.15 15.66 18.89 14.69 18.9H9.31001C8.34001 18.89 7.39001 19.15 6.57001 19.64L5.65001 20.21C5.19001 20.49 4.60001 20.44 4.20001 20.1C3.88001 19.81 3.66001 19.41 3.60001 18.97C3.54001 18.53 3.64001 18.08 3.87001 17.71L7.33001 9.81C7.47001 9.49 7.70001 9.21 7.98001 9.02C8.26001 8.83 8.60001 8.72 8.94001 8.71H15.06C15.4 8.72 15.74 8.83 16.02 9.02C16.3 9.21 16.53 9.49 16.67 9.81L20.13 17.71C20.36 18.08 20.46 18.53 20.4 18.97C20.34 19.41 20.12 19.81 19.8 20.1Z"
        fill="currentColor"
      />
      <path
        d="M12 11.3C11.28 11.3 10.65 11.74 10.35 12.4C10.26 12.63 10.06 12.81 9.81995 12.88C9.57995 12.95 9.32995 12.91 9.12995 12.77C8.92995 12.62 8.80995 12.39 8.79995 12.13C8.78995 11.88 8.88995 11.64 9.06995 11.47C9.64995 10.91 10.41 10.59 11.21 10.59C11.62 10.59 12.01 10.7 12.35 10.91C12.7 11.12 12.97 11.42 13.15 11.78C13.33 12.14 13.41 12.53 13.37 12.93C13.33 13.33 13.18 13.7 12.94 14.02C12.89 14.09 12.79 14.12 12.71 14.09C12.64 14.06 12.59 13.99 12.6 13.91C12.68 13.37 12.57 12.82 12.3 12.35C12.02 11.83 11.54 11.47 10.97 11.35C10.79 11.31 10.6 11.3 10.41 11.3H12Z"
        fill="currentColor"
      />
      <path
        d="M12 14.7C12.83 14.7 13.5 14.03 13.5 13.2C13.5 12.37 12.83 11.7 12 11.7C11.17 11.7 10.5 12.37 10.5 13.2C10.5 14.03 11.17 14.7 12 14.7Z"
        fill="currentColor"
      />
    </svg>
  );
};

// Delete/close icon for removing quoted text or images
const CloseIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M9.17 14.83L14.83 9.17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M14.83 14.83L9.17 9.17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
};

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
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Attach paste event listener to document since HeroUI Input might not directly support ref
    document.addEventListener('paste', handlePaste as unknown as EventListener);

    return () => {
      document.removeEventListener('paste', handlePaste as unknown as EventListener);
    };
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

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
    if (inputRef.current) {
      inputRef.current.focus();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only handle Enter key when not in IME composition and not pressing shift
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-box">
      <div 
        ref={messagesContainerRef} 
        className="messages-container bg-content1 rounded-lg p-4"
      >
        {messages.length === 0 ? (
          <Card className="empty-state p-8 text-center bg-gradient-to-br from-primary-400/20 to-secondary-400/20">
            <h2 className="text-xl font-bold mb-2">Start a conversation with {settings.model}</h2>
            <p className="text-default-500">Type your message below to begin</p>
          </Card>
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

      <form className="chat-input-form mt-4" onSubmit={handleSubmit}>
        {quotedText && (
          <Card className="quoted-text-container mb-2 bg-content2">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <div className="quote-marker w-1 h-full bg-primary rounded-full" />
                <div className="quote-content text-sm">
                  {quotedText.length > 100
                    ? quotedText.substring(0, 100) + "..."
                    : quotedText}
                </div>
              </div>
              <Button 
                isIconOnly
                size="sm" 
                variant="light" 
                color="danger" 
                onClick={removeQuotedText}
                aria-label="Remove quoted text"
              >
                <CloseIcon />
              </Button>
            </div>
          </Card>
        )}

        {pastedImages.length > 0 && (
          <div className="pasted-images-container mb-2 flex flex-wrap gap-2">
            {pastedImages.map((image, index) => (
              <Card key={index} className="pasted-image-item relative group">
                <img
                  alt={`Pasted ${index + 1}`}
                  className="pasted-image-preview h-20 object-cover"
                  src={image.url}
                />
                <Button
                  isIconOnly
                  size="sm"
                  variant="solid"
                  color="danger"
                  className="absolute top-1 right-1 opacity-70 hover:opacity-100"
                  onClick={() => removeImage(index)}
                  aria-label="Remove image"
                >
                  <CloseIcon />
                </Button>
              </Card>
            ))}
          </div>
        )}

        <div className="input-row">
          <Input
            ref={inputRef}
            fullWidth
            disabled={isLoading}
            placeholder={
              quotedText
                ? "Ask about the selected text..."
                : pastedImages.length > 0
                  ? "Add a description for your image..."
                  : "Type your message or paste an image (Ctrl+V)..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onCompositionEnd={() => setIsComposing(false)}
            onCompositionStart={() => setIsComposing(true)}
            onKeyDown={handleKeyDown}
            startContent={
              pastedImages.length > 0 ? (
                <Chip color="primary" variant="flat" size="sm">
                  <ImageIcon className="mr-1" /> {pastedImages.length} {pastedImages.length > 1 ? 'images' : 'image'}
                </Chip>
              ) : null
            }
            endContent={
              <Button
                isIconOnly 
                color="primary"
                type="submit"
                variant="flat"
                size="sm"
                isDisabled={(!inputValue.trim() && pastedImages.length === 0) || isLoading}
                aria-label='Send message'
              >
                <SendIcon />
              </Button>
            }
            classNames={{
              label: "text-black/50 dark:text-white/90",
              input: [
                "bg-transparent",
                "text-black/90 dark:text-white/90",
                "placeholder:text-default-700/50 dark:placeholder:text-white/60",
              ],
              innerWrapper: "bg-transparent",
              inputWrapper: [
                "shadow-sm",
                "bg-default-200/50",
                "dark:bg-default/60",
                "backdrop-blur-xl",
                "backdrop-saturate-200",
                "hover:bg-default-200/70",
                "dark:hover:bg-default/70",
                "group-data-[focus=true]:bg-default-200/50",
                "dark:group-data-[focus=true]:bg-default/60",
                "!cursor-text",
              ],
            }}
          />
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
