import React, { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Image } from "@heroui/image";
import { Tooltip } from "@heroui/tooltip";

import { Message, ModelSetting, MessageContent } from "../types";

import MessageItem from "./MessageItem";
import SplitText from "./SplitText";

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

// File icon for document files
const FileIcon = (props: any) => {
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
        d="M15.7161 16.2234H8.49609"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M15.7161 12.0369H8.49609"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M11.2521 7.86011H8.49707"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M15.2954 2H8.8894C6.9994 2 5.45938 3.54 5.45938 5.43V18.57C5.45938 20.46 6.9594 22 8.8494 22H15.2954C17.1854 22 18.6854 20.46 18.6854 18.57V5.43C18.6854 3.54 17.1854 2 15.2954 2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
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
    { url: string; file: File; type: string }[]
  >([]);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [showImageFeedback, setShowImageFeedback] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Show paste hint after a few seconds if there are no messages yet
  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        setShowPasteHint(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowPasteHint(false);
    }
  }, [messages.length]);

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

  // Handle paste events directly in the input element
  useEffect(() => {
    const handlePasteInInput = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        let hasImageOrFile = false;

        for (let i = 0; i < items.length; i++) {
          // Check if this is an image or other file
          if (items[i].kind === "file") {
            const file = items[i].getAsFile();

            if (!file) continue;

            hasImageOrFile = true;
            e.preventDefault(); // Prevent default paste behavior for image files

            try {
              // Read the file as base64
              const reader = new FileReader();
              const fileType = items[i].type;

              reader.onload = (event) => {
                if (event.target && event.target.result) {
                  const dataUrl = event.target.result as string;

                  setPastedImages((prev) => [
                    ...prev,
                    {
                      url: dataUrl,
                      file,
                      type: fileType,
                    },
                  ]);

                  // Show visual feedback that image was pasted successfully
                  setShowImageFeedback(true);
                  setTimeout(() => setShowImageFeedback(false), 1500);
                }
              };

              reader.readAsDataURL(file);
            } catch (error) {
              console.error("Error processing pasted file:", error);
            }
          }
        }

        // If no image was found, let default behavior handle text paste
        if (!hasImageOrFile) {
          // Default behavior will handle text paste
        }
      }
    };

    // 只在输入框本身添加监听器，避免重复处理粘贴事件
    const inputElement = inputRef.current;

    if (inputElement) {
      inputElement.addEventListener(
        "paste",
        handlePasteInInput as EventListener,
      );
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener(
          "paste",
          handlePasteInInput as EventListener,
        );
      }
    };
  }, []);

  // Handle drag and drop for images
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files) {
        const files = e.dataTransfer.files;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileType = file.type;

          try {
            const reader = new FileReader();

            reader.onload = (event) => {
              if (event.target && event.target.result) {
                const dataUrl = event.target.result as string;

                setPastedImages((prev) => [
                  ...prev,
                  {
                    url: dataUrl,
                    file,
                    type: fileType,
                  },
                ]);
              }
            };

            reader.readAsDataURL(file);
          } catch (error) {
            console.error("Error processing dropped file:", error);
          }
        }
      }
    };

    const dropZone = dropZoneRef.current;
    const container = messagesContainerRef.current;

    if (dropZone) {
      dropZone.addEventListener("dragover", handleDragOver as EventListener);
      dropZone.addEventListener("dragleave", handleDragLeave as EventListener);
      dropZone.addEventListener("drop", handleDrop as EventListener);
    }

    if (container) {
      container.addEventListener("dragover", handleDragOver as EventListener);
      container.addEventListener("dragleave", handleDragLeave as EventListener);
      container.addEventListener("drop", handleDrop as EventListener);
    }

    return () => {
      if (dropZone) {
        dropZone.removeEventListener(
          "dragover",
          handleDragOver as EventListener,
        );
        dropZone.removeEventListener(
          "dragleave",
          handleDragLeave as EventListener,
        );
        dropZone.removeEventListener("drop", handleDrop as EventListener);
      }

      if (container) {
        container.removeEventListener(
          "dragover",
          handleDragOver as EventListener,
        );
        container.removeEventListener(
          "dragleave",
          handleDragLeave as EventListener,
        );
        container.removeEventListener("drop", handleDrop as EventListener);
      }
    };
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (inputValue.trim() || pastedImages.length > 0) {
      // 添加转场动画
      if (messages.length === 0) {
        setIsTransitioning(true);
        // 延迟发送消息，让动画有时间运行
        setTimeout(() => {
          sendMessage();
          // 动画结束后重置状态
          setTimeout(() => {
            setIsTransitioning(false);
          }, 500); // 匹配CSS动画的持续时间
        }, 300);
      } else {
        sendMessage();
      }
    }
  };

  const sendMessage = () => {
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
        if (image.type.startsWith("image/")) {
          contentArray.push({
            type: "image_url",
            image_url: {
              url: image.url,
            },
          });
        } else {
          // For non-image files, add them as text mentioning the file
          contentArray.push({
            type: "text",
            text: `[Attached file: ${image.file.name}]`,
          });
        }
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
    <div ref={dropZoneRef} className="chat-box w-full h-full flex flex-col">
      <div
        ref={messagesContainerRef}
        className={`messages-container flex-grow rounded-lg p-4 overflow-auto relative ${
          isDragging ? "border-2 border-dashed border-primary" : ""
        } transition-all duration-500`}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-sm z-10">
            <div className="text-center p-6 bg-background/80 rounded-lg shadow-lg">
              <ImageIcon className="text-primary text-4xl mx-auto mb-2" />
              <p className="text-xl font-bold">Drop images or files here</p>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Card
              className={`transition-transform-background flex flex-col relative overflow-hidden h-auto text-foreground box-border bg-background dark:bg-background outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 shadow-medium rounded-large transition-transform-background motion-reduce:transition-none w-full max-w-2xl p-8 text-center bg-gradient-to-br from-primary-400/20 to-secondary-400/20 ${
                isTransitioning
                  ? "opacity-0 transition-opacity duration-500"
                  : "opacity-100 transition-opacity duration-500"
              }`}
            >
              <h2 className="text-xl font-bold mb-4">
                <SplitText
                  animationFrom={{
                    opacity: 0,
                    transform: "translate3d(0,30px,0)",
                  }}
                  animationTo={{
                    opacity: 1,
                    transform: "translate3d(0,0,0)",
                  }}
                  className="inline-block"
                  delay={40}
                  easing="easeOutCubic"
                  text={`Start a conversation with ${settings.model || "AI"}`}
                />
              </h2>

              {showPasteHint && (
                <div className="mb-4 p-3 bg-default-100 rounded-lg text-default-800 text-sm">
                  <SplitText
                    animationFrom={{
                      opacity: 0,
                      transform: "translate3d(0,20px,0)",
                    }}
                    animationTo={{
                      opacity: 1,
                      transform: "translate3d(0,0,0)",
                    }}
                    className="inline-block"
                    delay={20}
                    easing="easeOutCubic"
                    text="💡 Tip: You can paste images with Ctrl+V or drag & drop files into the chat!"
                  />
                </div>
              )}

              {/* 初始輸入框 - 當沒有消息時顯示在中央 */}
              <div className="mt-4 w-full">
                {pastedImages.length > 0 && (
                  <div className="pasted-images-preview mb-3">
                    <div className="flex flex-wrap gap-2 rounded-lg">
                      {pastedImages.map((image, index) => (
                        <div
                          key={index}
                          className="pasted-image-item relative group"
                        >
                          {image.type.startsWith("image/") ? (
                            <div className="relative">
                              <Image
                                alt={`Pasted ${index + 1}`}
                                className="pasted-image-preview h-16 w-auto object-cover rounded-md border border-default-200"
                                src={image.url}
                                width={80}
                              />
                              <button
                                aria-label="Remove image"
                                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center bg-black/50 dark:bg-white/30 text-white dark:text-black opacity-80 hover:opacity-100 transition-opacity duration-200"
                                onClick={() => removeImage(index)}
                              >
                                <CloseIcon />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="flex items-center justify-center h-16 w-16 rounded-md border border-default-200 p-1">
                                <Tooltip content={image.file.name}>
                                  <div className="text-center">
                                    <FileIcon className="text-xl mb-1" />
                                    <p className="text-xs truncate max-w-[60px]">
                                      {image.file.name.length > 8
                                        ? `${image.file.name.substring(0, 5)}...`
                                        : image.file.name}
                                    </p>
                                  </div>
                                </Tooltip>
                              </div>
                              <button
                                aria-label="Remove image"
                                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center bg-black/50 dark:bg-white/30 text-white dark:text-black opacity-80 hover:opacity-100 transition-opacity duration-200"
                                onClick={() => removeImage(index)}
                              >
                                <CloseIcon />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <form
                  className="initial-chat-form w-full"
                  onSubmit={handleSubmit}
                >
                  <div
                    ref={inputContainerRef}
                    className={`custom-input-container relative ${
                      showImageFeedback
                        ? "animate-pulse border border-primary"
                        : ""
                    }`}
                  >
                    <input
                      ref={inputRef}
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-800 rounded-full border-none outline-none text-foreground placeholder:text-foreground/60 shadow-md backdrop-blur-xl"
                      disabled={isLoading}
                      placeholder="詢問任何問題"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onCompositionEnd={() => setIsComposing(false)}
                      onCompositionStart={() => setIsComposing(true)}
                      onKeyDown={handleKeyDown}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        aria-label="Voice input"
                        className="p-2 rounded-full bg-transparent text-foreground/70 hover:text-foreground/90 transition-colors"
                        type="button"
                      >
                        <svg
                          fill="none"
                          height="21"
                          viewBox="0 0 16 21"
                          width="16"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8 0.5C9.66 0.5 11 1.84 11 3.5V10.5C11 12.16 9.66 13.5 8 13.5C6.34 13.5 5 12.16 5 10.5V3.5C5 1.84 6.34 0.5 8 0.5ZM8 17C11.87 17 15 13.87 15 10H16.5C16.5 14.41 13.41 18.09 9.21 18.89V20.5H6.79V18.88C2.59 18.09 -0.5 14.41 -0.5 10H1C1 13.87 4.13 17 8 17Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                      <button
                        aria-label="Send message"
                        className="p-2 rounded-full bg-[#0084ff] hover:bg-[#0077e6] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={
                          (!inputValue.trim() && pastedImages.length === 0) ||
                          isLoading
                        }
                        type="submit"
                      >
                        <SendIcon />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        ) : (
          <div
            className={`chat-messages transition-opacity duration-500 ${
              messages.length === 1 && !isTransitioning ? "animate-fadeIn" : ""
            }`}
          >
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                currentModel={currentModel}
                fetchModels={fetchModels}
                isEditing={editingMessageId === message.id}
                isLoadingModels={isLoadingModels}
                isStreaming={streamingMessageId === message.id}
                longestCodeBlockPosition={
                  message.id === editingMessageId
                    ? longestCodeBlockPosition
                    : null
                }
                message={message}
                toggleMarkdownCanvas={() => {
                  if (typeof message.content === "string") {
                    toggleMarkdownCanvas(message.id, message.content);
                  }
                }}
                onAskGpt={handleAskGpt}
                onCopy={onCopy}
                onDelete={onDelete}
                onEdit={onEdit}
                onRegenerate={onRegenerate}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 當有消息時，在底部顯示輸入框 */}
      {messages.length > 0 && (
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
                  aria-label="Remove quoted text"
                  color="danger"
                  size="sm"
                  variant="light"
                  onClick={removeQuotedText}
                >
                  <CloseIcon />
                </Button>
              </div>
            </Card>
          )}

          {pastedImages.length > 0 && (
            <div className="pasted-images-container mb-2">
              <div className="flex flex-wrap gap-2 rounded-lg">
                {pastedImages.map((image, index) => (
                  <div key={index} className="pasted-image-item relative group">
                    {image.type.startsWith("image/") ? (
                      <div className="relative">
                        <Image
                          alt={`Pasted ${index + 1}`}
                          className="pasted-image-preview h-20 w-auto object-cover rounded-md border border-default-200"
                          src={image.url}
                          width={100}
                        />
                        <button
                          aria-label="Remove image"
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center bg-black/50 dark:bg-white/30 text-white dark:text-black opacity-80 hover:opacity-100 transition-opacity duration-200"
                          onClick={() => removeImage(index)}
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex items-center justify-center h-20 w-20 rounded-md border border-default-200 p-2">
                          <Tooltip content={image.file.name}>
                            <div className="text-center">
                              <FileIcon className="text-2xl mb-1" />
                              <p className="text-xs truncate max-w-[70px]">
                                {image.file.name.length > 10
                                  ? `${image.file.name.substring(0, 7)}...`
                                  : image.file.name}
                              </p>
                            </div>
                          </Tooltip>
                        </div>
                        <button
                          aria-label="Remove image"
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center bg-black/50 dark:bg-white/30 text-white dark:text-black opacity-80 hover:opacity-100 transition-opacity duration-200"
                          onClick={() => removeImage(index)}
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="input-row flex items-center gap-2">
            <div
              ref={inputContainerRef}
              className={`custom-input-container relative flex-grow ${
                showImageFeedback ? "animate-pulse border border-primary" : ""
              }`}
            >
              <input
                ref={inputRef}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-800 rounded-full border-none outline-none text-foreground placeholder:text-foreground/60 shadow-md backdrop-blur-xl"
                disabled={isLoading}
                placeholder={
                  quotedText
                    ? "詢問關於所選文本的問題..."
                    : pastedImages.length > 0
                      ? "為您的圖片添加描述..."
                      : "詢問任何問題"
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onCompositionEnd={() => setIsComposing(false)}
                onCompositionStart={() => setIsComposing(true)}
                onKeyDown={handleKeyDown}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  aria-label="Voice input"
                  className="p-2 rounded-full bg-transparent text-foreground/70 hover:text-foreground/90 transition-colors"
                  type="button"
                >
                  <svg
                    fill="none"
                    height="21"
                    viewBox="0 0 16 21"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 0.5C9.66 0.5 11 1.84 11 3.5V10.5C11 12.16 9.66 13.5 8 13.5C6.34 13.5 5 12.16 5 10.5V3.5C5 1.84 6.34 0.5 8 0.5ZM8 17C11.87 17 15 13.87 15 10H16.5C16.5 14.41 13.41 18.09 9.21 18.89V20.5H6.79V18.88C2.59 18.09 -0.5 14.41 -0.5 10H1C1 13.87 4.13 17 8 17Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <button
                  aria-label="Send message"
                  className="p-2 rounded-full bg-[#0084ff] hover:bg-[#0077e6] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={
                    (!inputValue.trim() && pastedImages.length === 0) ||
                    isLoading
                  }
                  type="submit"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

// 添加全局CSS样式
const style = document.createElement("style");

style.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
`;
document.head.appendChild(style);

export default ChatBox;
